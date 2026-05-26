"""
AdaptiveAI — XLS Repository Implementation
=============================================
Concrete implementation of BaseRepository using pandas + openpyxl.
Reads/writes .xlsx files as lightweight database tables.

IMPORTANT DESIGN NOTES:
- Thread-safe with file locking for concurrent access
- Auto-creates sheets with correct schemas if they don't exist
- All operations use pandas DataFrames for in-memory manipulation
- openpyxl handles persistence to disk
- Column types are preserved using schema definitions
"""

import threading
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import pandas as pd
from app.storage.base_repository import BaseRepository
from app.core.exceptions import (
    RecordNotFoundError,
    DuplicateRecordError,
    StorageError,
)
from app.core.logging import get_logger

logger = get_logger("xls_repository")


class XLSRepository(BaseRepository):
    """
    XLS-backed repository implementation.
    Each repository instance manages one .xlsx file (one "table").
    """

    # Class-level lock registry for file-level thread safety
    _locks: dict[str, threading.Lock] = {}
    _locks_lock = threading.Lock()

    def __init__(
        self,
        sheet_name: str,
        id_field: str,
        columns: list[str],
        data_dir: Path,
    ):
        """
        Args:
            sheet_name: Name of the xlsx file (without extension)
            id_field: Primary key column name
            columns: List of all column names for the sheet
            data_dir: Directory where xlsx files are stored
        """
        self.sheet_name = sheet_name
        self.id_field = id_field
        self.columns = columns
        self.file_path = data_dir / f"{sheet_name}.xlsx"

        # Ensure we have a file-level lock
        with XLSRepository._locks_lock:
            if str(self.file_path) not in XLSRepository._locks:
                XLSRepository._locks[str(self.file_path)] = threading.Lock()
        self._lock = XLSRepository._locks[str(self.file_path)]

        # Initialize the file if it doesn't exist
        self._ensure_file_exists()

    def _ensure_file_exists(self):
        """Create the xlsx file with correct headers if it doesn't exist or is corrupted."""
        needs_create = False
        if not self.file_path.exists():
            needs_create = True
        else:
            # Validate existing file is a valid xlsx (zip archive)
            try:
                pd.read_excel(self.file_path, engine="openpyxl", nrows=0)
            except Exception:
                logger.warning(f"Corrupted file detected: {self.sheet_name}.xlsx - recreating")
                self.file_path.unlink(missing_ok=True)
                needs_create = True

        if needs_create:
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            df = pd.DataFrame(columns=self.columns)
            df.to_excel(self.file_path, index=False, engine="openpyxl")
            logger.info(f"Created master sheet: {self.sheet_name}.xlsx")

    def _read_df(self) -> pd.DataFrame:
        """Read the xlsx file into a DataFrame."""
        try:
            df = pd.read_excel(self.file_path, engine="openpyxl")
            # Ensure all expected columns exist
            for col in self.columns:
                if col not in df.columns:
                    df[col] = ""
            return df
        except Exception as e:
            logger.error(f"Error reading {self.sheet_name}: {e}")
            raise StorageError(f"Failed to read {self.sheet_name}: {e}")

    def _write_df(self, df: pd.DataFrame):
        """Write a DataFrame back to the xlsx file."""
        try:
            df.to_excel(self.file_path, index=False, engine="openpyxl")
        except Exception as e:
            logger.error(f"Error writing {self.sheet_name}: {e}")
            raise StorageError(f"Failed to write {self.sheet_name}: {e}")

    def _row_to_dict(self, row: pd.Series) -> dict:
        """Convert a DataFrame row to a clean dictionary."""
        result = {}
        for key, value in row.items():
            if pd.isna(value):
                result[key] = ""
            elif isinstance(value, pd.Timestamp):
                result[key] = value.isoformat()
            else:
                result[key] = value
        return result

    async def insert(self, record: dict) -> str:
        """Insert a new record into the sheet."""
        with self._lock:
            df = self._read_df()

            record_id = record.get(self.id_field, "")

            # Check for duplicates
            if record_id and not df.empty and record_id in df[self.id_field].values:
                raise DuplicateRecordError(f"Record {record_id} already exists in {self.sheet_name}")

            # Ensure record has all columns
            row_data = {}
            for col in self.columns:
                value = record.get(col, "")
                # Convert datetime objects to string for storage
                if isinstance(value, datetime):
                    value = value.isoformat()
                row_data[col] = value

            new_row = pd.DataFrame([row_data])
            df = pd.concat([df, new_row], ignore_index=True)
            self._write_df(df)

            logger.debug(f"Inserted record {record_id} into {self.sheet_name}")
            return record_id

    async def insert_many(self, records: list[dict]) -> list[str]:
        """Insert multiple records into the sheet."""
        if not records:
            return []
        with self._lock:
            df = self._read_df()
            inserted_ids = []
            new_rows = []

            for record in records:
                record_id = record.get(self.id_field, "")
                if record_id and not df.empty and (
                    record_id in df[self.id_field].values or record_id in [r[self.id_field] for r in new_rows if self.id_field in r]
                ):
                    raise DuplicateRecordError(f"Record {record_id} already exists in {self.sheet_name}")

                row_data = {}
                for col in self.columns:
                    value = record.get(col, "")
                    if isinstance(value, datetime):
                        value = value.isoformat()
                    row_data[col] = value

                new_rows.append(row_data)
                inserted_ids.append(record_id)

            if new_rows:
                df = pd.concat([df, pd.DataFrame(new_rows)], ignore_index=True)
                self._write_df(df)

            logger.debug(f"Inserted {len(records)} records into {self.sheet_name}")
            return inserted_ids

    async def find_by_id(self, record_id: str) -> Optional[dict]:
        """Find a record by primary key."""
        with self._lock:
            df = self._read_df()

            if df.empty:
                return None

            # Convert ID column to string for comparison
            df[self.id_field] = df[self.id_field].astype(str).str.strip()
            matches = df[df[self.id_field] == str(record_id).strip()]

            if matches.empty:
                return None

            return self._row_to_dict(matches.iloc[0])

    async def find_all(
        self,
        filters: Optional[dict] = None,
        sort_by: Optional[str] = None,
        sort_desc: bool = False,
        limit: Optional[int] = None,
        offset: int = 0,
    ) -> list[dict]:
        """Retrieve records with optional filtering, sorting, and pagination."""
        with self._lock:
            df = self._read_df()

            if df.empty:
                return []

            # Apply filters
            if filters:
                for field, value in filters.items():
                    if field in df.columns:
                        df = df[df[field].astype(str) == str(value)]

            # Sort
            if sort_by and sort_by in df.columns:
                df = df.sort_values(by=sort_by, ascending=not sort_desc)

            # Pagination
            if offset:
                df = df.iloc[offset:]
            if limit:
                df = df.head(limit)

            return [self._row_to_dict(row) for _, row in df.iterrows()]

    async def update(self, record_id: str, data: dict) -> bool:
        """Update specific fields of a record."""
        with self._lock:
            df = self._read_df()

            if df.empty:
                raise RecordNotFoundError(f"Record {record_id} not found in {self.sheet_name}")

            df[self.id_field] = df[self.id_field].astype(str).str.strip()
            mask = df[self.id_field] == str(record_id).strip()

            if not mask.any():
                raise RecordNotFoundError(f"Record {record_id} not found in {self.sheet_name}")

            for field, value in data.items():
                if field in df.columns and field != self.id_field:
                    if isinstance(value, datetime):
                        value = value.isoformat()
                    df.loc[mask, field] = value

            self._write_df(df)
            logger.debug(f"Updated record {record_id} in {self.sheet_name}")
            return True

    async def delete(self, record_id: str) -> bool:
        """Delete a record by ID."""
        with self._lock:
            df = self._read_df()

            if df.empty:
                raise RecordNotFoundError(f"Record {record_id} not found in {self.sheet_name}")

            df[self.id_field] = df[self.id_field].astype(str).str.strip()
            original_len = len(df)
            df = df[df[self.id_field] != str(record_id).strip()]

            if len(df) == original_len:
                raise RecordNotFoundError(f"Record {record_id} not found in {self.sheet_name}")

            self._write_df(df)
            logger.debug(f"Deleted record {record_id} from {self.sheet_name}")
            return True

    async def count(self, filters: Optional[dict] = None) -> int:
        """Count records matching the filters."""
        with self._lock:
            df = self._read_df()

            if filters:
                for field, value in filters.items():
                    if field in df.columns:
                        df = df[df[field].astype(str) == str(value)]

            return len(df)

    async def search(self, query: str, fields: list[str]) -> list[dict]:
        """Search across specified fields for partial matches (case-insensitive)."""
        with self._lock:
            df = self._read_df()

            if df.empty:
                return []

            query_lower = query.lower()
            mask = pd.Series([False] * len(df))

            for field in fields:
                if field in df.columns:
                    mask = mask | df[field].astype(str).str.lower().str.contains(
                        query_lower, na=False
                    )

            results = df[mask]
            return [self._row_to_dict(row) for _, row in results.iterrows()]

    async def aggregate(
        self, column: str, operation: str, filters: Optional[dict] = None
    ) -> Any:
        """Perform aggregation operations."""
        with self._lock:
            df = self._read_df()

            if filters:
                for field, value in filters.items():
                    if field in df.columns:
                        df = df[df[field].astype(str) == str(value)]

            if column not in df.columns or df.empty:
                return 0

            col = pd.to_numeric(df[column], errors="coerce")

            operations = {
                "sum": col.sum,
                "avg": col.mean,
                "min": col.min,
                "max": col.max,
                "count": lambda: len(col.dropna()),
            }

            func = operations.get(operation)
            if func is None:
                raise StorageError(f"Unknown aggregation operation: {operation}")

            result = func()
            return 0 if pd.isna(result) else result

    async def find_by_field(self, field: str, value: Any) -> list[dict]:
        """Find all records where field matches value (whitespace-tolerant and case-insensitive)."""
        with self._lock:
            df = self._read_df()

            if df.empty or field not in df.columns:
                return []

            val_str = str(value).strip().lower()
            matches = df[df[field].astype(str).str.strip().str.lower() == val_str]
            return [self._row_to_dict(row) for _, row in matches.iterrows()]

"""
AdaptiveAI — Google Sheets Repository Implementation
======================================================
Concrete implementation of BaseRepository using gspread + pandas.
Reads/writes Google Sheets tabs dynamically as cloud database tables.

IMPORTANT DESIGN NOTES:
- Thread-safe with class-level locks
- Drop-in database replacement for XLSRepository
- Combines live cloud reads with local pandas DataFrame manipulation
- Batches all writes to minimize API calls and avoid Google Sheets rate limits
"""

import threading
import os
from datetime import datetime
from typing import Any, Optional

import pandas as pd
import gspread
from google.oauth2.service_account import Credentials

from app.storage.base_repository import BaseRepository
from app.config import get_settings
from app.core.exceptions import (
    RecordNotFoundError,
    DuplicateRecordError,
    StorageError,
)
from app.core.logging import get_logger

logger = get_logger("google_sheets_repository")


class GoogleSheetsRepository(BaseRepository):
    """
    Google Sheets backed repository implementation.
    Each instance manages one tab (worksheet) inside the shared spreadsheet.
    """

    # Class-level lock registry and shared gspread client
    _locks: dict[str, threading.Lock] = {}
    _locks_lock = threading.Lock()
    _gspread_client: Optional[gspread.Client] = None
    _client_lock = threading.Lock()

    # Class-level spreadsheet and worksheets reference cache to avoid repetitive metadata calls
    _spreadsheet: Optional[gspread.Spreadsheet] = None
    _spreadsheet_lock = threading.Lock()
    _worksheets: dict[str, gspread.Worksheet] = {}
    _worksheets_lock = threading.Lock()

    # Class-level read locks for sheet-level read serialization (prevents parallel cache stampede)
    _read_locks: dict[str, threading.Lock] = {}
    _read_locks_lock = threading.Lock()

    # Class-level cache to share reads across instances and prevent rate limiting
    _sheet_cache: dict[str, tuple[pd.DataFrame, float]] = {}
    _cache_lock = threading.Lock()
    _CACHE_TTL_SECONDS = 5.0

    def __init__(
        self,
        sheet_name: str,
        id_field: str,
        columns: list[str],
        data_dir: Any = None,  # Kept for signature compatibility
    ):
        """
        Args:
            sheet_name: Name of the tab (worksheet) in Google Sheets
            id_field: Primary key column name
            columns: List of all column names for the sheet
        """
        self.sheet_name = sheet_name
        self.id_field = id_field
        self.columns = columns

        # Ensure we have a tab-level lock for thread safety
        with GoogleSheetsRepository._locks_lock:
            if self.sheet_name not in GoogleSheetsRepository._locks:
                GoogleSheetsRepository._locks[self.sheet_name] = threading.Lock()
        self._lock = GoogleSheetsRepository._locks[self.sheet_name]

        # Initialize Google Sheets client and ensure tab exists
        self._ensure_tab_exists()

        # Initialize an XLSRepository mirror to keep local spreadsheets synchronized
        from app.storage.xls_repository import XLSRepository
        from app.config import get_settings
        settings = get_settings()
        self.xls_mirror = XLSRepository(
            sheet_name=self.sheet_name,
            id_field=self.id_field,
            columns=self.columns,
            data_dir=settings.data_dir
        )

    @classmethod
    def _get_client(cls) -> gspread.Client:
        """Get or initialize the authorized gspread client (singleton)."""
        with cls._client_lock:
            if cls._gspread_client is None:
                settings = get_settings()
                service_email = settings.GOOGLE_SERVICE_ACCOUNT_EMAIL
                private_key = settings.GOOGLE_PRIVATE_KEY

                if not service_email or not private_key:
                    raise StorageError("Google Sheets Service Account email or private key is missing in config.")

                # Format PEM private key (newlines)
                if private_key.startswith('"') and private_key.endswith('"'):
                    private_key = private_key[1:-1]
                private_key = private_key.replace("\\n", "\n")

                scopes = [
                    "https://www.googleapis.com/auth/spreadsheets",
                    "https://www.googleapis.com/auth/drive"
                ]

                try:
                    logger.info("Authorizing Google Sheets API service account...")
                    creds = Credentials.from_service_account_info({
                        "type": "service_account",
                        "project_id": "inner-lightning-467216-u0",
                        "private_key": private_key,
                        "client_email": service_email,
                        "token_uri": "https://oauth2.googleapis.com/token",
                    }, scopes=scopes)
                    cls._gspread_client = gspread.authorize(creds)
                    logger.info("[OK] Google Sheets API authorized successfully.")
                except Exception as e:
                    logger.error(f"Failed to authorize Google Sheets API: {e}")
                    raise StorageError(f"Google authorization failed: {e}")

            return cls._gspread_client

    @classmethod
    def _get_spreadsheet(cls) -> gspread.Spreadsheet:
        """Get or open the Google Spreadsheet (singleton wrapper)."""
        with cls._spreadsheet_lock:
            if cls._spreadsheet is None:
                client = cls._get_client()
                settings = get_settings()
                logger.info(f"Opening Google Spreadsheet with ID: {settings.GOOGLE_SHEETS_SPREADSHEET_ID}")
                cls._spreadsheet = client.open_by_key(settings.GOOGLE_SHEETS_SPREADSHEET_ID)
            return cls._spreadsheet

    def _get_worksheet(self) -> gspread.Worksheet:
        """Fetch or retrieve the cached worksheet object to save API metadata calls."""
        with GoogleSheetsRepository._worksheets_lock:
            if self.sheet_name not in GoogleSheetsRepository._worksheets:
                spreadsheet = self._get_spreadsheet()
                logger.info(f"Loading worksheet reference: {self.sheet_name}")
                GoogleSheetsRepository._worksheets[self.sheet_name] = spreadsheet.worksheet(self.sheet_name)
            return GoogleSheetsRepository._worksheets[self.sheet_name]

    def _ensure_tab_exists(self):
        """Verify the tab exists in Google Sheets, creating it dynamically with headers if needed."""
        try:
            # Check cached sheets or load worksheet to verify connection
            self._get_worksheet()
            logger.info(f"Connected to Google Sheets tab: {self.sheet_name}")
        except gspread.exceptions.WorksheetNotFound:
            try:
                spreadsheet = self._get_spreadsheet()
                logger.warning(f"Tab '{self.sheet_name}' not found. Dynamically creating it...")
                worksheet = spreadsheet.add_worksheet(title=self.sheet_name, rows=1000, cols=30)
                # Seed headers
                worksheet.update(values=[self.columns], range_name="A1")
                with GoogleSheetsRepository._worksheets_lock:
                    GoogleSheetsRepository._worksheets[self.sheet_name] = worksheet
                logger.info(f"Successfully created and seeded headers for tab '{self.sheet_name}'")
            except Exception as e:
                logger.error(f"Failed to dynamically create sheet '{self.sheet_name}': {e}")
                raise StorageError(f"Database integrity check failed for tab '{self.sheet_name}': {e}")
        except Exception as e:
            logger.error(f"Google Sheets connection integrity check failed: {e}")
            raise StorageError(f"Database integrity check failed for tab '{self.sheet_name}': {e}")

    def _read_df(self) -> pd.DataFrame:
        """Read the live worksheet rows and convert it to a pandas DataFrame (with 5s cache and stamp-locks)."""
        import time
        
        # 1. Fast path: Check cache first without obtaining heavy locks
        with GoogleSheetsRepository._cache_lock:
            if self.sheet_name in GoogleSheetsRepository._sheet_cache:
                df_cached, cache_time = GoogleSheetsRepository._sheet_cache[self.sheet_name]
                if time.time() - cache_time < GoogleSheetsRepository._CACHE_TTL_SECONDS:
                    logger.debug(f"Cache HIT (fast path) for Google Sheet: {self.sheet_name}")
                    return df_cached.copy()

        # 2. Get or create a read stamp-lock for this sheet name to block parallel requests
        with GoogleSheetsRepository._read_locks_lock:
            if self.sheet_name not in GoogleSheetsRepository._read_locks:
                GoogleSheetsRepository._read_locks[self.sheet_name] = threading.Lock()
            read_lock = GoogleSheetsRepository._read_locks[self.sheet_name]

        # 3. Enter read lock to ensure only one active thread hits the Google sheets network API
        with read_lock:
            # Check cache again, as a concurrent parallel thread may have populated it while we waited
            with GoogleSheetsRepository._cache_lock:
                if self.sheet_name in GoogleSheetsRepository._sheet_cache:
                    df_cached, cache_time = GoogleSheetsRepository._sheet_cache[self.sheet_name]
                    if time.time() - cache_time < GoogleSheetsRepository._CACHE_TTL_SECONDS:
                        logger.debug(f"Cache HIT (after lock) for Google Sheet: {self.sheet_name}")
                        return df_cached.copy()

            # Execute the single physical read request
            try:
                worksheet = self._get_worksheet()
                all_values = worksheet.get_all_values()
                
                if not all_values or len(all_values) <= 1:
                    df = pd.DataFrame(columns=self.columns)
                else:
                    headers = all_values[0]
                    rows = all_values[1:]
                    df = pd.DataFrame(rows, columns=headers)
                    
                    # Ensure all expected columns exist in the DataFrame
                    for col in self.columns:
                        if col not in df.columns:
                            df[col] = ""
                    
                    df = df[self.columns]
                
                with GoogleSheetsRepository._cache_lock:
                    GoogleSheetsRepository._sheet_cache[self.sheet_name] = (df.copy(), time.time())
                return df
            except Exception as e:
                logger.error(f"Error reading Google Sheet '{self.sheet_name}': {e}")
                raise StorageError(f"Failed to read Google Sheet '{self.sheet_name}': {e}")

    def _write_df(self, df: pd.DataFrame):
        """Write a DataFrame back to the Google worksheet in a single optimized batch update."""
        import time
        try:
            worksheet = self._get_worksheet()
            # Clean NaN/None values
            df_clean = df.fillna("")
            
            # Convert values to list of lists, including header row
            values = [df_clean.columns.tolist()] + df_clean.astype(str).values.tolist()
            
            worksheet.clear()
            worksheet.update(values=values, range_name="A1")
            
            # Update cache immediately on write so that subsequent requests get updated data instantly
            with GoogleSheetsRepository._cache_lock:
                GoogleSheetsRepository._sheet_cache[self.sheet_name] = (df.copy(), time.time())
        except Exception as e:
            logger.error(f"Error writing Google Sheet '{self.sheet_name}': {e}")
            # Reset cache to force reload on next attempt
            with GoogleSheetsRepository._cache_lock:
                GoogleSheetsRepository._sheet_cache.pop(self.sheet_name, None)
            raise StorageError(f"Failed to write Google Sheet '{self.sheet_name}': {e}")

    def _row_to_dict(self, row: pd.Series) -> dict:
        """Convert a Series row to a clean dictionary."""
        result = {}
        for key, value in row.items():
            if pd.isna(value) or value == "None" or value == "nan":
                result[key] = ""
            elif isinstance(value, pd.Timestamp):
                result[key] = value.isoformat()
            else:
                result[key] = value
        return result

    async def insert(self, record: dict) -> str:
        """Insert a new record into the sheet tab."""
        with self._lock:
            df = self._read_df()

            record_id = record.get(self.id_field, "")

            # Check for duplicate primary keys
            if record_id and not df.empty and record_id in df[self.id_field].astype(str).values:
                raise DuplicateRecordError(f"Record {record_id} already exists in Google Sheet '{self.sheet_name}'")

            # Structure row to match expected columns
            row_data = {}
            for col in self.columns:
                value = record.get(col, "")
                if isinstance(value, datetime):
                    value = value.isoformat()
                row_data[col] = value

            new_row = pd.DataFrame([row_data])
            df = pd.concat([df, new_row], ignore_index=True)
            self._write_df(df)

            # Mirror to local Excel sheet
            try:
                await self.xls_mirror.insert(record)
            except Exception as e:
                logger.error(f"Excel Mirror write failed for {self.sheet_name} insert: {e}")

            logger.debug(f"Inserted record {record_id} into Google Sheet '{self.sheet_name}'")
            return record_id

    async def insert_many(self, records: list[dict]) -> list[str]:
        """Insert multiple records into the sheet tab."""
        if not records:
            return []
        with self._lock:
            df = self._read_df()
            inserted_ids = []
            new_rows = []

            for record in records:
                record_id = record.get(self.id_field, "")
                if record_id and not df.empty and (
                    record_id in df[self.id_field].astype(str).values or record_id in [r[self.id_field] for r in new_rows if self.id_field in r]
                ):
                    raise DuplicateRecordError(f"Record {record_id} already exists in Google Sheet '{self.sheet_name}'")

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

            # Mirror to local Excel sheet
            try:
                await self.xls_mirror.insert_many(records)
            except Exception as e:
                logger.error(f"Excel Mirror write failed for {self.sheet_name} insert_many: {e}")

            logger.debug(f"Inserted {len(records)} records into Google Sheet '{self.sheet_name}'")
            return inserted_ids

    async def find_by_id(self, record_id: str) -> Optional[dict]:
        """Find a record by primary key."""
        with self._lock:
            df = self._read_df()

            if df.empty:
                return None

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
        """Retrieve records with filtering, sorting, and pagination."""
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
                raise RecordNotFoundError(f"Record {record_id} not found in Google Sheet '{self.sheet_name}'")

            df[self.id_field] = df[self.id_field].astype(str).str.strip()
            mask = df[self.id_field] == str(record_id).strip()

            if not mask.any():
                raise RecordNotFoundError(f"Record {record_id} not found in Google Sheet '{self.sheet_name}'")

            for field, value in data.items():
                if field in df.columns and field != self.id_field:
                    if isinstance(value, datetime):
                        value = value.isoformat()
                    df.loc[mask, field] = value

            self._write_df(df)

            # Mirror to local Excel sheet
            try:
                await self.xls_mirror.update(record_id, data)
            except Exception as e:
                logger.error(f"Excel Mirror write failed for {self.sheet_name} update: {e}")

            logger.debug(f"Updated record {record_id} in Google Sheet '{self.sheet_name}'")
            return True

    async def delete(self, record_id: str) -> bool:
        """Delete a record by ID."""
        with self._lock:
            df = self._read_df()

            if df.empty:
                raise RecordNotFoundError(f"Record {record_id} not found in Google Sheet '{self.sheet_name}'")

            df[self.id_field] = df[self.id_field].astype(str).str.strip()
            original_len = len(df)
            df = df[df[self.id_field] != str(record_id).strip()]

            if len(df) == original_len:
                raise RecordNotFoundError(f"Record {record_id} not found in Google Sheet '{self.sheet_name}'")

            self._write_df(df)

            # Mirror to local Excel sheet
            try:
                await self.xls_mirror.delete(record_id)
            except Exception as e:
                logger.error(f"Excel Mirror write failed for {self.sheet_name} delete: {e}")

            logger.debug(f"Deleted record {record_id} from Google Sheet '{self.sheet_name}'")
            return True

    async def count(self, filters: Optional[dict] = None) -> int:
        """Count records matching filters."""
        with self._lock:
            df = self._read_df()

            if filters:
                for field, value in filters.items():
                    if field in df.columns:
                        df = df[df[field].astype(str) == str(value)]

            return len(df)

    async def search(self, query: str, fields: list[str]) -> list[dict]:
        """Search across fields for partial matches (case-insensitive)."""
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

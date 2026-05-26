"""
AdaptiveAI — Base Repository Interface
=========================================
Abstract interface defining ALL storage operations.
Any storage backend (XLS, PostgreSQL, etc.) must implement this.

DESIGN PRINCIPLE:
This interface is the migration boundary. When switching from XLS to PostgreSQL,
only the implementation class changes — all services remain untouched.
"""

from abc import ABC, abstractmethod
from typing import Any, Optional, Type
from pydantic import BaseModel


class BaseRepository(ABC):
    """
    Abstract repository interface.
    All CRUD + query operations are defined here.
    Implementations: XLSRepository (now), SQLRepository (future).
    """

    @abstractmethod
    async def insert(self, record: dict) -> str:
        """
        Insert a new record. Returns the generated ID.
        Raises DuplicateRecordError if ID already exists.
        """
        ...

    @abstractmethod
    async def insert_many(self, records: list[dict]) -> list[str]:
        """
        Insert multiple records. Returns the list of generated IDs.
        """
        ...

    @abstractmethod
    async def find_by_id(self, record_id: str) -> Optional[dict]:
        """
        Find a single record by its primary key.
        Returns None if not found.
        """
        ...

    @abstractmethod
    async def find_all(
        self,
        filters: Optional[dict] = None,
        sort_by: Optional[str] = None,
        sort_desc: bool = False,
        limit: Optional[int] = None,
        offset: int = 0,
    ) -> list[dict]:
        """
        Retrieve multiple records with optional filtering, sorting, and pagination.
        Filters use exact match by default.
        """
        ...

    @abstractmethod
    async def update(self, record_id: str, data: dict) -> bool:
        """
        Update specific fields of a record.
        Returns True if updated, raises RecordNotFoundError if not found.
        """
        ...

    @abstractmethod
    async def delete(self, record_id: str) -> bool:
        """
        Delete a record by ID.
        Returns True if deleted, raises RecordNotFoundError if not found.
        """
        ...

    @abstractmethod
    async def count(self, filters: Optional[dict] = None) -> int:
        """Count records matching the filters."""
        ...

    @abstractmethod
    async def search(self, query: str, fields: list[str]) -> list[dict]:
        """
        Search across specified fields for partial matches.
        Used for semantic/keyword matching.
        """
        ...

    @abstractmethod
    async def aggregate(
        self, column: str, operation: str, filters: Optional[dict] = None
    ) -> Any:
        """
        Perform aggregation: sum, avg, min, max, count.
        Used for trend analysis and scoring.
        """
        ...

    @abstractmethod
    async def find_by_field(self, field: str, value: Any) -> list[dict]:
        """Find all records where field matches value."""
        ...

"""SQLAlchemy declarative base class.

Person 2 imports `Base` from this module when defining domain models in `backend/app/models/`.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy 2.0 ORM models in EcoTwin AI."""
    pass

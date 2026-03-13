"""
Creates all SQLAlchemy tables in the database.
Run this once: python -m ctr_api.db.create_tables
"""
from ctr_api.db.database import engine, Base
from ctr_api.db.models import UserContextData  # noqa: F401 — registers the model

def create_all_tables():
    Base.metadata.create_all(bind=engine)
    print("All SQLAlchemy tables created successfully.")

if __name__ == "__main__":
    create_all_tables()

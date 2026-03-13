from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# MySQL connection — same credentials as Django settings
DATABASE_URL = "mysql+pymysql://root:your_mysql_password@localhost:3306/ad_aggregator_db"

engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_recycle=3600,
    echo=False,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

Base = declarative_base()


def get_db_session():
    """Get a new database session. Caller must close it."""
    return SessionLocal()

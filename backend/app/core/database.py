import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Determine database engine
db_url = settings.DATABASE_URL
connect_args = {}

try:
    if db_url.startswith("postgresql"):
        # Quick probe with 1-second timeout
        test_engine = create_engine(
            db_url, 
            connect_args={"connect_timeout": 1},
            pool_pre_ping=True
        )
        with test_engine.connect() as conn:
            pass
        engine = test_engine
        logger.info("Connected successfully to PostgreSQL database.")
    else:
        if db_url.startswith("sqlite"):
            connect_args = {"check_same_thread": False}
        engine = create_engine(db_url, connect_args=connect_args)
except Exception as e:
    logger.info(
        f"PostgreSQL connection to {db_url} not active. "
        f"Using local SQLite database: {settings.SQLITE_FALLBACK_URL}"
    )
    engine = create_engine(
        settings.SQLITE_FALLBACK_URL, 
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

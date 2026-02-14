from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool

SQLALCHEMY_DATABASE_URI = 'postgresql+psycopg2://axion_user:Axion%232026Secure%21@postgres:5432/axion_db'

engine = create_engine(
    SQLALCHEMY_DATABASE_URI,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600,
    pool_pre_ping=True,
    connect_args={
        "connect_timeout": 10,
        "options": "-c statement_timeout=30000"
    }
)

Session = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

from models import *

Base.metadata.create_all(bind=engine)

def get_db():
    db = Session()
    try:
        yield db
    except Exception as e:
        print(f"[DB ERROR] {e}")
        db.rollback()
        raise
    finally:
        db.close()
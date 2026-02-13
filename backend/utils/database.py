from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URI = 'postgresql+psycopg2://axion_user:Axion%232026Secure%21@postgres:5432/axion_db'

engine = create_engine(
    SQLALCHEMY_DATABASE_URI, pool_pre_ping=True
)

Session = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

from models import *

Base.metadata.create_all(bind=engine)

def get_db():
    db = Session()
    try:
        yield db
    finally:
        db.close()
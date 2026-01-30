from utils.database import Base
from sqlalchemy import Column, String, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from uuid import uuid4
from datetime import datetime, timedelta

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    username = Column(String, nullable=False, unique=True)
    email = Column(String, nullable=False, unique=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    tokens = relationship('Token', back_populates='owner')
    profile_image = Column(String, default="https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg")
    is_online = Column(Boolean, nullable=False, default=False)
    last_seen = Column(DateTime, nullable=False, default=datetime.utcnow)

class Token(Base):
    __tablename__ = "tokens"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    token = Column(String, nullable=False)
    type = Column(String, nullable=False) 
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    owner = relationship('User', back_populates='tokens')

class Friend(Base):
    __tablename__ = "friends"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    requester_id = Column(String, ForeignKey("users.id"), nullable=False)
    addressee_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    requester = relationship("User", foreign_keys=[requester_id])
    addressee = relationship("User", foreign_keys=[addressee_id])

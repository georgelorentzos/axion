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
    last_seen = Column(DateTime, nullable=False, default=datetime.now)
    created_at = Column(DateTime, default=datetime.now)

class Token(Base):
    __tablename__ = "tokens"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    token = Column(String, nullable=False)
    type = Column(String, nullable=False) 
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    expires_at = Column(DateTime, nullable=False)
    owner = relationship('User', back_populates='tokens')

class Friend(Base):
    __tablename__ = "friends"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    requester_id = Column(String, ForeignKey("users.id"), nullable=False)
    addressee_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False, default="pending")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    requester = relationship("User", foreign_keys=[requester_id])
    addressee = relationship("User", foreign_keys=[addressee_id])

class DirectMessage(Base):
    __tablename__ = "directmessages"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(String, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    hidden_by_sender = Column(Boolean, nullable=False, default=False)
    hidden_by_recipient = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.now)
    is_read = Column(Boolean, nullable=False, default=False)
    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])

class ConversationHistory(Base):
    __tablename__ = "conversation_history"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(String, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    hidden_by_sender = Column(Boolean, nullable=False, default=False)
    hidden_by_recipient = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
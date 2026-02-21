from utils.database import Base
from sqlalchemy import Column, String, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime, timedelta
from nanoid import generate

NUMERIC_ALPHABET = '0123456789'

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: generate(NUMERIC_ALPHABET, 20))
    username = Column(String, nullable=False, unique=True)
    email = Column(String, nullable=False, unique=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    tokens = relationship('Token', back_populates='owner')
    profile_image = Column(String, default="https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg")
    is_online = Column(Boolean, nullable=False, default=False)
    last_seen = Column(DateTime, nullable=False, default=datetime.now)
    created_at = Column(DateTime, default=datetime.now)
    communities = relationship('Community', backref="owner")

class Token(Base):
    __tablename__ = "tokens"
    
    id = Column(String, primary_key=True, default=lambda: generate(NUMERIC_ALPHABET, 20))
    token = Column(String, nullable=False)
    type = Column(String, nullable=False) 
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    expires_at = Column(DateTime, nullable=False)
    owner = relationship('User', back_populates='tokens')

class Friend(Base):
    __tablename__ = "friends"

    id = Column(String, primary_key=True, default=lambda: generate(NUMERIC_ALPHABET, 20))
    requester_id = Column(String, ForeignKey("users.id"), nullable=False)
    addressee_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False, default="pending")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    requester = relationship("User", foreign_keys=[requester_id])
    addressee = relationship("User", foreign_keys=[addressee_id])

class DirectMessage(Base):
    __tablename__ = "directmessages"

    id = Column(String, primary_key=True, default=lambda: generate(NUMERIC_ALPHABET, 20))
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
    
    id = Column(String, primary_key=True, default=lambda: generate(NUMERIC_ALPHABET, 20))
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(String, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    hidden_by_sender = Column(Boolean, nullable=False, default=False)
    hidden_by_recipient = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])

class Community(Base):
    __tablename__ = "communities"

    id = Column(String, primary_key=True, default=lambda: generate(NUMERIC_ALPHABET, 20))
    community_name = Column(String, nullable=False)
    community_image = Column(String, nullable=True)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    categories = relationship("CommunityCategory", back_populates="community")
    channels = relationship("CommunityChannel", back_populates="community", foreign_keys="CommunityChannel.community_id")
    roles = relationship("CommunityRole", back_populates="community")

class CommunityCategory(Base):
    __tablename__ = "community_categories"

    id = Column(String, primary_key=True, default=lambda: generate(NUMERIC_ALPHABET, 20))
    category_name = Column(String, nullable=False)
    community_id = Column(String, ForeignKey("communities.id"), nullable=False)
    community = relationship("Community", back_populates="categories")
    channels = relationship("CommunityChannel", back_populates="category")

class CommunityChannel(Base):
    __tablename__ = "community_channels"
    
    id = Column(String, primary_key=True, default=lambda: generate(NUMERIC_ALPHABET, 20))
    channel_name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    community_id = Column(String, ForeignKey("communities.id"), nullable=False)
    category_id = Column(String, ForeignKey("community_categories.id"), nullable=True)
    community = relationship("Community", back_populates="channels")
    category = relationship("CommunityCategory", back_populates="channels")

class CommunityMember(Base):
    __tablename__ = "community_members"

    id = Column(String, primary_key=True, default=lambda: generate(NUMERIC_ALPHABET, 20))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    community_id = Column(String, ForeignKey("communities.id"), nullable=False)
    role = Column(String, default="member")
    joined_at = Column(DateTime, default=datetime.now)

    user = relationship("User")
    community = relationship("Community")
    member_roles = relationship("MemberRole", backref="member")

class CommunityRole(Base):
    __tablename__ = "community_roles"
    id = Column(String, primary_key=True, default=lambda: generate(NUMERIC_ALPHABET, 20))
    role_name = Column(String, nullable=False)
    permissions = Column(JSON, nullable=False, default=lambda: [])
    community_id = Column(String, ForeignKey("communities.id"), nullable=False)
    community = relationship("Community", back_populates="roles")

class MemberRole(Base):
    __tablename__ = "member_roles"
    id = Column(String, primary_key=True, default=lambda: generate(NUMERIC_ALPHABET, 20))
    member_id = Column(String, ForeignKey("community_members.id"), nullable=False)
    role_id = Column(String, ForeignKey("community_roles.id"), nullable=False)
    role = relationship("CommunityRole")
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    skill = Column(String)
    level = Column(Integer, default=1)
    background = Column(String)
    xp = Column(Integer, default=0)
    streak = Column(Integer, default=0)
    hearts = Column(Integer, default=3)
    bronze_keys = Column(Integer, default=0)
    silver_keys = Column(Integer, default=0)
    gold_keys = Column(Integer, default=0)
    is_gym_leader = Column(Boolean, default=False)
    location_enabled = Column(Boolean, default=False)
    neighborhood = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    last_active = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # relationships
    missions = relationship("Mission", back_populates="user")
    learning_paths = relationship("LearningPath", back_populates="user")
    inventory = relationship("Inventory", back_populates="user")
    lootboxes = relationship("LootBox", back_populates="user")
    avatar = relationship("Avatar", back_populates="user", uselist=False)

class Mission(Base):
    __tablename__ = "missions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(String) # YYYY-MM-DD
    article_title = Column(String)
    summary = Column(String)
    questions_json = Column(Text)
    completed = Column(Boolean, default=False)
    score = Column(Integer, nullable=True)

    user = relationship("User", back_populates="missions")

class QuizSession(Base):
    __tablename__ = "quiz_sessions"
    id = Column(Integer, primary_key=True, index=True)
    share_id = Column(String, unique=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"))
    skill = Column(String)
    questions_json = Column(Text)
    creator_score = Column(Integer, nullable=True)
    challenger_score = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class LearningPath(Base):
    __tablename__ = "learning_paths"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    steps_json = Column(Text)
    generated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="learning_paths")

class LootBox(Base):
    __tablename__ = "lootboxes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    tier = Column(String) # bronze/silver/gold
    item_id = Column(String)
    item_name = Column(String)
    item_rarity = Column(String) # common/uncommon/rare/legendary
    item_type = Column(String) # hat/accessory/aura/effect
    skill = Column(String)
    opened = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="lootboxes")

class Inventory(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    item_id = Column(String)
    item_name = Column(String)
    item_rarity = Column(String)
    item_type = Column(String)
    skill = Column(String)
    equipped = Column(Boolean, default=False)
    acquired_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="inventory")

class Avatar(Base):
    __tablename__ = "avatars"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    equipped_hat = Column(String, nullable=True)
    equipped_accessory = Column(String, nullable=True)
    equipped_aura = Column(String, nullable=True)
    equipped_effect = Column(String, nullable=True)
    track_color = Column(String)
    expression = Column(String, default="happy")

    user = relationship("User", back_populates="avatar")

class Trade(Base):
    __tablename__ = "trades"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    sender_item_id = Column(String)
    receiver_item_id = Column(String)
    status = Column(String) # pending/accepted/declined
    requires_irl = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Campaign(Base):
    __tablename__ = "campaigns"
    id = Column(Integer, primary_key=True, index=True)
    room_code = Column(String, unique=True, index=True)
    host_id = Column(Integer, ForeignKey("users.id"))
    skill = Column(String)
    is_public = Column(Boolean, default=False)
    status = Column(String) # lobby/active/complete/failed
    monster_index = Column(Integer, default=0)
    current_monster_hp = Column(Integer, default=3)
    questions_json = Column(Text)
    current_question_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class CampaignPlayer(Base):
    __tablename__ = "campaign_players"
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    hearts = Column(Integer, default=3)
    score = Column(Integer, default=0)
    answered = Column(Boolean, default=False)
    answer_index = Column(Integer, nullable=True)
    joined_at = Column(DateTime, default=datetime.utcnow)

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    clan_id = Column(Integer, ForeignKey("clans.id"), nullable=True)
    content = Column(Text)
    link_url = Column(String, nullable=True)
    link_title = Column(String, nullable=True)
    is_ai = Column(Boolean, default=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class FriendRequest(Base):
    __tablename__ = "friend_requests"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String) # pending/accepted/declined
    created_at = Column(DateTime, default=datetime.utcnow)

class Clan(Base):
    __tablename__ = "clans"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    skill = Column(String)
    description = Column(String)
    host_id = Column(Integer, ForeignKey("users.id"))
    is_active = Column(Boolean, default=False)
    member_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

class ClanMember(Base):
    __tablename__ = "clan_members"
    id = Column(Integer, primary_key=True, index=True)
    clan_id = Column(Integer, ForeignKey("clans.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String) # owner/member
    joined_at = Column(DateTime, default=datetime.utcnow)

class Meetup(Base):
    __tablename__ = "meetups"
    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"))
    invitee_id = Column(Integer, ForeignKey("users.id"))
    venue_name = Column(String)
    venue_address = Column(String)
    venue_lat = Column(Float)
    venue_lng = Column(Float)
    scheduled_time = Column(DateTime)
    skill = Column(String)
    status = Column(String) # pending/confirmed/completed/cancelled
    is_cross_track = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

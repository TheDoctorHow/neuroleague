from pydantic import BaseModel, root_validator
from typing import List, Optional, Any, Dict
from datetime import datetime

class UserBase(BaseModel):
    username: str
    skill: str
    level: int = 1
    background: str

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    xp: int
    streak: int
    hearts: int
    bronze_keys: int
    silver_keys: int
    gold_keys: int
    is_gym_leader: bool
    location_enabled: bool
    neighborhood: Optional[str] = None
    last_active: datetime
    created_at: datetime
    class Config:
        from_attributes = True

class MissionResponse(BaseModel):
    id: int
    date: str
    article_title: str
    summary: str
    questions_json: str
    completed: bool
    score: Optional[int]
    class Config:
        from_attributes = True

class SubmitQuizRequest(BaseModel):
    user_id: int
    mission_id: int
    answers: list[int]

class OpenCrateRequest(BaseModel):
    user_id: int
    tier: str

class EquipItemRequest(BaseModel):
    user_id: int
    item_id: str

class LocationUpdateRequest(BaseModel):
    user_id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_enabled: bool

class MeetupCreateRequest(BaseModel):
    requester_id: int
    invitee_id: int
    venue_name: str
    venue_address: str
    venue_lat: float
    venue_lng: float
    scheduled_time: datetime
    skill: str

class SuggestVenueRequest(BaseModel):
    user1_id: int
    user2_id: int

class TradeCreateRequest(BaseModel):
    sender_id: int
    receiver_id: int
    sender_item_id: str
    receiver_item_id: str

class TradeRespondRequest(BaseModel):
    trade_id: int
    action: str

class TradeConfirmRequest(BaseModel):
    trade_id: int

class ChallengeRequest(BaseModel):
    creator_id: int
    skill: str
    questions_json: str

class AITrainerMessageRequest(BaseModel):
    user_id: int
    message: str

class CoachMessageRequest(BaseModel):
    user_id: int
    message: str

class AIResponse(BaseModel):
    reply: str
    links: Optional[List[Dict[str, str]]] = None
    booking_request: Optional[Dict[str, Any]] = None

class GenericResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

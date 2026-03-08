from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import json
import random
import string

from database import engine, Base, get_db
from models import (
    User, Mission, QuizSession, LearningPath, LootBox, Inventory, Avatar,
    Trade, Campaign, CampaignPlayer, Message, FriendRequest, Clan, ClanMember, Meetup
)
from schemas import (
    UserCreate, UserResponse, MissionResponse, SubmitQuizRequest, OpenCrateRequest,
    EquipItemRequest, LocationUpdateRequest, MeetupCreateRequest, SuggestVenueRequest,
    TradeCreateRequest, TradeRespondRequest, ChallengeRequest, AITrainerMessageRequest,
    CoachMessageRequest, GenericResponse
)
from gemini import (
    get_learning_path, get_daily_mission, get_campaign_questions,
    get_coach_response, get_ai_trainer_response, get_daily_checkin
)
from maps import get_nearby_venues, get_neighborhood, suggest_meetup_venue
from lootbox import roll_rarity, get_random_item

app = FastAPI(title="NeuroLeague API")

# Create tables
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root(): return {"status": "Arcane servers are online"}

@app.post("/onboard", response_model=UserResponse)
def onboard_user(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already summoned.")
    
    new_user = User(
        username=user_data.username, skill=user_data.skill,
        level=user_data.level, background=user_data.background, bronze_keys=1
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    avatar = Avatar(user_id=new_user.id, track_color=new_user.skill)
    db.add(avatar)
    db.commit()
    return new_user

@app.get("/learning-path/{user_id}")
def get_user_learning_path(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
        
    steps = get_learning_path(user.skill, user.level, user.background)
    path_record = LearningPath(user_id=user_id, steps_json=json.dumps(steps))
    db.add(path_record)
    user.bronze_keys += 1
    db.commit()
    return steps

@app.get("/mission/{user_id}")
def get_user_mission(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
        
    mission_data = get_daily_mission(user.skill, user.level)
    if not mission_data: raise HTTPException(status_code=500, detail="The Oracle is unavailable")
        
    mission = Mission(
        user_id=user.id, date=datetime.utcnow().strftime("%Y-%m-%d"),
        article_title=mission_data.get("scroll_title", "Unknown Scroll"),
        summary=mission_data.get("summary", ""),
        questions_json=json.dumps(mission_data.get("questions", []))
    )
    db.add(mission)
    db.commit()
    db.refresh(mission)
    
    return {"mission_id": mission.id, "scroll_title": mission.article_title, "summary": mission.summary, "questions": json.loads(mission.questions_json)}

@app.post("/submit-quiz")
def submit_quiz(req: SubmitQuizRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    
    mission = db.query(Mission).filter(Mission.id == req.mission_id).first()
    if not mission: raise HTTPException(status_code=404, detail="Mission not found")
    
    questions = json.loads(mission.questions_json)
    score = sum(1 for i, q in enumerate(questions) if req.answers[i] == q["correct_index"])
    
    xp_gained = score * 50
    if score == len(questions):
        xp_gained += 50
    
    keys_earned = 0
    user.bronze_keys += 1
    keys_earned += 1
    
    old_level = (user.xp // 500) + 1
    user.xp += xp_gained
    new_level = (user.xp // 500) + 1
    leveled_up = new_level > old_level
    if leveled_up:
        keys_earned += 1
        user.silver_keys += 1
        user.level = new_level
    if score == len(questions):
        keys_earned += 1
        user.silver_keys += 1
    
    mission.completed = True
    mission.score = score
    
    share_id = str(uuid.uuid4())
    quiz_session = QuizSession(
        share_id=share_id,
        creator_id=user.id,
        skill=user.skill,
        questions_json=mission.questions_json,
        creator_score=score
    )
    db.add(quiz_session)
    db.commit()
    
    return {
        "score": score,
        "total": len(questions),
        "xp_gained": xp_gained,
        "keys_earned": keys_earned,
        "share_id": share_id,
        "leveled_up": leveled_up
    }

@app.post("/open-crate")
def open_crate(req: OpenCrateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user: raise HTTPException(status_code=404)
        
    tier = req.tier.lower()
    if tier == "bronze":
        if user.bronze_keys <= 0: raise HTTPException(status_code=400, detail="No keys")
        user.bronze_keys -= 1
    elif tier == "silver":
        if user.silver_keys <= 0: raise HTTPException(status_code=400, detail="No keys")
        user.silver_keys -= 1
    elif tier == "gold":
        if user.gold_keys <= 0: raise HTTPException(status_code=400, detail="No keys")
        user.gold_keys -= 1
        
    rarity = roll_rarity(tier)
    item = get_random_item(user.skill, rarity, allow_cross_track=(tier=="gold"))
    if not item: item = {"id": f"c_fallback", "name": "Mystic Lint", "rarity": "common", "type": "accessory", "css_class": ""}
        
    loot_record = LootBox(user_id=user.id, tier=tier, item_id=item["id"], item_name=item["name"], item_rarity=item["rarity"], item_type=item["type"], skill=user.skill, opened=True)
    inv_record = Inventory(user_id=user.id, item_id=item["id"], item_name=item["name"], item_rarity=item["rarity"], item_type=item["type"], skill=user.skill)
    db.add(loot_record); db.add(inv_record); db.commit()
    
    return {"item": item, "rarity": item["rarity"]}

@app.get("/inventory/{user_id}")
def get_inventory(user_id: int, db: Session = Depends(get_db)):
    return db.query(Inventory).filter(Inventory.user_id == user_id).all()

@app.post("/equip-item")
def equip_item(req: EquipItemRequest, db: Session = Depends(get_db)):
    item = db.query(Inventory).filter(Inventory.user_id == req.user_id, Inventory.item_id == req.item_id).first()
    if not item: raise HTTPException(status_code=404)
        
    avatar = db.query(Avatar).filter(Avatar.user_id == req.user_id).first()
    old_equipped = db.query(Inventory).filter(Inventory.user_id == req.user_id, Inventory.item_type == item.item_type, Inventory.equipped == True).first()
    if old_equipped: old_equipped.equipped = False
        
    item.equipped = True
    if item.item_type == "hat": avatar.equipped_hat = item.item_id
    elif item.item_type == "accessory": avatar.equipped_accessory = item.item_id
    elif item.item_type == "aura": avatar.equipped_aura = item.item_id
    elif item.item_type == "effect": avatar.equipped_effect = item.item_id
    
    db.commit(); db.refresh(avatar)
    return avatar

@app.post("/location/update")
def location_update(req: LocationUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user: raise HTTPException(status_code=404)
        
    user.location_enabled = req.location_enabled
    if req.location_enabled and req.latitude and req.longitude:
        user.neighborhood = get_neighborhood(req.latitude, req.longitude)
        user.latitude = req.latitude
        user.longitude = req.longitude
    else:
        user.neighborhood = None; user.latitude = None; user.longitude = None
        
    db.commit()
    return {"status": "success", "location_enabled": user.location_enabled, "neighborhood": user.neighborhood}

@app.get("/nearby-users/{user_id}")
def nearby_users(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.location_enabled: raise HTTPException(status_code=400)
    others = db.query(User).filter(User.id != user_id, User.location_enabled == True).limit(20).all()
    results = [{"id": o.id, "username": o.username, "skill": o.skill, "level": o.level, "neighborhood": o.neighborhood, "distance": "Nearby"} for o in others]
    return results

@app.get("/nearby-venues/{user_id}")
def nearby_venues(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.location_enabled or not user.latitude: raise HTTPException(status_code=400)
    return get_nearby_venues(user.latitude, user.longitude, user.skill)

@app.post("/meetup/create")
def create_meetup(req: MeetupCreateRequest, db: Session = Depends(get_db)):
    requester = db.query(User).filter(User.id == req.requester_id).first()
    invitee = db.query(User).filter(User.id == req.invitee_id).first()
    is_cross = requester.skill != invitee.skill
    meetup = Meetup(
        requester_id=req.requester_id, invitee_id=req.invitee_id, venue_name=req.venue_name,
        venue_address=req.venue_address, venue_lat=req.venue_lat, venue_lng=req.venue_lng,
        scheduled_time=req.scheduled_time, skill=req.skill, status="pending", is_cross_track=is_cross
    )
    db.add(meetup)
    msg = Message(sender_id=req.requester_id, receiver_id=req.invitee_id, content=f"Meetup invitation at {req.venue_name}")
    db.add(msg); db.commit()
    return {"meetup_id": meetup.id}

@app.post("/meetup/suggest-venue")
def suggest_venue(req: SuggestVenueRequest, db: Session = Depends(get_db)):
    user1 = db.query(User).filter(User.id == req.user1_id).first()
    user2 = db.query(User).filter(User.id == req.user2_id).first()
    return suggest_meetup_venue(user1.latitude, user1.longitude, user2.latitude, user2.longitude, user1.skill)

@app.post("/meetup/respond")
def respond_meetup(meetup_id: int, action: str, db: Session = Depends(get_db)):
    meetup = db.query(Meetup).filter(Meetup.id == meetup_id).first()
    meetup.status = "confirmed" if action == "confirm" else "cancelled"
    db.commit()
    return {"status": meetup.status}

@app.post("/meetup/complete")
def complete_meetup(meetup_id: int, db: Session = Depends(get_db)):
    meetup = db.query(Meetup).filter(Meetup.id == meetup_id).first()
    meetup.status = "completed"
    u1 = db.query(User).filter(User.id == meetup.requester_id).first()
    u2 = db.query(User).filter(User.id == meetup.invitee_id).first()
    if u1: u1.gold_keys += 1
    if u2: u2.gold_keys += 1
    db.commit()
    return {"status": "completed"}

@app.get("/meetup/upcoming/{user_id}")
def upcoming_meetups(user_id: int, db: Session = Depends(get_db)):
    return db.query(Meetup).filter((Meetup.requester_id == user_id) | (Meetup.invitee_id == user_id), Meetup.status == "confirmed").all()

@app.post("/trade/request")
def trade_request(req: TradeCreateRequest, db: Session = Depends(get_db)):
    sender = db.query(User).filter(User.id == req.sender_id).first()
    receiver = db.query(User).filter(User.id == req.receiver_id).first()
    req_irl = sender.skill != receiver.skill or abs(sender.level - receiver.level) > 2
    trade = Trade(sender_id=sender.id, receiver_id=receiver.id, sender_item_id=req.sender_item_id, receiver_item_id=req.receiver_item_id, status="pending", requires_irl=req_irl)
    db.add(trade); db.commit()
    return trade

@app.get("/trade/incoming/{user_id}")
def incoming_trades(user_id: int, db: Session = Depends(get_db)):
    return db.query(Trade).filter(Trade.receiver_id == user_id, Trade.status == "pending").all()

@app.post("/trade/respond")
def trade_respond(req: TradeRespondRequest, db: Session = Depends(get_db)):
    trade = db.query(Trade).filter(Trade.id == req.trade_id).first()
    trade.status = req.action
    if req.action == "accepted" and not trade.requires_irl:
        trade.status = "completed"
        i1 = db.query(Inventory).filter(Inventory.item_id == trade.sender_item_id, Inventory.user_id == trade.sender_id).first()
        i2 = db.query(Inventory).filter(Inventory.item_id == trade.receiver_item_id, Inventory.user_id == trade.receiver_id).first()
        if i1 and i2: i1.user_id, i2.user_id = i2.user_id, i1.user_id; i1.equipped, i2.equipped = False, False
    db.commit()
    return {"status": trade.status, "requires_irl": trade.requires_irl}

@app.post("/challenge")
def create_challenge(req: ChallengeRequest, db: Session = Depends(get_db)):
    share_id = str(uuid.uuid4())
    session = QuizSession(share_id=share_id, creator_id=req.creator_id, skill=req.skill, questions_json=req.questions_json, creator_score=0)
    db.add(session); db.commit()
    return {"share_id": share_id}

@app.get("/challenge/{share_id}")
def get_challenge(share_id: str, db: Session = Depends(get_db)):
    session = db.query(QuizSession).filter(QuizSession.share_id == share_id).first()
    return {"questions": json.loads(session.questions_json)}

@app.get("/results/{share_id}")
def get_results(share_id: str, db: Session = Depends(get_db)):
    session = db.query(QuizSession).filter(QuizSession.share_id == share_id).first()
    return {"creator_score": session.creator_score, "challenger_score": session.challenger_score}

@app.get("/buddies/{user_id}")
def get_buddies(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    return db.query(User).filter(User.skill == user.skill, User.id != user_id).limit(3).all()

@app.get("/leaderboard/{skill}")
def get_leaderboard(skill: str, db: Session = Depends(get_db)):
    q = db.query(User) if skill == "all" else db.query(User).filter(User.skill == skill)
    return q.order_by(User.xp.desc()).limit(10).all()

@app.post("/coach")
def interact_coach(req: CoachMessageRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    return {"reply": get_coach_response(user.skill, user.level, user.xp, user.streak, [], req.message)}

@app.post("/campaign/create")
def create_campaign(host_id: int, skill: str, is_public: bool, db: Session = Depends(get_db)):
    room_code = ''.join(random.choices(string.ascii_uppercase, k=4))
    questions = get_campaign_questions(skill, 1, 0)
    campaign = Campaign(room_code=room_code, host_id=host_id, skill=skill, is_public=is_public, status="lobby", questions_json=json.dumps(questions))
    db.add(campaign); db.commit(); db.refresh(campaign)
    player = CampaignPlayer(campaign_id=campaign.id, user_id=host_id)
    db.add(player); db.commit()
    return {"room_code": room_code, "campaign_id": campaign.id}

@app.get("/campaign/{room_code}")
def get_campaign(room_code: str, db: Session = Depends(get_db)):
    c = db.query(Campaign).filter(Campaign.room_code == room_code).first()
    players = db.query(CampaignPlayer).filter(CampaignPlayer.campaign_id == c.id).all()
    # Mock return basic info so it fits MVP scope
    return {"status": c.status, "monster_hp": c.current_monster_hp, "players": [{"user_id": p.user_id, "hearts": p.hearts} for p in players]}

@app.post("/ai-trainer/message")
def ai_trainer(req: AITrainerMessageRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    reply_json = get_ai_trainer_response(user.skill, user.level, user.xp, user.streak, [], [], req.message)
    msg = Message(sender_id=user.id, content=req.message)
    ai_msg = Message(sender_id=0, receiver_id=user.id, content=reply_json.get("reply", ""), is_ai=True)
    db.add(msg); db.add(ai_msg); db.commit()
    return reply_json

@app.post("/ai-trainer/checkin")
def ai_checkin(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    checkin_json = get_daily_checkin(user.skill, user.level, user.xp, user.streak, [])
    return checkin_json

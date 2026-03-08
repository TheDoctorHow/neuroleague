import google.generativeai as genai

genai.configure(api_key="AIzaSyDn1YZ1dhjAuLSV2aik4BTrcq7oOde7vFs")

for m in genai.list_models():
    if "generateContent" in m.supported_generation_methods:
        print(m.name)

from dotenv import load_dotenv
load_dotenv()
import json
import re
import google.generativeai as genai
from youtubesearchpython import VideosSearch
from config import settings

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    
model = genai.GenerativeModel("models/gemini-2.5-flash")

def clean_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

def get_learning_path(skill: str, level: int, background: str):
    prompt = f"""
    The user wants to learn the '{skill}' track. Current level: {level}/5. Background: "{background}". 
    Return a JSON array of exactly 5 objects, each with: 
    "step" (string, the recommendation title evocative language), 
    "reason" (string, 1 sentence why it fits), 
    "youtube_query" (string, specific YouTube search query). 
    No extra text. JSON only.
    """
    response = model.generate_content(prompt)
    print("RAW GEMINI RESPONSE:", response.text)  # ADD THIS LINE
    try:
        data = json.loads(clean_json(response.text))
        
        # YouTube search disabled — frontend constructs search URL from youtube_query
        for step in data:
            step["video_id"] = None
            step["thumbnail_url"] = None
        return data
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        return []

def get_daily_mission(skill: str, level: int):
    prompt = f"""
    Generate a daily learning mission for someone studying the '{skill}' track at level {level}/5. 
    Return ONLY JSON with: 
    "scroll_title" (string, a dramatic fantasy-flavored knowledge scroll title), 
    "summary" (string, exactly 2 engaging sentences written as arcane knowledge), 
    "questions" (array of exactly 3 objects, each with: "question" string, "options" array of exactly 4 strings, "correct_index" number 0-3). 
    No extra text. JSON only.
    """
    response = model.generate_content(prompt)
    try:
        return json.loads(clean_json(response.text))
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        return None

def get_campaign_questions(skill: str, level: int, monster_index: int):
    prompt = f"""
    Generate campaign questions for a multiplayer boss battle in the '{skill}' track at level {level}/5.
    Monster index is {monster_index}.
    Return a JSON array of exactly 3 questions: 
    Each object should have:
    "question" (str), 
    "options" (array of exactly 4 str), 
    "correct_index" (int 0-3), 
    "monster_name" (str, fantasy themed boss matching the skill), 
    "monster_emoji" (str), 
    "monster_lore" (str, 1 sentence).
    No extra text, JSON only.
    """
    response = model.generate_content(prompt)
    try:
        return json.loads(clean_json(response.text))
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        return []

def get_coach_response(skill: str, level: int, xp: int, streak: int, weak_areas: list, message: str):
    prompt = f"""
    You are an encouraging gaming-persona coach for a player in the '{skill}' track.
    Player stats: Level {level}, XP {xp}, Streak {streak}.
    Identified weak areas: {weak_areas}.
    Player message: "{message}"
    
    Respond in 2-3 sentences. Be encouraging, fantasy-flavored, and game-like.
    """
    response = model.generate_content(prompt)
    return response.text

def get_ai_trainer_response(skill: str, level: int, xp: int, streak: int, weak_areas: list, conversation_history: list, message: str):
    prompt = f"""
    You are an AI Trainer named Sage for the '{skill}' track.
    Player stats: Level {level}, XP {xp}, Streak {streak}, Weaknesses: {weak_areas}.
    Conversation History: {conversation_history}
    Player message: "{message}"
    
    You can recommend study materials with links, suggest IRL meetup scheduling, give quiz prep coaching, answer subject questions directly.
    Return ONLY JSON:
    "reply" (str, your response),
    "links" (array of objects with "title" and "url", or null),
    "booking_request" (object with "suggested_users" (array of usernames) and "suggested_time" (str ISO datetime), or null).
    No markdown, JSON only.
    """
    response = model.generate_content(prompt)
    try:
        return json.loads(clean_json(response.text))
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        return {"reply": "The arcane connection is weak right now.", "links": None, "booking_request": None}

def get_daily_checkin(skill: str, level: int, xp: int, streak: int, recent_scores: list):
    prompt = f"""
    You are Sage, proactively checking in with a '{skill}' student today.
    Level {level}, XP {xp}, Streak {streak}, Recent scores: {recent_scores}.
    Suggest one specific action for today. Use the same JSON output as regular trainer responses.
    JSON format: "reply" (str), "links" (array of objects with "title", "url", null if none), "booking_request" (object with "suggested_users", "suggested_time", null if none).
    """
    response = model.generate_content(prompt)
    try:
        return json.loads(clean_json(response.text))
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        return {"reply": "Welcome back, initiate. Ready to continue your journey?", "links": None, "booking_request": None}

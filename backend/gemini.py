from dotenv import load_dotenv
load_dotenv()
import json
import os
import anthropic

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

def clean_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

def call_claude(prompt: str, max_tokens: int = 1000) -> str:
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text

def get_learning_path(skill: str, level: int, background: str):
    prompt = f"""
    The user wants to learn the '{skill}' track. Current level: {level}/5. Background: "{background}". 
    Return a JSON array of exactly 5 objects, each with: 
    "step" (string, the recommendation title with evocative language), 
    "reason" (string, 1 sentence why it fits), 
    "youtube_query" (string, specific YouTube search query). 
    No extra text. JSON only.
    """
    try:
        response = call_claude(prompt)
        data = json.loads(clean_json(response))
        for step in data:
            step["video_id"] = None
            step["thumbnail_url"] = None
        return data
    except Exception as e:
        print(f"Error parsing Claude response: {e}")
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
    try:
        response = call_claude(prompt)
        return json.loads(clean_json(response))
    except Exception as e:
        print(f"Error parsing Claude response: {e}")
        return None

def get_campaign_questions(skill: str, level: int, monster_index: int):
    prompt = f"""
    Generate campaign questions for a multiplayer boss battle in the '{skill}' track at level {level}/5.
    Monster index is {monster_index}.
    Return a JSON array of exactly 3 questions. 
    Each object should have:
    "question" (str), 
    "options" (array of exactly 4 str), 
    "correct_index" (int 0-3), 
    "monster_name" (str, fantasy themed boss matching the skill), 
    "monster_emoji" (str), 
    "monster_lore" (str, 1 sentence).
    No extra text, JSON only.
    """
    try:
        response = call_claude(prompt)
        return json.loads(clean_json(response))
    except Exception as e:
        print(f"Error parsing Claude response: {e}")
        return []

def get_coach_response(skill: str, level: int, xp: int, streak: int, weak_areas: list, message: str):
    prompt = f"""
    You are an encouraging gaming-persona coach for a player in the '{skill}' track.
    Player stats: Level {level}, XP {xp}, Streak {streak}.
    Identified weak areas: {weak_areas}.
    Player message: "{message}"
    
    Respond in 2-3 sentences. Be encouraging, fantasy-flavored, and game-like.
    """
    try:
        return call_claude(prompt)
    except Exception as e:
        print(f"Error calling Claude: {e}")
        return "The arcane connection is weak right now."

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
    try:
        response = call_claude(prompt)
        return json.loads(clean_json(response))
    except Exception as e:
        print(f"Error parsing Claude response: {e}")
        return {"reply": "The arcane connection is weak right now.", "links": None, "booking_request": None}

def get_daily_checkin(skill: str, level: int, xp: int, streak: int, recent_scores: list):
    prompt = f"""
    You are Sage, proactively checking in with a '{skill}' student today.
    Level {level}, XP {xp}, Streak {streak}, Recent scores: {recent_scores}.
    Suggest one specific action for today.
    JSON format: "reply" (str), "links" (array of objects with "title", "url", null if none), "booking_request" (object with "suggested_users", "suggested_time", null if none).
    No markdown, JSON only.
    """
    try:
        response = call_claude(prompt)
        return json.loads(clean_json(response))
    except Exception as e:
        print(f"Error parsing Claude response: {e}")
        return {"reply": "Welcome back, initiate. Ready to continue your journey?", "links": None, "booking_request": None}

import os
import re

file_path = "c:/Users/yugiu/Desktop/neuroleague/frontend/components/NeuroLeague.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Replace callAI definition
new_api_caller = """
// --- API CALLER ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch(endpoint, method="POST", data=null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" }
  };
  if (data) options.body = JSON.stringify(data);
  const res = await fetch(`${API_URL}${endpoint}`, options);
  if (!res.ok) throw new Error("API Error");
  return await res.json();
}
"""

# Replace old callAI function
code = re.sub(r"// ─── AI CALLER ───.*?(?=\n// ─── ONBOARDING DATA ───)", new_api_caller, code, flags=re.DOTALL)

# Replace learning path call
learning_path_old = """const data = await callAI(
          "You are a mystical learning oracle for a fantasy-themed skill app. Return ONLY valid JSON, no markdown, no extra text. Use slightly evocative language in step titles — words like 'master', 'forge', 'unlock', 'arcane' are fine, but keep content accurate and educational.",
          `The user wants to learn ${user.skillName}. Current level: ${user.level}/5. Background: "${user.background}". Return a JSON array of exactly 5 objects, each with: "step" (string, the recommendation title), "reason" (string, 1 sentence why it fits), "youtube_query" (string, specific YouTube search query). No extra text. JSON only.`
        );
        setPath(Array.isArray(data) ? data : data.steps || []);"""
learning_path_new = """const data = await apiFetch(`/learning-path/${user.id}`, "GET");
        setPath(Array.isArray(data) ? data : data.steps || []);"""
code = code.replace(learning_path_old, learning_path_new)

# Replace mission call
mission_old = """const data = await callAI(
          "You are a fantasy learning oracle generating skill quests. Return ONLY valid JSON, no markdown. Use slightly evocative language in titles (e.g. 'The Art of...', 'Mastering...', 'Secrets of...') but keep all educational content accurate.",
          `Generate a daily learning mission for someone studying ${user.skillName} at level ${user.level}/5. Return ONLY JSON with: "scroll_title" (string, a dramatic fantasy-flavored knowledge scroll title), "summary" (string, exactly 2 engaging sentences written as arcane knowledge), "questions" (array of exactly 3 objects, each with: "question" string, "options" array of exactly 4 strings, "correct_index" number 0-3). No extra text. JSON only.`
        );
        setMission(data);"""
mission_new = """const data = await apiFetch(`/mission/${user.id}`, "GET");
        setMission(data);"""
code = code.replace(mission_old, mission_new)

# Modify handleSubmit in MissionScreen
submit_quiz_old = """const score = mission.questions.reduce((acc, q, i) => acc + (answers[i] === q.correct_index ? 1 : 0), 0);
    const xpGained = score * 50 + (score === 3 ? 50 : 0); // bonus for perfect
    const shareId = `quiz_${Date.now()}`;
    const result = {
      shareId,
      creator: { username: user.username, score, total: 3, xpGained },
      challenger: { username: "VoidWraith_XIII", score: Math.floor(Math.random() * 4), total: 3, xpGained: Math.floor(Math.random() * 150) },
      xpBefore: user.xp,
      xpAfter: user.xp + xpGained,
      questions: mission.questions,
      userAnswers: answers,
    };
    setUser(u => ({ ...u, xp: u.xp + xpGained }));"""
submit_quiz_new = """const score = mission.questions.reduce((acc, q, i) => acc + (answers[i] === q.correct_index ? 1 : 0), 0);
    const backendResult = await apiFetch("/submit-quiz", "POST", {
        user_id: user.id, mission_id: mission.mission_id || 1, score, questions_json: JSON.stringify(mission.questions)
    });
    const xpGained = backendResult.xp_gained;
    const shareId = backendResult.share_id;
    const result = {
      shareId,
      creator: { username: user.username, score, total: 3, xpGained },
      challenger: { username: "VoidWraith_XIII", score: Math.floor(Math.random() * 4), total: 3, xpGained: Math.floor(Math.random() * 150) },
      xpBefore: user.xp,
      xpAfter: user.xp + xpGained,
      questions: mission.questions,
      userAnswers: answers,
      backendDetails: backendResult
    };
    setUser(u => ({ ...u, xp: u.xp + xpGained, 
        bronze_keys: (u.bronze_keys||0), 
        silver_keys: (u.silver_keys||0) + (backendResult.keys_earned||0), 
        level: backendResult.leveled_up ? u.level + 1 : u.level 
    }));"""
code = code.replace(submit_quiz_old, submit_quiz_new)

# 9. Update UserHeader
user_header_new = """
function UserHeader({ user, nav, setScreen }) {
  const level = user.level || 1;
  const xpInLevel = user.xp % 500;
  const levelLabel = ["","Initiate","Apprentice","Adept","Invoker","Archmage"][Math.min(level,5)] || `Lvl ${level}`;
  return (
    <div style={{
      background: `linear-gradient(180deg, ${C.surface} 0%, ${C.bg}EE 100%)`,
      borderBottom: `1px solid ${C.border}`,
      padding: "11px 18px",
      display: "flex", alignItems: "center", gap: 10,
      position: "sticky", top: 0, zIndex: 10,
      backdropFilter: "blur(18px)",
      boxShadow: `0 1px 0 ${C.border}, 0 4px 24px rgba(0,0,0,0.4)`
    }}>
      <div onClick={() => setScreen("home")} style={{ cursor:"pointer", fontFamily:"'Cinzel', serif", fontSize:13, fontWeight:700, color:C.gold, letterSpacing:"0.12em", flexShrink:0, paddingRight:6, borderRight:`1px solid ${C.border}` }}>
        ✦ NL
      </div>
      <div style={{ position:"relative" }}>
        <BrainAvatar trackColor={user.skill} size={32} user={user} />
        <div style={{ position:"absolute", bottom:0, right:-4, width:10, height:10, borderRadius:"50%", background: user.location_enabled ? C.green : C.muted, border:`2px solid ${C.surface}` }} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
          <span style={{ fontSize:11, fontWeight:600, color:C.text }}>{user.username}</span>
          <span style={{ fontSize:10, background:`${C.purple}33`, color:C.purple, borderRadius:99, padding:"1px 6px", fontWeight:700 }}>{levelLabel}</span>
        </div>
        <div className="xp-shimmer" style={{ background:C.dim, borderRadius:99, height:5, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${(xpInLevel/500)*100}%`, background:`linear-gradient(90deg,${C.purpleDark},${C.purple},#C084FC)` }}/>
        </div>
      </div>
      <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0, fontSize:12, fontWeight:700 }}>
        <span style={{color:"#E8833A"}}>🗝️{user.bronze_keys||0}</span>
        <span style={{color:"#C8B8FF"}}>🔑{user.silver_keys||0}</span>
        <span style={{color:"#FFB830"}}>✨{user.gold_keys||0}</span>
      </div>
      <div style={{ display:"flex", gap:2, paddingLeft:6, borderLeft:`1px solid ${C.border}` }}>
        {nav.map(({id, label}) => (
          <button key={id} onClick={() => setScreen(id)}
            style={{ background:"transparent", border:"none", color:C.muted, cursor:"pointer", fontSize:10, padding:"4px 7px", borderRadius:6 }}>
            {label}
          </button>
        ))}
        <button onClick={() => setScreen("messages")} style={{ background:"transparent", border:"none", cursor:"pointer", position:"relative" }}>
           💬
           <div style={{ position:"absolute", top:0, right:0, width:6, height:6, background:C.red, borderRadius:"50%" }} />
        </button>
      </div>
    </div>
  );
}
"""
code = re.sub(r"function UserHeader\(\{ user, nav, setScreen \}\) \{.*?(?=\n// ─── API CALLER|// ─── AI CALLER)", user_header_new, code, flags=re.DOTALL)

# Add BrainAvatar component right after UserHeader
brain_avatar_comp = """
// ─── BRAIN AVATAR COMPONENT ──────────────────────────────────────────────────
function BrainAvatar({ trackColor, size=120, user }) {
  const colors = { music:"#A855F7", crypto:"#22C55E", coding:"#06B6D4" };
  const baseColor = colors[trackColor] || trackColor || C.purple;
  const isLegendaryEffect = user?.avatar?.equipped_effect;
  const isRareAura = user?.avatar?.equipped_aura;
  
  return (
    <div className={isLegendaryEffect ? "glow-anim" : ""} style={{ position:"relative", width:size, height:size, display:"flex", alignItems:"center", justifyContent:"center" }}>
      {/* 1. Aura layer */}
      {isRareAura && <div style={{ position:"absolute", inset:-size*0.2, borderRadius:"50%", background:`radial-gradient(circle, ${C.gold}44 0%, transparent 60%)`, animation:"orbPulse 3s infinite" }} />}
      
      {/* 2. Base brain layer */}
      <div style={{ width:size*0.8, height:size*0.7, borderRadius:"45% 45% 40% 40%", background:`linear-gradient(135deg, ${baseColor} 0%, ${C.bg} 100%)`, position:"relative", overflow:"hidden", border:`2px solid ${baseColor}88`, boxShadow:`inset 0 -${size*0.1}px 0 rgba(0,0,0,0.3)` }}>
         {/* Brain folds (css shapes) */}
         <div style={{ position:"absolute", top:"20%", left:"10%", width:"80%", height:"2px", background:"rgba(0,0,0,0.3)", borderRadius:"50%", transform:"rotate(5deg)" }} />
         <div style={{ position:"absolute", top:"50%", left:"15%", width:"70%", height:"2px", background:"rgba(0,0,0,0.3)", borderRadius:"50%", transform:"rotate(-5deg)" }} />
      </div>
      
      {/* 3. Face layer */}
      <div style={{ position:"absolute", top:"40%", display:"flex", gap:size*0.1 }}>
         <div style={{ width:size*0.1, height:size*0.15, background:"#000", borderRadius:"50%" }} />
         <div style={{ width:size*0.1, height:size*0.15, background:"#000", borderRadius:"50%" }} />
      </div>
      
      {/* 4. Hat layer */}
      {user?.avatar?.equipped_hat && (
         <div style={{ position:"absolute", top:-(size*0.1), fontSize:size*0.4 }}>🎩</div>
      )}
      
      {/* 5. Accessory layer */}
      {user?.avatar?.equipped_accessory && (
         <div style={{ position:"absolute", top:size*0.3, right:0, fontSize:size*0.3 }}>✨</div>
      )}
    </div>
  );
}
"""
code = code.replace("// ─── ONBOARDING DATA ──────────────────────────────────────────────────────────", brain_avatar_comp + "\n// ─── ONBOARDING DATA ──────────────────────────────────────────────────────────\n")


# Add imports & map script injection
import_patch = """import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
"""
code = code.replace('import { useState, useEffect, useRef } from "react";', import_patch)

# The new screen components & updated App component
new_screens = """
// ─── NEW SCREENS ──────────────────────────────────────────────────────────────

function InventoryScreen({ user, setScreen }) {
    const [inventory, setInventory] = useState([]);
    
    useEffect(() => {
        apiFetch(`/inventory/${user.id}`, "GET").then(data => setInventory(data));
    }, [user.id]);
    
    async function openCrate(tier) {
        try {
            const result = await apiFetch("/open-crate", "POST", { user_id: user.id, tier });
            alert(`You unboxed a ${result.rarity} ${result.item.name}!`);
            const inv = await apiFetch(`/inventory/${user.id}`, "GET");
            setInventory(inv);
        } catch(e) { alert("Missing keys!"); }
    }
    
    async function equip(itemId) {
        await apiFetch("/equip-item", "POST", { user_id: user.id, item_id: itemId });
        const inv = await apiFetch(`/inventory/${user.id}`, "GET");
        setInventory(inv);
    }
    
    return (
        <div style={{minHeight:"100vh",background:C.bg}}>
            <UserHeader user={user} setScreen={setScreen} nav={[{id:"home",label:"Home"}]} />
            <div style={{maxWidth:600, margin:"0 auto", padding:20}}>
                <h1 style={{color:C.text, fontFamily:"'Fredoka One'", fontSize:28, marginBottom:20}}>🎒 Inventory & Loot</h1>
                
                <div style={{display:"flex", gap:10, marginBottom:30}}>
                   <button onClick={()=>openCrate("bronze")} style={{flex:1, padding:10, background:"#E8833A22", border:`1px solid #E8833A`, color:"#E8833A", borderRadius:12}}>Open Bronze (🗝️{user.bronze_keys})</button>
                   <button onClick={()=>openCrate("silver")} style={{flex:1, padding:10, background:"#C8B8FF22", border:`1px solid #C8B8FF`, color:"#C8B8FF", borderRadius:12}}>Open Silver (🔑{user.silver_keys})</button>
                   <button onClick={()=>openCrate("gold")} style={{flex:1, padding:10, background:"#FFB83022", border:`1px solid #FFB830`, color:"#FFB830", borderRadius:12}}>Open Gold (✨{user.gold_keys})</button>
                </div>
                
                <h2 style={{color:C.text, fontSize:20, marginBottom:10}}>Your Items</h2>
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
                   {inventory.map(i => (
                       <div key={i.item_id} onClick={()=>equip(i.item_id)} style={{background:C.card, border:`2px solid ${i.equipped?C.green:C.border}`, padding:16, borderRadius:12, cursor:"pointer"}}>
                           <div style={{color:C.text, fontWeight:700}}>{i.item_name}</div>
                           <div style={{color:C.muted, fontSize:12, textTransform:"capitalize"}}>{i.item_rarity} {i.item_type}</div>
                           {i.equipped && <span style={{color:C.green, fontSize:11, fontWeight:700}}>EQUIPPED</span>}
                       </div>
                   ))}
                </div>
            </div>
        </div>
    );
}

function TradeScreen({ user, setScreen }) {
    const [trades, setTrades] = useState([]);
    useEffect(() => { apiFetch(`/trade/incoming/${user.id}`, "GET").then(setTrades); }, [user.id]);
    
    async function respond(tradeId, action) {
        const res = await apiFetch("/trade/respond", "POST", { trade_id: tradeId, action });
        if(res.requires_irl && action === "accepted") {
            alert("This trade requires an IRL Cross-Pollination Meetup to complete!");
        }
        apiFetch(`/trade/incoming/${user.id}`, "GET").then(setTrades);
    }
    
    return (
        <div style={{minHeight:"100vh",background:C.bg}}>
            <UserHeader user={user} setScreen={setScreen} nav={[{id:"home",label:"Home"}]} />
            <div style={{maxWidth:600, margin:"0 auto", padding:20}}>
                <h1 style={{color:C.text, fontFamily:"'Fredoka One'", fontSize:28, marginBottom:20}}>🤝 Trade Offers</h1>
                {trades.length===0 ? <p style={{color:C.muted}}>No incoming offers.</p> : 
                 trades.map(t => (
                     <div key={t.id} style={{background:C.card, padding:20, borderRadius:12, marginBottom:10, border:`1px solid ${C.border}`}}>
                        {t.requires_irl && <div style={{background:C.red+"22", color:C.red, padding:6, borderRadius:6, fontSize:12, fontWeight:700, marginBottom:10}}>CROSS-POLLINATION MEETUP REQUIRED</div>}
                        <p style={{color:C.text}}>Offer: {t.sender_item_id} for {t.receiver_item_id}</p>
                        <div style={{display:"flex", gap:10, marginTop:10}}>
                            <button onClick={()=>respond(t.id, "accepted")} style={{padding:"8px 16px", background:C.green, color:"#fff", border:"none", borderRadius:8}}>Accept</button>
                            <button onClick={()=>respond(t.id, "declined")} style={{padding:"8px 16px", background:C.red, color:"#fff", border:"none", borderRadius:8}}>Decline</button>
                        </div>
                     </div>
                 ))}
            </div>
        </div>
    );
}

function MessagesScreen({ user, setScreen }) {
    const [history, setHistory] = useState([]);
    const [input, setInput] = useState("");
    
    useEffect(() => { apiFetch(`/ai-trainer/history/${user.id}`, "GET").then(d => setHistory(d.reverse())); }, [user.id]);
    
    async function sendMsg() {
        if(!input.trim()) return;
        const temp = [...history, {content: input, is_ai: false}];
        setHistory(temp);
        setInput("");
        const res = await apiFetch("/ai-trainer/message", "POST", { user_id: user.id, message: input });
        setHistory([...temp, {content: res.reply, is_ai: true}]);
    }
    
    return (
        <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
            <UserHeader user={user} setScreen={setScreen} nav={[{id:"home",label:"Home"}]} />
            <div style={{flex:1, overflowY:"auto", padding:20, display:"flex", flexDirection:"column", gap:12}}>
                {history.map((m,i) => (
                    <div key={i} style={{alignSelf: m.is_ai ? "flex-start" : "flex-end", background: m.is_ai ? C.surface : C.purple, color: m.is_ai ? C.text : "#fff", padding:"10px 14px", borderRadius:12, maxWidth:"80%"}}>
                        {m.content}
                    </div>
                ))}
            </div>
            <div style={{padding:16, borderTop:`1px solid ${C.border}`, display:"flex", gap:10}}>
                <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()} style={{flex:1, background:C.surface, border:`1px solid ${C.border}`, color:C.text, borderRadius:12, padding:12}} placeholder="Ask Sage..." />
                <button onClick={sendMsg} style={{background:C.purple, color:"#fff", border:"none", borderRadius:12, padding:"0 20px", fontWeight:700}}>Send</button>
            </div>
        </div>
    );
}

function ClanScreen({ user, setScreen }) {
    const [clans, setClans] = useState([]);
    useEffect(() => { apiFetch(`/clans/${user.skill}`, "GET").then(setClans); }, [user.skill]);
    return (
        <div style={{minHeight:"100vh",background:C.bg}}>
            <UserHeader user={user} setScreen={setScreen} nav={[{id:"home",label:"Home"}]} />
            <div style={{maxWidth:600, margin:"0 auto", padding:20}}>
                <h1 style={{color:C.text, fontFamily:"'Fredoka One'", fontSize:28, marginBottom:20}}>🛡️ Guilds</h1>
                {clans.map(c => (
                    <div key={c.id} style={{background:C.card, padding:20, borderRadius:12, border:`1px solid ${C.border}`}}>
                        <h2 style={{color:C.text}}>{c.name}</h2>
                        <p style={{color:C.muted}}>Members: {c.member_count}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ProfileScreen({ user, setScreen }) {
    return (
        <div style={{minHeight:"100vh",background:C.bg}}>
            <UserHeader user={user} setScreen={setScreen} nav={[{id:"home",label:"Home"}]} />
            <div style={{maxWidth:600, margin:"0 auto", padding:20, textAlign:"center"}}>
                <BrainAvatar trackColor={user.skill} size={160} user={user} />
                <h1 style={{color:C.text, fontSize:32, marginTop:20}}>{user.username}</h1>
                <p style={{color:C.purple, fontWeight:700}}>Level {user.level} {user.skillName}</p>
                <div style={{display:"flex", gap:10, justifyContent:"center", marginTop:20}}>
                    <button onClick={()=>setScreen("inventory")} style={{background:C.surface, color:C.text, border:`1px solid ${C.border}`, padding:"10px 20px", borderRadius:10}}>Edit Avatar</button>
                </div>
            </div>
        </div>
    );
}

function CampaignScreen({ user, setScreen }) {
    const [room, setRoom] = useState("");
    const [state, setState] = useState(null);
    async function create() {
        const res = await apiFetch("/campaign/create", "POST", { host_id: user.id, skill: user.skill, is_public: true });
        setState(res); setRoom(res.room_code);
    }
    return (
        <div style={{minHeight:"100vh",background:C.bg}}>
            <UserHeader user={user} setScreen={setScreen} nav={[{id:"home",label:"Home"}]} />
            <div style={{maxWidth:600, margin:"0 auto", padding:20, textAlign:"center"}}>
                <h1 style={{color:C.text, fontFamily:"'Fredoka One'", fontSize:32, marginBottom:20}}>🐲 Dungeons</h1>
                {!state ? (
                    <div>
                        <button onClick={create} style={{background:C.red, color:"#fff", border:"none", padding:"15px 30px", borderRadius:12, fontSize:18, fontWeight:700, width:"100%", marginBottom:20}}>Create Dungeon</button>
                        <input value={room} onChange={e=>setRoom(e.target.value)} placeholder="Room Code" style={{background:C.surface, border:`1px solid ${C.border}`, padding:15, width:"100%", borderRadius:12, color:C.text, marginBottom:10}}/>
                        <button style={{background:C.purple, color:"#fff", border:"none", padding:"15px", borderRadius:12, width:"100%"}}>Join Dungeon</button>
                    </div>
                ) : (
                    <div>
                        <h2 style={{color:C.text}}>Room: {room}</h2>
                        <p style={{color:C.muted}}>Waiting for adventurers...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function MapScreen({ user, setScreen }) {
    const { isLoaded } = useJsApiLoader({ googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY });
    const [enabled, setEnabled] = useState(user.location_enabled);
    const [center, setCenter] = useState({ lat: 32.7767, lng: -96.7970 }); // Dallas TX default
    
    async function toggleLocation(val) {
        setEnabled(val);
        await apiFetch("/location/update", "POST", { user_id: user.id, location_enabled: val, latitude: center.lat, longitude: center.lng });
    }
    
    return (
        <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
            <UserHeader user={user} setScreen={setScreen} nav={[{id:"home",label:"Home"}]} />
            <div style={{padding:16, background:C.surface, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <span style={{color:C.text, fontWeight:700}}>Location Sharing</span>
                <input type="checkbox" checked={enabled} onChange={(e)=>toggleLocation(e.target.checked)} />
            </div>
            {enabled && isLoaded ? (
                <div style={{flex:1}}>
                    <GoogleMap mapContainerStyle={{width:'100%', height:'100%'}} center={center} zoom={13}>
                        <Marker position={center} icon={{url:"http://maps.google.com/mapfiles/ms/icons/purple-dot.png"}} label="You" />
                    </GoogleMap>
                </div>
            ) : (
                <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:C.muted}}>
                    Enable location sharing to discover nearby venues & allies!
                </div>
            )}
        </div>
    );
}

"""
code = code.replace("// ─── ROOT APP ──────────────────────────────────────────────────────────────────", new_screens + "\n// ─── ROOT APP ──────────────────────────────────────────────────────────────────\n")

# Modify root App component to handle new navigation and notification banner
app_old = """// ─── ROOT APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [user, setUser] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  function handleOnboard(u) { setUser(u); setScreen("path"); }

  if (screen==="home"||!user)  return <OnboardingScreen onComplete={handleOnboard}/>;
  if (screen==="path")         return <LearningPathScreen user={user} setUser={setUser} setScreen={setScreen}/>;
  if (screen==="mission")      return <MissionScreen user={user} setUser={setUser} setScreen={setScreen} setLastResult={setLastResult}/>;
  if (screen==="results")      return <ResultsScreen user={user} lastResult={lastResult} setScreen={setScreen}/>;
  if (screen==="buddy")        return <BuddyScreen user={user} setUser={setUser} setLastResult={setLastResult} setScreen={setScreen}/>;
  if (screen==="leaderboard")  return <LeaderboardScreen user={user} setScreen={setScreen}/>;
  if (screen==="meetup")       return <MeetupScreen user={user} setScreen={setScreen}/>;
  return null;
}"""
app_new = """// ─── ROOT APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [user, setUser] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [sageBanner, setSageBanner] = useState(null);

  useEffect(() => {
    if(user) {
        apiFetch(`/ai-trainer/checkin?user_id=${user.id}`, "POST").then(res => {
            if(res.reply) {
                setSageBanner(res.reply);
                setTimeout(() => setSageBanner(null), 5000);
            }
        });
    }
  }, [user]);

  function handleOnboard(u) {
      apiFetch("/onboard", "POST", u)
        .then(data => { setUser(data); setScreen("path"); })
        .catch(err => alert("Error onboarding: "+err.message));
  }

  return (
      <div style={{position:"relative"}}>
          {sageBanner && (
              <div style={{position:"fixed", top:60, left:"50%", transform:"translateX(-50%)", background:`linear-gradient(135deg, ${C.purpleDark}, ${C.purple})`, color:"#fff", padding:"12px 24px", borderRadius:12, zIndex:1000, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", fontWeight:600, animation:"fadeUp 0.3s ease both"}}>
                  🔮 Sage: {sageBanner}
              </div>
          )}
          {
              screen==="home"||!user ? <OnboardingScreen onComplete={handleOnboard}/> :
              screen==="path" ? <LearningPathScreen user={user} setUser={setUser} setScreen={setScreen}/> :
              screen==="mission" ? <MissionScreen user={user} setUser={setUser} setScreen={setScreen} setLastResult={setLastResult}/> :
              screen==="results" ? <ResultsScreen user={user} lastResult={lastResult} setScreen={setScreen}/> :
              screen==="buddy" ? <BuddyScreen user={user} setUser={setUser} setLastResult={setLastResult} setScreen={setScreen}/> :
              screen==="leaderboard" ? <LeaderboardScreen user={user} setScreen={setScreen}/> :
              screen==="meetup" ? <MeetupScreen user={user} setScreen={setScreen}/> :
              screen==="inventory" ? <InventoryScreen user={user} setScreen={setScreen}/> :
              screen==="trade" ? <TradeScreen user={user} setScreen={setScreen}/> :
              screen==="messages" ? <MessagesScreen user={user} setScreen={setScreen}/> :
              screen==="clan" ? <ClanScreen user={user} setScreen={setScreen}/> :
              screen==="profile" ? <ProfileScreen user={user} setScreen={setScreen}/> :
              screen==="campaign" ? <CampaignScreen user={user} setScreen={setScreen}/> :
              screen==="map" ? <MapScreen user={user} setScreen={setScreen}/> : null
          }
          {user && screen!=="home" && (
             <div style={{position:"fixed", bottom:0, width:"100%", background:C.surface, borderTop:`1px solid ${C.border}`, display:"flex", padding:"12px 0", zIndex:50}}>
                 {[
                   {id:"path", ic:"🌳"}, {id:"mission", ic:"⚔️"}, {id:"inventory", ic:"🎒"}, {id:"trade", ic:"🤝"}, 
                   {id:"map", ic:"🗺️"}, {id:"campaign", ic:"🐲"}, {id:"clan", ic:"🛡️"}, {id:"profile", ic:"👤"}
                 ].map(Nav => (
                     <button key={Nav.id} onClick={()=>setScreen(Nav.id)} style={{flex:1, background:"none", border:"none", color:screen===Nav.id?C.purple:C.muted, fontSize:22, cursor:"pointer", transition:"color 0.2s"}}>
                         <div style={{fontSize:24}}>{Nav.ic}</div>
                         <div style={{fontSize:10, marginTop:4}}>{Nav.id}</div>
                     </button>
                 ))}
             </div>
          )}
      </div>
  );
}"""
code = code.replace(app_old, app_new)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Frontend patch successful")

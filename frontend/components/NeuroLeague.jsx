"use client";
import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg:         "#08060F",   // deeper void-black
  surface:    "#100D1E",   // arcane surface
  card:       "#160F2A",   // dark crystal card
  cardHover:  "#1E1538",
  border:     "#2D1F5E",   // arcane border (warmer purple)
  purple:     "#9D6FFF",   // arcane violet
  purpleDark: "#6A3FCC",
  purpleGlow: "rgba(157,111,255,0.28)",
  gold:       "#FFB830",   // arcane gold (warmer)
  silver:     "#C8B8FF",   // mystic silver (tinted purple)
  bronze:     "#E8833A",
  green:      "#3DFFA0",   // arcane emerald
  red:        "#FF4F6A",
  cyan:       "#38D9FF",   // arcane ice
  amber:      "#FFB830",
  text:       "#EDE8FF",   // soft lavender white
  muted:      "#7A6AAA",
  dim:        "#3D2E6A",
};

const SKILLS = [
  { id:"music",  name:"Music",   emoji:"🎵", tagline:"Weave beats, synthesis & sonic spells",   color:"#C084FC" },
  { id:"crypto", name:"Crypto",  emoji:"💎", tagline:"Master DeFi, web3 & the arcane ledger",   color:"#3DFFA0" },
  { id:"coding", name:"Coding",  emoji:"💻", tagline:"Forge algorithms, systems & dark APIs",  color:"#38D9FF" },
];

const LEVEL_LABELS = ["", "Initiate", "Apprentice", "Adept", "Invoker", "Archmage"];

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Cinzel+Decorative:wght@700&family=DM+Sans:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: ${C.bg};
    color: ${C.text};
    font-family: 'DM Sans', sans-serif;
    background-image:
      radial-gradient(ellipse 80% 40% at 50% -10%, rgba(100,50,200,0.18) 0%, transparent 70%),
      radial-gradient(ellipse 40% 30% at 85% 80%, rgba(60,217,255,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 40% 30% at 15% 70%, rgba(192,132,252,0.07) 0%, transparent 60%);
    background-attachment: fixed;
  }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: ${C.bg}; }
  ::-webkit-scrollbar-thumb { background: ${C.dim}; border-radius: 2px; }

  @keyframes fadeUp    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes runeGlow  { 0%,100%{box-shadow:0 0 18px rgba(157,111,255,0.28),0 0 4px rgba(157,111,255,0.15) inset} 50%{box-shadow:0 0 44px rgba(157,111,255,0.6),0 0 18px rgba(157,111,255,0.35) inset} }
  @keyframes goldGlow  { 0%,100%{box-shadow:0 0 16px rgba(255,184,48,0.25)} 50%{box-shadow:0 0 36px rgba(255,184,48,0.55)} }
  @keyframes orbPulse  { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.4)} }
  @keyframes runeFloat { 0%,100%{transform:translateY(0) rotate(0deg);opacity:0.1} 50%{transform:translateY(-24px) rotate(180deg);opacity:0.28} }
  @keyframes ascend    { 0%{transform:scale(1)} 50%{transform:scale(1.18)} 100%{transform:scale(1)} }
  @keyframes cardReveal{ from{opacity:0;transform:translateY(20px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes xpFill    { from{width:var(--xp-from)} to{width:var(--xp-to)} }

  .fade-up   { animation: fadeUp 0.4s ease both; }
  .fade-up-1 { animation: fadeUp 0.4s 0.08s ease both; }
  .fade-up-2 { animation: fadeUp 0.4s 0.16s ease both; }
  .fade-up-3 { animation: fadeUp 0.4s 0.24s ease both; }
  .fade-up-4 { animation: fadeUp 0.4s 0.32s ease both; }
  .fade-up-5 { animation: fadeUp 0.4s 0.40s ease both; }
  .float     { animation: float 3s ease-in-out infinite; }
  .glow-anim { animation: runeGlow 2.5s ease-in-out infinite; }
  .gold-glow { animation: goldGlow 2.5s ease-in-out infinite; }
  .arcane-title { font-family: 'Cinzel', serif; letter-spacing: 0.06em; }
  .card-reveal  { animation: cardReveal 0.45s cubic-bezier(.4,0,.2,1) both; }

  /* Arcane divider */
  .rune-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, ${C.purple}66, ${C.gold}44, ${C.purple}66, transparent);
    margin: 4px 0;
  }

  /* Arcane card base */
  .arcane-card {
    background: linear-gradient(160deg, ${C.cardHover} 0%, ${C.card} 100%);
    border: 1px solid ${C.border};
    border-radius: 18px;
    position: relative;
    overflow: hidden;
  }
  .arcane-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(157,111,255,0.04) 0%, transparent 60%);
    pointer-events: none;
  }

  /* Sage / top-rank special border */
  .sage-card {
    background: linear-gradient(160deg, rgba(255,184,48,0.12) 0%, ${C.card} 60%);
    border: 1.5px solid ${C.gold}66;
    box-shadow: 0 0 28px rgba(255,184,48,0.12), inset 0 0 20px rgba(255,184,48,0.04);
  }

  /* XP bar arcane shimmer */
  .xp-shimmer {
    position: relative;
    overflow: hidden;
  }
  .xp-shimmer::after {
    content: '';
    position: absolute;
    top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
    animation: shimmer 2.5s ease-in-out infinite;
  }
`;


// ─── RUNE PARTICLES (decorative background) ───────────────────────────────────
const RUNE_SYMBOLS = ["✦","◆","⬡","⟁","⌘","✧","⬟","◈","⟡","✵"];
function RuneParticles({ count = 8 }) {
  const runes = Array.from({length: count}, (_, i) => ({
    symbol: RUNE_SYMBOLS[i % RUNE_SYMBOLS.length],
    left: `${8 + (i * 11.5) % 84}%`,
    top:  `${5 + (i * 17.3) % 90}%`,
    delay: `${(i * 0.7) % 4}s`,
    duration: `${4 + (i % 4)}s`,
    size: 10 + (i % 3) * 4,
  }));
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      {runes.map((r, i) => (
        <div key={i} style={{
          position: "absolute", left: r.left, top: r.top,
          fontSize: r.size, color: C.purple, opacity: 0.1,
          animation: `runeFloat ${r.duration} ${r.delay} ease-in-out infinite`,
          userSelect: "none",
        }}>{r.symbol}</div>
      ))}
    </div>
  );
}

// ─── SHARED UI COMPONENTS ──────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, padding:40 }}>
      <div style={{ width:36, height:36, border:`3px solid ${C.dim}`, borderTopColor:C.purple, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <span style={{ color:C.muted, fontSize:13 }}>Consulting the Oracle...</span>
    </div>
  );
}

function XPBar({ xp, maxXp = 500, animated = false, oldXp }) {
  const pct = Math.min((xp / maxXp) * 100, 100);
  const oldPct = oldXp != null ? Math.min((oldXp / maxXp) * 100, 100) : pct;
  const [width, setWidth] = useState(oldPct);
  useEffect(() => {
    if (animated) { const t = setTimeout(() => setWidth(pct), 200); return () => clearTimeout(t); }
    else setWidth(pct);
  }, [pct, animated]);
  return (
    <div style={{ background:C.border, borderRadius:99, height:8, overflow:"hidden", flex:1 }}>
      <div style={{ height:"100%", width:`${width}%`, background:`linear-gradient(90deg,${C.purpleDark},${C.purple},#C084FC)`, borderRadius:99, transition: animated ? "width 1.5s cubic-bezier(.4,0,.2,1)" : "none", boxShadow:`0 0 8px ${C.purpleGlow}` }} />
    </div>
  );
}

function Badge({ text, color = C.purple }) {
  return <span style={{ background:color+"22", color, border:`1px solid ${color}44`, borderRadius:99, padding:"2px 8px", fontSize:11, fontWeight:600, letterSpacing:0.5 }}>{text}</span>;
}

function Avatar({ name, skill, size=36 }) {
  const colors = { music:"#A855F7", crypto:"#22C55E", coding:"#06B6D4" };
  const bg = colors[skill] || C.purple;
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${bg}88,${bg})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Fredoka One'", fontSize:size*0.45, color:"#fff", flexShrink:0, boxShadow:`0 0 0 2px ${bg}44, 0 0 12px ${bg}33` }}>
      {(name||"?")[0].toUpperCase()}
    </div>
  );
}

function UserHeader({ user, nav, setScreen }) {
  const level = Math.floor(user.xp / 100) + 1;
  const xpInLevel = user.xp % 100;
  const levelLabel = ["","Initiate","Apprentice","Adept","Invoker","Archmage"][Math.min(level,5)] || `Lvl ${level}`;
  return (
    <div style={{
      background: `linear-gradient(180deg, ${C.surface} 0%, ${C.bg}EE 100%)`,
      borderBottom: `1px solid ${C.border}`,
      padding: "11px 18px",
      display: "flex", alignItems: "center", gap: 10,
      position: "sticky", top: 0, zIndex: 10,
      backdropFilter: "blur(18px)",
      boxShadow: `0 1px 0 ${C.border}, 0 4px 24px rgba(0,0,0,0.4)`,
    }}>
      {/* Logo */}
      <div onClick={() => setScreen("home")} style={{ cursor:"pointer", fontFamily:"'Cinzel', serif", fontSize:13, fontWeight:700, color:C.gold, letterSpacing:"0.12em", textShadow:`0 0 14px rgba(255,184,48,0.5)`, flexShrink:0, paddingRight:6, borderRight:`1px solid ${C.border}`, marginRight:2 }}>
        ✦ NL
      </div>
      <Avatar name={user.username} skill={user.skill} size={28} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
          <span style={{ fontSize:11, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.username}</span>
          <span style={{ fontSize:10, background:`${C.purple}33`, color:C.purple, border:`1px solid ${C.purple}44`, borderRadius:99, padding:"1px 6px", fontWeight:700, flexShrink:0 }}>{levelLabel}</span>
        </div>
        <div className="xp-shimmer" style={{ background:C.dim, borderRadius:99, height:5, overflow:"hidden", flex:1 }}>
          <div style={{ height:"100%", width:`${(xpInLevel/100)*100}%`, background:`linear-gradient(90deg,${C.purpleDark},${C.purple},#C084FC)`, borderRadius:99, boxShadow:`0 0 6px ${C.purpleGlow}` }}/>
        </div>
      </div>
      {/* Stats */}
      <div style={{ display:"flex", gap:10, alignItems:"center", flexShrink:0 }}>
        <div style={{ display:"flex", gap:3, alignItems:"center" }}>
          <span style={{ fontSize:13 }}>🔥</span><span style={{ color:C.text, fontWeight:700, fontSize:12 }}>{user.streak}</span>
        </div>
        <div style={{ display:"flex", gap:3, alignItems:"center" }}>
          <span style={{ fontSize:13 }}>🪙</span><span style={{ color:C.gold, fontWeight:700, fontSize:12 }}>{user.gold||0}</span>
        </div>
      </div>
      {/* Nav */}
      <div style={{ display:"flex", gap:1, paddingLeft:6, borderLeft:`1px solid ${C.border}` }}>
        {nav.map(({id, label}) => (
          <button key={id} onClick={() => setScreen(id)}
            style={{ background:"transparent", border:"none", color:C.muted, cursor:"pointer", fontSize:10, padding:"4px 7px", borderRadius:6, transition:"all 0.2s", whiteSpace:"nowrap" }}
            onMouseEnter={e=>e.target.style.color=C.purple} onMouseLeave={e=>e.target.style.color=C.muted}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ screen, setScreen }) {
  const tabs = [
    { id:"mission",     icon:"⚔️",  label:"Quests"   },
    { id:"leaderboard", icon:"🏆",  label:"Ranks"    },
    { id:"meetup",      icon:"🏰",  label:"Meetups"  },
    { id:"messages",    icon:"🧙",  label:"Sage"     },
    { id:"inventory",   icon:"🎒",  label:"Vault"    },
    { id:"campaign",    icon:"🐲",  label:"Dungeon"  },
    { id:"profile",     icon:"🧠",  label:"Profile"  },
  ];
  return (
    <div style={{
      position:"fixed", bottom:0, left:0, right:0, zIndex:20,
      background:`linear-gradient(180deg, ${C.bg}EE, ${C.surface})`,
      borderTop:`1px solid ${C.border}`,
      display:"flex", justifyContent:"space-around", alignItems:"center",
      padding:"8px 4px 12px",
      backdropFilter:"blur(18px)",
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setScreen(t.id)} style={{
          background:"none", border:"none", cursor:"pointer",
          display:"flex", flexDirection:"column", alignItems:"center", gap:2,
          padding:"4px 6px", borderRadius:10,
          transition:"all 0.2s",
          opacity: screen === t.id ? 1 : 0.5,
        }}>
          <span style={{ fontSize:18 }}>{t.icon}</span>
          <span style={{ fontSize:9, color: screen === t.id ? C.purple : C.muted, fontWeight: screen === t.id ? 700 : 400 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── API CALLER ────────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch(endpoint, method = "GET", data = null) {
  const options = { method, headers: { "Content-Type": "application/json" } };
  if (data) options.body = JSON.stringify(data);
  const res = await fetch(`${API_URL}${endpoint}`, options);
  if (!res.ok) throw new Error(`API Error ${res.status}`);
  return await res.json();
}

// ─── ONBOARDING DATA ──────────────────────────────────────────────────────────
// Per-skill yes/no questions. Answers accumulate a score → mapped to level 1-5.
// If user ends up level 4-5, we unlock an optional advanced context textarea.
const ONBOARD_QUESTIONS = {
  music: [
    { id:"q1", text:"Have you ever made a beat or recorded a song, even just for fun?",        icon:"🎵" },
    { id:"q2", text:"Do you know what BPM means and how to set it in a DAW?",                  icon:"🎛️" },
    { id:"q3", text:"Have you mixed or mastered a track before?",                              icon:"🎚️" },
    { id:"q4", text:"Do you understand concepts like EQ, compression, or reverb?",             icon:"🔊" },
    { id:"q5", text:"Have you released music, worked with a label, or earned money from it?",  icon:"🏆" },
  ],
  crypto: [
    { id:"q1", text:"Have you ever bought or sold any cryptocurrency?",                        icon:"💰" },
    { id:"q2", text:"Do you know what a wallet address or private key is?",                    icon:"🔑" },
    { id:"q3", text:"Have you used a DEX or interacted with a DeFi protocol?",                 icon:"⛓️" },
    { id:"q4", text:"Do you analyze charts, use indicators, or follow trading strategies?",    icon:"📈" },
    { id:"q5", text:"Have you written a smart contract or built anything on-chain?",           icon:"🏗️" },
  ],
  coding: [
    { id:"q1", text:"Have you written code in any programming language before?",               icon:"💻" },
    { id:"q2", text:"Can you build a simple app or script that actually runs?",                icon:"⚙️" },
    { id:"q3", text:"Do you understand data structures like arrays, hashmaps, or trees?",      icon:"🌲" },
    { id:"q4", text:"Have you worked on a real project with a team or shipped something live?", icon:"🚀" },
    { id:"q5", text:"Do you solve algorithm problems, do system design, or work professionally?", icon:"🏆" },
  ],
};

const LEVEL_FROM_SCORE = [1, 1, 2, 3, 4, 5]; // index = yes count (0-5)

// ─── SWIPE CARD COMPONENT ─────────────────────────────────────────────────────
function SwipeCard({ question, skillColor, onYes, onNo, cardIndex, totalCards }) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [exiting, setExiting] = useState(null); // "yes" | "no"
  const THRESHOLD = 80;

  function exit(dir) {
    setExiting(dir);
    setTimeout(() => { dir === "yes" ? onYes() : onNo(); }, 320);
  }

  function onPointerDown(e) {
    setDragging(true);
    setStartX(e.clientX || e.touches?.[0]?.clientX || 0);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e) {
    if (!dragging) return;
    const x = (e.clientX || e.touches?.[0]?.clientX || 0) - startX;
    setDragX(x);
  }
  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    if (dragX > THRESHOLD) exit("yes");
    else if (dragX < -THRESHOLD) exit("no");
    else setDragX(0);
  }

  const rotation = exiting ? (exiting === "yes" ? 25 : -25) : dragX * 0.12;
  const translateX = exiting ? (exiting === "yes" ? 400 : -400) : dragX;
  const opacity = exiting ? 0 : 1;
  const yesOpacity = Math.min(Math.max(dragX / THRESHOLD, 0), 1);
  const noOpacity  = Math.min(Math.max(-dragX / THRESHOLD, 0), 1);

  return (
    <div style={{ position:"relative", width:"100%", maxWidth:360, margin:"0 auto" }}>
      {/* Stack shadow cards behind */}
      {cardIndex < totalCards - 1 && (
        <div style={{ position:"absolute", top:8, left:"50%", transform:"translateX(-50%) scale(0.95)", width:"100%", height:220, background:C.card, border:`1px solid ${C.border}`, borderRadius:24, zIndex:0, opacity:0.5 }}/>
      )}
      {cardIndex < totalCards - 2 && (
        <div style={{ position:"absolute", top:16, left:"50%", transform:"translateX(-50%) scale(0.9)", width:"100%", height:220, background:C.card, border:`1px solid ${C.border}`, borderRadius:24, zIndex:0, opacity:0.3 }}/>
      )}

      {/* Main card */}
      <div
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
        onTouchStart={onPointerDown} onTouchMove={onPointerMove} onTouchEnd={onPointerUp}
        style={{
          position:"relative", zIndex:1,
          background:`linear-gradient(145deg, ${C.card}, ${C.surface})`,
          border:`2px solid ${dragX > 20 ? skillColor+"88" : dragX < -20 ? C.red+"88" : C.border}`,
          borderRadius:24, padding:"32px 28px", cursor:"grab", userSelect:"none",
          transform:`translateX(${translateX}px) rotate(${rotation}deg)`,
          opacity, transition: dragging ? "none" : "all 0.3s cubic-bezier(.4,0,.2,1)",
          boxShadow: dragX > 20 ? `0 8px 40px ${skillColor}44` : dragX < -20 ? `0 8px 40px ${C.red}44` : `0 8px 32px rgba(0,0,0,0.4)`,
          minHeight:220, display:"flex", flexDirection:"column", justifyContent:"center",
        }}>

        {/* YES overlay */}
        <div style={{ position:"absolute", top:20, left:20, background:`${skillColor}22`, border:`2px solid ${skillColor}`, borderRadius:12, padding:"6px 14px", opacity:yesOpacity, transition:"opacity 0.1s", transform:"rotate(-12deg)" }}>
          <span style={{ fontFamily:"'Fredoka One'", fontSize:20, color:skillColor }}>✓ YEP</span>
        </div>
        {/* NO overlay */}
        <div style={{ position:"absolute", top:20, right:20, background:`${C.red}22`, border:`2px solid ${C.red}`, borderRadius:12, padding:"6px 14px", opacity:noOpacity, transition:"opacity 0.1s", transform:"rotate(12deg)" }}>
          <span style={{ fontFamily:"'Fredoka One'", fontSize:20, color:C.red }}>✗ NOPE</span>
        </div>

        <div style={{ fontSize:44, textAlign:"center", marginBottom:16 }}>{question.icon}</div>
        <p style={{ fontSize:17, fontWeight:600, color:C.text, textAlign:"center", lineHeight:1.5 }}>{question.text}</p>
      </div>
    </div>
  );
}

// SKILL_QUESTIONS is an alias for ONBOARD_QUESTIONS (same data, unified format)
const SKILL_QUESTIONS = ONBOARD_QUESTIONS;

const ADVANCED_PROMPTS = {
  music:  "What's your current setup or workflow? Any specific areas you want to push further?",
  crypto: "What's your current strategy or focus area? DeFi, trading, building?",
  coding: "What stack do you work in? Any specific skills you're targeting?",
};

// Score → level mapping: 0 yes = 1, 1 yes = 2, 2 yes = 3, 3 yes = 4, 4 yes = 5
function scoresToLevel(yesCount) {
  return Math.min(yesCount + 1, 5);
}

// ─── SCREEN: ONBOARDING ───────────────────────────────────────────────────────
function OnboardingScreen({ onComplete }) {
  const [phase, setPhase] = useState("splash");    // splash | skill | swipe | advanced | ready
  const [skill, setSkill] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);      // true/false per question
  const [swipeDir, setSwipeDir] = useState(null);  // "yes" | "no" for animation
  const [animating, setAnimating] = useState(false);
  const [advancedText, setAdvancedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");

  const questions = skill ? SKILL_QUESTIONS[skill.id] : [];
  const yesCount = answers.filter(Boolean).length;
  const computedLevel = scoresToLevel(yesCount);
  const isAdvanced = computedLevel >= 4; // 3+ yes answers unlocks text box

  function pickSkill(s) {
    setSkill(s);
    setPhase("swipe");
    setQIndex(0);
    setAnswers([]);
  }

  function handleAnswer(isYes) {
    if (animating) return;
    setAnimating(true);
    setSwipeDir(isYes ? "yes" : "no");
    setTimeout(() => {
      const newAnswers = [...answers, isYes];
      setAnswers(newAnswers);
      setSwipeDir(null);
      setAnimating(false);
      if (qIndex < questions.length - 1) {
        setQIndex(i => i + 1);
      } else {
        // All questions done
        const yeses = newAnswers.filter(Boolean).length;
        const lvl = scoresToLevel(yeses);
        if (lvl >= 4) {
          setPhase("advanced");
        } else {
          setPhase("ready");
        }
      }
    }, 350);
  }

  async function handleLaunch() {
  const trimmed = username.trim();
  if (!trimmed) { setUsernameError("Pick a username to continue"); return; }
  if (trimmed.length < 3) { setUsernameError("At least 3 characters"); return; }
  setLoading(true);
  try {
    const data = await apiFetch("/onboard", "POST", {
      username: trimmed,
      skill: skill.id,
      level: computedLevel,
      background: advancedText || (isAdvanced ? "Experienced learner" : "Just getting started!"),
    });
    const user = {
      id: data.id,
      username: trimmed,
      skill: skill.id,
      skillName: skill.name,
      level: computedLevel,
      xp: 0,
      streak: 1,
      gold: 50,
      bronze_keys: data.bronze_keys || 1,
      silver_keys: 0,
      gold_keys: 0,
    };
    onComplete(user);
  } catch(e) {
    setUsernameError("Failed to create account. Try again.");
  } finally {
    setLoading(false);
  }
}

  const swipeStyle = swipeDir === "yes"
    ? { transform:"translateX(120%) rotate(15deg)", opacity:0, transition:"all 0.35s cubic-bezier(.4,0,.2,1)" }
    : swipeDir === "no"
    ? { transform:"translateX(-120%) rotate(-15deg)", opacity:0, transition:"all 0.35s cubic-bezier(.4,0,.2,1)" }
    : { transform:"translateX(0) rotate(0deg)", opacity:1, transition:"none" };

  // ── SPLASH ──
  if (phase === "splash") return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, background:`radial-gradient(ellipse at 50% 0%, #2A0A5E 0%, ${C.bg} 65%)`, position:"relative", overflow:"hidden" }}>
      <style>{globalStyles}</style>
      {/* Floating rune orbs */}
      {[{s:120,x:"10%",y:"15%",d:"0s"},{s:80,x:"85%",y:"10%",d:"1s"},{s:60,x:"20%",y:"75%",d:"2s"},{s:100,x:"75%",y:"70%",d:"0.5s"},{s:40,x:"50%",y:"5%",d:"1.5s"}].map((o,i)=>(
        <div key={i} style={{ position:"absolute", left:o.x, top:o.y, width:o.s, height:o.s, borderRadius:"50%", background:`radial-gradient(circle,${C.purple}18,transparent)`, border:`1px solid ${C.purple}22`, animation:`orbPulse 4s ${o.d} ease-in-out infinite`, pointerEvents:"none" }}/>
      ))}
      {/* Floating runes */}
      {["✦","⚗️","✧","◈","⬡"].map((r,i)=>(
        <div key={i} style={{ position:"absolute", left:`${15+i*18}%`, top:`${20+i*12}%`, fontSize:i%2===0?18:12, color:C.purple, opacity:0.15, animation:`runeFloat ${5+i}s ${i*0.8}s ease-in-out infinite`, pointerEvents:"none" }}>{r}</div>
      ))}
      <div className="fade-up" style={{ textAlign:"center", maxWidth:400, position:"relative", zIndex:1 }}>
        <div style={{ fontFamily:"'Fredoka One'", fontSize:72, color:C.purple, lineHeight:1, animation:"float 3s ease-in-out infinite", marginBottom:12 }}>⚡</div>
        <h1 className="arcane-title" style={{ fontFamily:"'Cinzel', serif", fontSize:40, color:C.text, marginBottom:8, letterSpacing:"0.06em" }}>NeuroLeague</h1>
        <p style={{ color:C.muted, fontSize:16, lineHeight:1.6, marginBottom:32 }}>
          Level up your skills.<br/>Beat your rivals.<br/>Become a Sage.
        </p>
        <button onClick={() => setPhase("skill")} className="glow-anim" style={{ padding:"16px 48px", borderRadius:99, border:"none", background:`linear-gradient(135deg,${C.purpleDark},${C.purple})`, color:"#fff", fontFamily:"'Fredoka One'", fontSize:22, cursor:"pointer", boxShadow:`0 8px 32px ${C.purpleGlow}` }}>
          Let's Go →
        </button>
        <p style={{ color:C.dim, fontSize:12, marginTop:16 }}>60 seconds · No account required</p>
      </div>
    </div>
  );

  // ── SKILL PICK ──
  if (phase === "skill") return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, background:`radial-gradient(ellipse at 50% 0%, #2A0A5E 0%, ${C.bg} 65%)` }}>
      <style>{globalStyles}</style>
      <div className="fade-up" style={{ maxWidth:480, width:"100%", textAlign:"center" }}>
        <div style={{ fontFamily:"'Fredoka One'", fontSize:22, color:C.purple, marginBottom:8 }}>✦ NeuroLeague</div>
        <h2 style={{ fontFamily:"'Fredoka One'", fontSize:32, color:C.text, marginBottom:6 }}>Choose your path</h2>
        <p style={{ color:C.muted, fontSize:14, marginBottom:32 }}>One discipline to start. More await as you ascend.</p>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {SKILLS.map((s, i) => (
            <button key={s.id} className={`fade-up-${i+1}`} onClick={() => pickSkill(s)} style={{
              background:C.card, border:`2px solid ${C.border}`, borderRadius:20, padding:"22px 24px",
              cursor:"pointer", textAlign:"left", transition:"all 0.2s", display:"flex", alignItems:"center", gap:20,
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=s.color;e.currentTarget.style.background=`${s.color}18`;e.currentTarget.style.transform="scale(1.02)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.card;e.currentTarget.style.transform="scale(1)";}}>
              <div style={{ fontSize:40, lineHeight:1, flexShrink:0 }}>{s.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Fredoka One'", fontSize:22, color:C.text, marginBottom:4 }}>{s.name}</div>
                <div style={{ fontSize:13, color:C.muted }}>{s.tagline}</div>
              </div>
              <div style={{ fontSize:22, color:C.dim }}>→</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── SWIPE QUESTIONS ──
  if (phase === "swipe") {
    const q = questions[qIndex];
    const progress = qIndex / questions.length;
    return (
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, background:`radial-gradient(ellipse at 50% 0%, ${skill.color}22 0%, ${C.bg} 60%)` }}>
        <style>{globalStyles}</style>
        {/* Header */}
        <div style={{ position:"fixed", top:0, left:0, right:0, padding:"16px 24px", display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={()=>{setPhase("skill");setQIndex(0);setAnswers([]);}} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:20, padding:4 }}>←</button>
          <div style={{ flex:1, background:C.border, borderRadius:99, height:4 }}>
            <div style={{ height:"100%", width:`${((qIndex)/questions.length)*100}%`, background:skill.color, borderRadius:99, transition:"width 0.4s ease" }}/>
          </div>
          <span style={{ fontSize:12, color:C.muted, flexShrink:0 }}>{qIndex+1} / {questions.length}</span>
        </div>

        {/* Card */}
        <div style={{ maxWidth:380, width:"100%", ...swipeStyle }}>
          <div style={{
            background:C.card, border:`2px solid ${C.border}`, borderRadius:28, padding:36,
            textAlign:"center", boxShadow:`0 24px 64px rgba(0,0,0,0.4)`,
          }}>
            <div style={{ fontSize:52, marginBottom:20 }}>{skill.emoji}</div>
            <p style={{ fontFamily:"'Fredoka One'", fontSize:22, color:C.text, lineHeight:1.4, marginBottom:12 }}>
              {q.text}
            </p>
            {/* Hint — shown subtly */}
            <p style={{ fontSize:13, color:C.dim, marginBottom:32, minHeight:18 }}>
              The Oracle awaits your answer
            </p>

            {/* YES / NO buttons */}
            <div style={{ display:"flex", gap:16 }}>
              <button onClick={() => handleAnswer(false)} style={{
                flex:1, padding:"18px", borderRadius:99, border:`2px solid ${C.red}44`,
                background:`${C.red}18`, color:C.red, fontFamily:"'Fredoka One'", fontSize:20,
                cursor:"pointer", transition:"all 0.15s",
              }}
                onMouseEnter={e=>{e.currentTarget.style.background=`${C.red}33`;e.currentTarget.style.transform="scale(1.05)";}}
                onMouseLeave={e=>{e.currentTarget.style.background=`${C.red}18`;e.currentTarget.style.transform="scale(1)";}}>
                ✕ Nope
              </button>
              <button onClick={() => handleAnswer(true)} style={{
                flex:1, padding:"18px", borderRadius:99, border:`2px solid ${C.green}44`,
                background:`${C.green}18`, color:C.green, fontFamily:"'Fredoka One'", fontSize:20,
                cursor:"pointer", transition:"all 0.15s",
              }}
                onMouseEnter={e=>{e.currentTarget.style.background=`${C.green}33`;e.currentTarget.style.transform="scale(1.05)";}}
                onMouseLeave={e=>{e.currentTarget.style.background=`${C.green}18`;e.currentTarget.style.transform="scale(1)";}}>
                ✓ Yeah
              </button>
            </div>
          </div>

          {/* Answer feedback row */}
          <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:20 }}>
            {answers.map((a,i) => (
              <div key={i} style={{ width:10, height:10, borderRadius:"50%", background: a ? C.green : C.red }}/>
            ))}
            {Array.from({length: questions.length - answers.length}).map((_,i) => (
              <div key={`e${i}`} style={{ width:10, height:10, borderRadius:"50%", background:C.border }}/>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── ADVANCED UNLOCK (3-4 yes answers) ──
  if (phase === "advanced") return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, background:`radial-gradient(ellipse at 50% 0%, ${skill.color}22 0%, ${C.bg} 60%)` }}>
      <style>{globalStyles}</style>
      <div className="fade-up" style={{ maxWidth:420, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:56, marginBottom:12, animation:"float 2s ease-in-out infinite" }}>🔥</div>
        <h2 style={{ fontFamily:"'Fredoka One'", fontSize:30, color:C.text, marginBottom:6 }}>Your power is already felt</h2>
        <p style={{ color:C.muted, fontSize:14, marginBottom:8 }}>
          You answered yes to {yesCount} out of {questions.length} — that puts you at <span style={{ color:skill.color, fontWeight:700 }}>Level {computedLevel}</span>.
        </p>
        <p style={{ color:C.muted, fontSize:13, marginBottom:24 }}>
          Tell us a bit more so we can personalize your path even further. (Optional)
        </p>
        <textarea
          value={advancedText}
          onChange={e => setAdvancedText(e.target.value)}
          placeholder={ADVANCED_PROMPTS[skill.id]}
          rows={3}
          maxLength={200}
          style={{ width:"100%", background:`linear-gradient(160deg,${C.cardHover} 0%,${C.card} 100%)`, border:`1px solid ${C.border}`, borderRadius:16, padding:"14px 16px", color:C.text, fontSize:14, resize:"none", outline:"none", fontFamily:"'DM Sans', sans-serif", marginBottom:8, transition:"border-color 0.2s" }}
          onFocus={e => e.target.style.borderColor = skill.color}
          onBlur={e => e.target.style.borderColor = C.border}
        />
        <div style={{ fontSize:11, color:C.dim, textAlign:"right", marginBottom:20 }}>{advancedText.length}/200</div>
        <button onClick={() => setPhase("ready")} style={{ width:"100%", padding:"16px", borderRadius:14, border:"none", background:`linear-gradient(135deg,${skill.color}CC,${skill.color})`, color:"#fff", fontFamily:"'Fredoka One'", fontSize:18, cursor:"pointer", boxShadow:`0 8px 24px ${skill.color}44` }}>
          {advancedText.trim() ? "The Oracle Accepts →" : "Enter the Realm →"}
        </button>
      </div>
    </div>
  );

  // ── READY / USERNAME ──
  if (phase === "ready") return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, background:`radial-gradient(ellipse at 50% 0%, ${skill.color}22 0%, ${C.bg} 60%)` }}>
      <style>{globalStyles}</style>
      <div className="fade-up" style={{ maxWidth:420, width:"100%", textAlign:"center" }}>
        {/* Level reveal */}
        <div style={{ background:C.card, border:`2px solid ${skill.color}88`, boxShadow:`0 0 40px ${skill.color}22, inset 0 0 20px ${skill.color}08`, borderRadius:24, padding:28, marginBottom:24, boxShadow:`0 0 40px ${skill.color}22` }}>
          <div style={{ fontSize:11, fontWeight:700, color:skill.color, textTransform:"uppercase", letterSpacing:2, marginBottom:12 }}>Your Starting Rank</div>
          <div style={{ fontFamily:"'Fredoka One'", fontSize:64, color:skill.color, lineHeight:1, marginBottom:4 }}>{computedLevel}</div>
          <div style={{ fontFamily:"'Fredoka One'", fontSize:20, color:C.text, marginBottom:8 }}>{LEVEL_LABELS[computedLevel]}</div>
          <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:12 }}>
            {[1,2,3,4,5].map(n => (
              <div key={n} style={{ width:32, height:6, borderRadius:99, background: n <= computedLevel ? skill.color : C.border, transition:"all 0.3s" }}/>
            ))}
          </div>
          <p style={{ fontSize:13, color:C.muted }}>
            {computedLevel >= 4
              ? "Invoker or Archmage track unlocked — harder quests, deeper arcane content."
              : computedLevel >= 3
              ? "Adept track — your spells grow stronger each quest."
              : "Initiate track — every rune decoded from first principles."}
          </p>
        </div>

        {/* Coin bonus */}
        <div style={{ background:`${C.gold}11`, border:`1px solid ${C.gold}33`, borderRadius:14, padding:"10px 16px", marginBottom:24, display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontSize:13, color:C.muted }}>
          <span style={{ fontSize:18 }}>🪙</span>
          <span>Bestowed upon entry: <span style={{ color:C.gold, fontWeight:700 }}>50 Gold</span> + <span style={{ color:C.purple, fontWeight:700 }}>0 XP</span> — earn more by completing quests</span>
        </div>

        {/* Username */}
        <div style={{ marginBottom:20, textAlign:"left" }}>
          <label style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:8 }}>Pick your username</label>
          <input
            value={username}
            onChange={e => { setUsername(e.target.value); setUsernameError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLaunch()}
            placeholder="e.g. rune_weaver_kai"
            maxLength={20}
            style={{ width:"100%", background:C.card, border:`1px solid ${usernameError ? C.red : C.border}`, borderRadius:12, padding:"14px 16px", color:C.text, fontSize:16, outline:"none", fontFamily:"'DM Sans',sans-serif", transition:"border-color 0.2s" }}
            onFocus={e => e.target.style.borderColor = usernameError ? C.red : skill.color}
            onBlur={e => e.target.style.borderColor = usernameError ? C.red : C.border}
          />
          {usernameError && <p style={{ color:C.red, fontSize:12, marginTop:4 }}>{usernameError}</p>}
        </div>

        <button onClick={handleLaunch} disabled={loading} className="glow-anim" style={{
          width:"100%", padding:"17px", borderRadius:14, border:"none",
          background:`linear-gradient(135deg,${C.purpleDark},${C.purple})`,
          color:"#fff", fontFamily:"'Fredoka One'", fontSize:20, cursor:"pointer",
          boxShadow:`0 8px 32px ${C.purpleGlow}`, display:"flex", alignItems:"center", justifyContent:"center", gap:10,
        }}>
          {loading
            ? <><div style={{width:20,height:20,border:"2px solid #fff4",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/> Forging your path...</>
            : "✦ Enter the Realm"}
        </button>
      </div>
    </div>
  );

  return null;
}


// ─── SCREEN: LEARNING PATH ────────────────────────────────────────────────────
function LearningPathScreen({ user, setUser, setScreen, screen }) {
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch(`/learning-path/${user.id}`, "GET");
        setPath(Array.isArray(data) ? data : data.steps || []);
      } catch(e) {
        setError("Couldn't load your path. Check your API connection.");
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const skill = SKILLS.find(s => s.id === user.skill);

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <UserHeader user={user} setScreen={setScreen} nav={[]} />
      <BottomNav screen={screen} setScreen={setScreen} />
      <div style={{ maxWidth:600, margin:"0 auto", padding:24, paddingBottom:90 }}>
        <div className="fade-up" style={{ marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <span style={{ fontSize:28 }}>{skill?.emoji}</span>
            <div>
              <h1 style={{ fontFamily:"'Fredoka One'", fontSize:28, color:C.text, lineHeight:1 }}>Your Skill Tree</h1>
              <p style={{ color:C.muted, fontSize:13 }}>{skill?.name} • Level {user.level} — {LEVEL_LABELS[user.level]}</p>
            </div>
          </div>
        </div>

        {loading && <Spinner />}
        {error && <div style={{ background:"#EF444422", border:"1px solid #EF4444", borderRadius:12, padding:16, color:C.red }}>{error}</div>}
        
        {path && (
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24 }}>
            {path.map((step, i) => (
              <div key={i} className={`fade-up-${i+1}`} style={{ background:C.card, border:`1px solid ${C.border}`, borderLeft:`3px solid ${skill?.color || C.purple}`, borderRadius:14, padding:16, display:"flex", gap:14, alignItems:"flex-start", transition:"all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.transform="translateX(4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.card; e.currentTarget.style.transform="translateX(0)"; }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:`${skill?.color || C.purple}22`, border:`2px solid ${skill?.color || C.purple}`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Fredoka One'", fontSize:15, color:skill?.color || C.purple, flexShrink:0 }}>{i+1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, color:C.text, marginBottom:4, fontSize:15 }}>{step.step}</div>
                  <div style={{ color:C.muted, fontSize:13, marginBottom:10 }}>{step.reason}</div>
                  <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(step.youtube_query)}`} target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#FF000022", border:"1px solid #FF000044", color:"#FF6B6B", borderRadius:8, padding:"4px 10px", fontSize:12, textDecoration:"none", fontWeight:600, transition:"all 0.2s" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#FF000044"} onMouseLeave={e=>e.currentTarget.style.background="#FF000022"}>
                    ▶ ▶ Watch the Scroll
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {path && (
          <button className="fade-up-5" onClick={() => setScreen("mission")} style={{ width:"100%", padding:"16px", borderRadius:14, border:"none", cursor:"pointer", background:`linear-gradient(135deg, ${C.purpleDark}, ${C.purple})`, color:"#fff", fontFamily:"'Fredoka One'", fontSize:20, display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:`0 8px 32px ${C.purpleGlow}` }}>
            ⚡ Begin Today's Quest →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN: MISSION ──────────────────────────────────────────────────────────
function MissionScreen({ user, setUser, setScreen, setLastResult, screen }) {
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch(`/mission/${user.id}`, "GET");
        setMission(data);
      } catch(e) {
        setError("Couldn't load today's mission. Check your API connection.");
      } finally { setLoading(false); }
    }
    load();
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const answersArray = mission.questions.map((_, i) => answers[i] ?? 0);
      const backendResult = await apiFetch("/submit-quiz", "POST", {
        user_id: user.id,
        mission_id: mission.mission_id || 1,
        answers: answersArray,
      });
      const score = backendResult.score;
      const xpGained = backendResult.xp_gained;
      const result = {
        shareId: backendResult.share_id,
        creator: { username: user.username, score, total: mission.questions.length, xpGained },
        challenger: { username: "VoidWraith_XIII", score: Math.floor(Math.random() * 4), total: mission.questions.length, xpGained: Math.floor(Math.random() * 150) },
        xpBefore: user.xp,
        xpAfter: user.xp + xpGained,
        questions: mission.questions,
        userAnswers: answers,
      };
      setUser(u => ({
        ...u,
        xp: u.xp + xpGained,
        level: backendResult.leveled_up ? u.level + 1 : u.level,
        bronze_keys: (u.bronze_keys || 0) + 1,
        silver_keys: (u.silver_keys || 0) + (score === mission.questions.length ? 1 : 0),
      }));
      setLastResult(result);
      await new Promise(r => setTimeout(r, 400));
      setScreen("results");
    } catch(e) {
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const allAnswered = mission && Object.keys(answers).length === mission.questions.length;

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <UserHeader user={user} setScreen={setScreen} nav={[{id:"path",label:"Skill Tree"},{id:"leaderboard",label:"🏆"},{id:"buddy",label:"Allies"}]} />
      <BottomNav screen={screen} setScreen={setScreen} />
      <div style={{ maxWidth:600, margin:"0 auto", padding:24, paddingBottom:90 }}>
        
        {loading && <Spinner />}
        {error && <div style={{ background:"#EF444422", border:"1px solid #EF4444", borderRadius:12, padding:16, color:C.red }}>{error}</div>}
        
        {mission && (<>
          <div className="fade-up-1" style={{ background:`linear-gradient(160deg,${C.cardHover} 0%,${C.card} 100%)`, border:`1px solid ${C.border}`, borderRadius:16, padding:20, marginBottom:24 }}>
            <span style={{ fontSize:11, fontWeight:700, color:C.purple, textTransform:"uppercase", letterSpacing:1.5 }}>📜 Ancient Scroll</span>
            <h2 style={{ fontFamily:"'Fredoka One'", fontSize:22, color:C.text, margin:"8px 0 10px", lineHeight:1.3 }}>{mission.scroll_title}</h2>
            <p style={{ color:C.muted, fontSize:14, lineHeight:1.6 }}>{mission.summary}</p>
          </div>

          <h3 className="fade-up-2" style={{ fontFamily:"'Fredoka One'", fontSize:22, marginBottom:16 }}>🧠 Trial of Knowledge</h3>
          
          {mission.questions.map((q, qi) => (
            <div key={qi} className={`fade-up-${qi+2}`} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:18, marginBottom:14 }}>
              <p style={{ fontWeight:600, fontSize:15, marginBottom:14, color:C.text }}>
                <span style={{ color:C.purple, fontFamily:"'Fredoka One'" }}>Q{qi+1}.</span> {q.question}
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {q.options.map((opt, oi) => {
                  const selected = answers[qi] === oi;
                  return (
                    <button key={oi} onClick={() => setAnswers(a => ({ ...a, [qi]: oi }))} style={{
                      background: selected ? `${C.purple}33` : C.surface,
                      border: `2px solid ${selected ? C.purple : C.border}`,
                      borderRadius:10, padding:"10px 12px", color: selected ? C.text : C.muted,
                      cursor:"pointer", fontSize:13, textAlign:"left", transition:"all 0.15s",
                      fontFamily:"'DM Sans', sans-serif", fontWeight: selected ? 600 : 400,
                      transform: selected ? "scale(1.02)" : "scale(1)",
                    }}
                      onMouseEnter={e => { if(!selected) { e.currentTarget.style.borderColor=C.dim; e.currentTarget.style.color=C.text; }}}
                      onMouseLeave={e => { if(!selected) { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.muted; }}}>
                      <span style={{ color:C.purple, fontWeight:700, marginRight:6 }}>{["A","B","C","D"][oi]}.</span>{opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <button className="fade-up-5" disabled={!allAnswered || submitting} onClick={handleSubmit} style={{
            width:"100%", marginTop:8, padding:"16px", borderRadius:14, border:"none",
            cursor: allAnswered ? "pointer" : "not-allowed",
            background: allAnswered ? `linear-gradient(135deg, ${C.purpleDark}, ${C.purple})` : C.dim,
            color:"#fff", fontFamily:"'Fredoka One'", fontSize:20,
            display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            boxShadow: allAnswered ? `0 8px 32px ${C.purpleGlow}` : "none", transition:"all 0.2s",
          }}>
            {submitting ? <><div style={{width:20,height:20,border:"2px solid #fff4",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite"}} /> Scoring...</> : `${!allAnswered ? `Answer All Trials (${Object.keys(answers).length}/3)` : "⚔️ Submit to the Oracle ✓"}`}
          </button>
        </>)}
      </div>
    </div>
  );
}

// ─── SCREEN: RESULTS ──────────────────────────────────────────────────────────
function ResultsScreen({ user, lastResult, setScreen, screen }) {
  const [xpWidth, setXpWidth] = useState(0);
  const [copied, setCopied] = useState(false);
  const shareUrl = `https://neuroleague.app/challenge/${lastResult?.shareId || "demo123"}`;

  useEffect(() => {
    if (!lastResult) return;
    const oldPct = Math.min(((lastResult.xpBefore % 100) / 100) * 100, 100);
    const newPct = Math.min(((lastResult.xpAfter % 100) / 100) * 100, 100);
    setXpWidth(oldPct);
    const t = setTimeout(() => setXpWidth(newPct), 300);
    return () => clearTimeout(t);
  }, [lastResult]);

  if (!lastResult) return <div style={{ padding:40, textAlign:"center", color:C.muted }}>No results yet. <button onClick={() => setScreen("mission")} style={{ color:C.purple, background:"none", border:"none", cursor:"pointer" }}>Take a quiz!</button></div>;

  const { creator, challenger, xpBefore, xpAfter, questions, userAnswers } = lastResult;
  const creatorWon = creator.score >= challenger.score;

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <UserHeader user={user} setScreen={setScreen} nav={[{id:"mission",label:"Quests"},{id:"leaderboard",label:"🏆"},{id:"buddy",label:"Allies"}]} />
      <BottomNav screen={screen} setScreen={setScreen} />
      <div style={{ maxWidth:600, margin:"0 auto", padding:24, paddingBottom:90 }}>
          <div style={{ fontFamily:"'Fredoka One'", fontSize:52, animation:"float 2s ease-in-out infinite" }}>🏆</div>
          <h1 style={{ fontFamily:"'Fredoka One'", fontSize:36, color:C.text }}>Duel Results!</h1>
          <p style={{ color:C.muted, fontSize:14 }}>{creator.score === 3 ? "🔥 Flawless victory! The Oracle is pleased." : creator.score === 2 ? "⚔️ A worthy showing, adventurer." : "📜 Study the ancient texts. You will rise."}</p>
        </div>

        {/* Score cards */}
        <div className="fade-up-1" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
          {[
            { ...creator, label:"YOU", isYou:true, won:creatorWon },
            { ...challenger, label:"OPPONENT", isYou:false, won:!creatorWon },
          ].map((p, i) => (
            <div key={i} style={{
              background:C.card, border:`2px solid ${p.won ? C.gold : C.border}`,
              borderRadius:16, padding:18, textAlign:"center",
              boxShadow: p.won ? `0 0 32px ${C.gold}44, inset 0 0 20px ${C.gold}08` : "none",
            }}>
              <div style={{ fontSize:11, fontWeight:700, color: p.won ? C.gold : C.muted, letterSpacing:1.5, marginBottom:8 }}>{p.won ? "👑 WINNER" : p.label}</div>
              <div style={{ fontFamily:"'Fredoka One'", fontSize:13, color:C.muted, marginBottom:4 }}>{p.username}</div>
              <div style={{ fontFamily:"'Fredoka One'", fontSize:42, color: p.won ? C.gold : C.text, lineHeight:1 }}>{p.score}/{p.total}</div>
              <div style={{ fontSize:13, color:C.green, marginTop:6, fontWeight:600 }}>+{p.xpGained} XP</div>
            </div>
          ))}
        </div>

        {/* XP bar */}
        <div className="fade-up-2" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:13 }}>
            <span style={{ color:C.muted }}>Power Gained</span>
            <span style={{ color:C.purple, fontWeight:600 }}>{xpAfter} XP</span>
          </div>
          <div style={{ background:C.border, borderRadius:99, height:12, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${xpWidth}%`, background:`linear-gradient(90deg,${C.purpleDark},${C.purple},#C084FC)`, borderRadius:99, transition:"width 1.5s cubic-bezier(.4,0,.2,1)", boxShadow:`0 0 12px ${C.purpleGlow}` }} />
          </div>
          <div style={{ fontSize:12, color:C.muted, marginTop:6 }}>+{xpAfter - xpBefore} XP absorbed</div>
        </div>

        {/* Answer review */}
        <div className="fade-up-3" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:20 }}>
          <h3 style={{ fontFamily:"'Fredoka One'", fontSize:16, marginBottom:12, color:C.text }}>Scroll of Truths</h3>
          {questions.map((q, qi) => {
            const correct = userAnswers[qi] === q.correct_index;
            return (
              <div key={qi} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:8 }}>
                <span style={{ fontSize:16, flexShrink:0 }}>{correct ? "✅" : "❌"}</span>
                <div>
                  <div style={{ fontSize:13, color:C.muted }}>{q.question}</div>
                  {!correct && <div style={{ fontSize:12, color:C.green, marginTop:2 }}>✓ {q.options[q.correct_index]}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Share */}
        <div className="fade-up-4" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:20 }}>
          <h3 style={{ fontFamily:"'Fredoka One'", fontSize:18, marginBottom:4 }}>🔗 Challenge a Rival</h3>
          <p style={{ color:C.muted, fontSize:13, marginBottom:12 }}>Dispatch this trial scroll — face a rival and compare your power</p>
          <div style={{ display:"flex", gap:8 }}>
            <input readOnly value={shareUrl} style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 12px", color:C.muted, fontSize:12, fontFamily:"monospace", outline:"none" }} />
            <button onClick={handleCopy} style={{ background: copied ? C.green : C.purple, border:"none", borderRadius:8, padding:"8px 16px", color:"#fff", cursor:"pointer", fontWeight:600, fontSize:13, transition:"all 0.2s", whiteSpace:"nowrap" }}>
              {copied ? "Copied! ✓" : "Copy Link"}
            </button>
          </div>
        </div>

        <div className="fade-up-5" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <button onClick={() => setScreen("mission")} style={{ padding:"14px", borderRadius:12, border:`2px solid ${C.border}`, background:"transparent", color:C.text, cursor:"pointer", fontFamily:"'Fredoka One'", fontSize:16, transition:"all 0.2s" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.purple;e.currentTarget.style.color=C.purple;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text;}}>
            Next Quest ⚡
          </button>
          <button onClick={() => setScreen("buddy")} style={{ padding:"14px", borderRadius:12, border:"none", background:`linear-gradient(135deg, ${C.purpleDark}, ${C.purple})`, color:"#fff", cursor:"pointer", fontFamily:"'Fredoka One'", fontSize:16 }}>
            Seek an Ally ⚔️
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: BUDDY ────────────────────────────────────────────────────────────
const FAKE_BUDDIES = [
  { id: 101, username: "beatmaker_kai", skill: "music", skillName: "Music", level: 3, streak: 7 },
  { id: 102, username: "cryptowhale_99", skill: "crypto", skillName: "Crypto", level: 2, streak: 12 },
  { id: 103, username: "code_samurai", skill: "coding", skillName: "Coding", level: 4, streak: 5 },
];

function BuddyScreen({ user, setUser, setLastResult, setScreen, screen }) {
  const [challenging, setChallenging] = useState(null);
  const skillColor = { music:"#A855F7", crypto:"#22C55E", coding:"#06B6D4" };

  async function handleChallenge(buddy) {
    setChallenging(buddy.id);
    await new Promise(r => setTimeout(r, 800));
    const shareId = `buddy_${Date.now()}`;
    const result = {
      shareId,
      creator: { username: user.username, score: 0, total: 3, xpGained: 0 },
      challenger: { username: buddy.username, score: 0, total: 3, xpGained: 0 },
      xpBefore: user.xp, xpAfter: user.xp,
      questions: [], userAnswers: {},
    };
    setLastResult(result);
    setChallenging(null);
    setScreen("mission");
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <UserHeader user={user} setScreen={setScreen} nav={[{id:"mission",label:"Quests"},{id:"path",label:"Skill Tree"},{id:"leaderboard",label:"🏆"}]} />
      <BottomNav screen={screen} setScreen={setScreen} />
      <div style={{ maxWidth:600, margin:"0 auto", padding:24, paddingBottom:90 }}>
        <div className="fade-up" style={{ marginBottom:24 }}>
          <h1 style={{ fontFamily:"'Fredoka One'", fontSize:30, color:C.text }}>🛡️ Find an Ally</h1>
          <p style={{ color:C.muted, fontSize:14 }}>These adventurers walk the same path</p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24 }}>
          {FAKE_BUDDIES.map((buddy, i) => (
            <div key={buddy.id} className={`fade-up-${i+1}`} style={{ background:`linear-gradient(160deg,${C.cardHover} 0%,${C.card} 100%)`, border:`1px solid ${C.border}`, borderRadius:16, padding:16, display:"flex", alignItems:"center", gap:14 }}>
              <Avatar name={buddy.username} skill={buddy.skill} size={46} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:15, color:C.text, marginBottom:4 }}>{buddy.username}</div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <Badge text={`${buddy.skillName} • Lvl ${buddy.level}`} color={skillColor[buddy.skill]} />
                  <span style={{ fontSize:12, color:C.muted }}>🔥 {buddy.streak}-day flame</span>
                </div>
              </div>
              <button onClick={() => handleChallenge(buddy)} disabled={challenging===buddy.id} style={{
                background: challenging===buddy.id ? C.dim : `linear-gradient(135deg, ${C.purpleDark}, ${C.purple})`,
                border:"none", borderRadius:10, padding:"10px 16px", color:"#fff", cursor:"pointer",
                fontFamily:"'Fredoka One'", fontSize:14, display:"flex", alignItems:"center", gap:6, transition:"all 0.2s",
              }}>
                {challenging===buddy.id ? <div style={{width:14,height:14,border:"2px solid #fff4",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite"}} /> : "⚔️"} Duel
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => setScreen("home")} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 20px", color:C.muted, cursor:"pointer", fontSize:14 }}>← Back to Home</button>
      </div>
    </div>
  );
}

// ─── SCREEN: LEADERBOARD ──────────────────────────────────────────────────────
const FAKE_LEADERS = {
  music: [
    { id:1, username:"dj_phantom", level:5, xp:2340 },
    { id:2, username:"beatmaker_kai", level:4, xp:1890 },
    { id:3, username:"synth_goddess", level:4, xp:1650 },
    { id:4, username:"lo_fi_lord", level:3, xp:1200 },
    { id:5, username:"808_wizard", level:3, xp:980 },
  ],
  crypto: [
    { id:10, username:"cryptowhale_99", level:5, xp:3100 },
    { id:11, username:"defi_samurai", level:5, xp:2700 },
    { id:12, username:"hodl_queen", level:4, xp:2100 },
    { id:13, username:"chart_prophet", level:3, xp:1450 },
    { id:14, username:"altcoin_hunter", level:2, xp:890 },
  ],
  coding: [
    { id:20, username:"code_samurai", level:5, xp:4200 },
    { id:21, username:"null_pointer", level:5, xp:3800 },
    { id:22, username:"async_queen", level:4, xp:2900 },
    { id:23, username:"debug_deity", level:4, xp:2300 },
    { id:24, username:"git_master", level:3, xp:1700 },
  ],
};
const RANK_COLORS = [C.gold, C.silver, C.bronze];
const RANK_EMOJIS = ["👑","🌟","✦"];

function LeaderboardScreen({ user, setScreen, screen }) {
  const [tab, setTab] = useState(user.skill || "music");

  const leaders = FAKE_LEADERS[tab] || [];
  // Insert user if not present
  const userInList = leaders.find(l => l.username === user.username);
  const displayList = userInList ? leaders : [
    ...leaders.slice(0,4),
    { id:user.id, username:user.username, level: Math.floor(user.xp/100)+1, xp:user.xp, isYou:true },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <UserHeader user={user} setScreen={setScreen} nav={[{id:"mission",label:"Quests"},{id:"buddy",label:"Allies"},{id:"path",label:"Skill Tree"}]} />
      <BottomNav screen={screen} setScreen={setScreen} />
      <div style={{ maxWidth:600, margin:"0 auto", padding:24, paddingBottom:90 }}>
        <div className="fade-up" style={{ marginBottom:24 }}>
          <h1 style={{ fontFamily:"'Fredoka One'", fontSize:32, color:C.text }} className="arcane-title">🏆 Hall of Champions</h1>
          <p style={{ color:C.muted, fontSize:14 }}>The mightiest adventurers in the realm</p>
        </div>

        <div className="fade-up-1" style={{ display:"flex", gap:8, marginBottom:24 }}>
          {SKILLS.map(s => (
            <button key={s.id} onClick={() => setTab(s.id)} style={{
              padding:"8px 14px", borderRadius:10, border:`2px solid ${tab===s.id ? s.color : C.border}`,
              background: tab===s.id ? `${s.color}22` : "transparent", color: tab===s.id ? s.color : C.muted,
              cursor:"pointer", fontSize:12, fontWeight:600, transition:"all 0.2s",
            }}>{s.emoji} {s.name}</button>
          ))}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {displayList.map((player, i) => {
            const isUser = player.username === user.username;
            const rankColor = RANK_COLORS[i] || C.muted;
            return (
              <div key={player.id} className={`fade-up-${Math.min(i+1,5)}`} style={{
                background: isUser ? `${C.purple}18` : C.card,
                border: `1px solid ${isUser ? C.purple : C.border}`,
                borderRadius:14, padding:"14px 16px", display:"flex", alignItems:"center", gap:12,
                transition:"all 0.2s",
              }}>
                <div style={{ width:28, textAlign:"center", fontFamily:"'Fredoka One'", fontSize:18, color:rankColor, flexShrink:0 }}>
                  {i < 3 ? RANK_EMOJIS[i] : <span style={{ fontSize:14, color:C.dim }}>{i+1}</span>}
                </div>
                <Avatar name={player.username} skill={tab} size={36} />
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontWeight:600, fontSize:14, color: isUser ? C.purple : C.text }}>{player.username}</span>
                    {isUser && <Badge text="YOU" color={C.purple} />}{i===0 && !isUser && <Badge text="⚗️ Sage" color={C.gold} />}
                  </div>
                  <span style={{ fontSize:12, color:C.muted }}>Level {player.level}</span>
                </div>
                <div style={{ fontFamily:"'Fredoka One'", fontSize:18, color:rankColor }}>{player.xp.toLocaleString()} <span style={{ fontSize:11, color:C.muted }}>XP</span></div>
              </div>
            );
          })}
        </div>

        <button onClick={() => setScreen("mission")} style={{ marginTop:24, background:`linear-gradient(135deg, ${C.purpleDark}, ${C.purple})`, border:"none", borderRadius:12, padding:"14px 24px", color:"#fff", cursor:"pointer", fontFamily:"'Fredoka One'", fontSize:16, width:"100%" }}>
          ⚔️ Return to Quests
        </button>
      </div>
    </div>
  );
}

// ─── LOCAL MEETUP DATA ─────────────────────────────────────────────────────────
const INTEREST_TAGS = {
  music:  ["Music Theory","Beat Making","Sound Design","Mixing & Mastering","Synth Programming","Music Business","Live Performance","Ear Training"],
  crypto: ["DeFi","NFTs","Trading Strategies","Blockchain Dev","Web3","Bitcoin","Altcoins","On-chain Analysis"],
  coding: ["Web Dev","Algorithms","System Design","Machine Learning","Open Source","DevOps","Mobile Dev","Competitive Coding"],
};

const VENUES = {
  music: [
    {id:"v1",name:"The Beat Lab",type:"Studio",address:"2847 Commerce St, Dallas TX",distance:"0.4 mi",rating:4.8,tags:["studio","equipment","soundproofed"],emoji:"🎙️"},
    {id:"v2",name:"Deep Ellum Coffee",type:"Cafe",address:"2816 Elm St, Dallas TX",distance:"0.7 mi",rating:4.6,tags:["quiet","wifi","plugs"],emoji:"☕"},
    {id:"v3",name:"Sound Grounds",type:"Cafe + Studio",address:"1910 Pacific Ave, Dallas TX",distance:"1.2 mi",rating:4.9,tags:["studio","open-mic","chill"],emoji:"🎵"},
  ],
  crypto: [
    {id:"v4",name:"Canopy by Hilton",type:"Co-working",address:"1717 McKinney Ave, Dallas TX",distance:"0.6 mi",rating:4.7,tags:["private rooms","screens","wifi"],emoji:"🏢"},
    {id:"v5",name:"Common Desk Uptown",type:"Co-working",address:"2919 Commerce St, Dallas TX",distance:"0.9 mi",rating:4.8,tags:["co-working","fast wifi","monitors"],emoji:"💼"},
    {id:"v6",name:"Setup Coffee",type:"Cafe",address:"3500 Oak Lawn Ave, Dallas TX",distance:"1.5 mi",rating:4.5,tags:["quiet","large tables","wifi"],emoji:"☕"},
  ],
  coding: [
    {id:"v7",name:"Dallas Public Library",type:"Library",address:"1515 Young St, Dallas TX",distance:"0.5 mi",rating:4.6,tags:["free","quiet","wifi","whiteboards"],emoji:"📚"},
    {id:"v8",name:"Codeup Campus",type:"Tech Space",address:"707 W 5th St, Dallas TX",distance:"0.8 mi",rating:4.9,tags:["dev-friendly","screens","events"],emoji:"💻"},
    {id:"v9",name:"Method Coffee",type:"Cafe",address:"1107 Botham Jean Blvd, Dallas TX",distance:"1.1 mi",rating:4.7,tags:["hipster","good wifi","outlets"],emoji:"☕"},
  ],
};

const NEARBY_USERS = [
  {id:301,username:"melodic_maya",  skill:"music", level:3,distance:"0.3 mi",neighborhood:"Deep Ellum",     interests:["Beat Making","Music Theory","Mixing & Mastering"],streak:9, bio:"FL Studio producer, love lo-fi and future bass."},
  {id:302,username:"bassline_brett",skill:"music", level:2,distance:"0.6 mi",neighborhood:"Uptown",         interests:["Beat Making","Sound Design","Live Performance"],   streak:4, bio:"Learning synthesis and live looping on weekends."},
  {id:303,username:"chain_chidi",   skill:"crypto",level:4,distance:"0.4 mi",neighborhood:"Uptown",         interests:["DeFi","On-chain Analysis","Trading Strategies"],   streak:21,bio:"Full-time DeFi researcher. Always watching on-chain flows."},
  {id:304,username:"nft_nalini",    skill:"crypto",level:2,distance:"1.1 mi",neighborhood:"Oak Cliff",      interests:["NFTs","Web3","Bitcoin"],                           streak:6, bio:"Exploring web3 art and DAOs."},
  {id:305,username:"algo_amara",    skill:"coding",level:5,distance:"0.2 mi",neighborhood:"Downtown",       interests:["Algorithms","Competitive Coding","System Design"],  streak:44,bio:"Google SWE prep grind. LeetCode daily."},
  {id:306,username:"devops_dani",   skill:"coding",level:3,distance:"0.8 mi",neighborhood:"Bishop Arts",    interests:["DevOps","Open Source","Web Dev"],                  streak:12,bio:"Building CI/CD pipelines and contributing to OSS."},
  {id:307,username:"synth_sofia",   skill:"music", level:4,distance:"1.4 mi",neighborhood:"Knox-Henderson", interests:["Synth Programming","Sound Design","Music Theory"],  streak:17,bio:"Modular synth nerd. Eurorack and Max/MSP."},
  {id:308,username:"web3_winston",  skill:"crypto",level:3,distance:"0.9 mi",neighborhood:"Uptown",         interests:["Blockchain Dev","Web3","DeFi"],                    streak:8, bio:"Solidity dev building on Ethereum L2s."},
  {id:309,username:"ml_marcus",     skill:"coding",level:4,distance:"1.6 mi",neighborhood:"Addison",        interests:["Machine Learning","Open Source","System Design"],  streak:23,bio:"Training models and reading papers on weekends."},
];

const TIME_SLOTS = ["9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM"];

function getNextDays(n) {
  const days=[],d=new Date();
  const dn=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const mn=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  for(let i=1;i<=n;i++){
    const nx=new Date(d); nx.setDate(d.getDate()+i);
    days.push({key:`${nx.getFullYear()}-${nx.getMonth()}-${nx.getDate()}`,label:dn[nx.getDay()],date:nx.getDate(),month:mn[nx.getMonth()]});
  }
  return days;
}

// ─── SCREEN: MEETUP ────────────────────────────────────────────────────────────
function MeetupScreen({ user, setScreen, screen }) {
  const [tab, setTab] = useState("discover");
  const [selUser, setSelUser] = useState(null);
  const [selVenue, setSelVenue] = useState(null);
  const [selDay, setSelDay] = useState(null);
  const [selTime, setSelTime] = useState(null);
  const [step, setStep] = useState(0);
  const [filterInterest, setFilterInterest] = useState(null);
  const [sent, setSent] = useState([]);
  const [meetups, setMeetups] = useState([
    {id:"cm1",with:"algo_amara",venue:VENUES.coding[0],day:"Tomorrow",time:"3:00 PM",interest:"Algorithms"},
  ]);

  const SC = {music:"#A855F7",crypto:"#22C55E",coding:"#06B6D4"};
  const myInt = INTEREST_TAGS[user.skill] || [];
  const days = getNextDays(7);
  const venues = VENUES[user.skill] || [];
  const NAV = [{id:"mission",label:"Quests"},{id:"buddy",label:"Allies"},{id:"leaderboard",label:"🏆"}];

  const nearby = NEARBY_USERS
    .filter(u => u.skill === user.skill)
    .map(u => ({...u, shared: filterInterest ? u.interests.filter(i=>i===filterInterest) : u.interests.filter(i=>myInt.includes(i))}))
    .filter(u => u.shared.length > 0)
    .sort((a,b) => b.shared.length - a.shared.length || parseFloat(a.distance) - parseFloat(b.distance));

  function startBooking(u) { setSelUser(u); setStep(1); setTab("book"); }

  function confirmBooking() {
    setMeetups(prev => [{
      id:`cm${Date.now()}`, with:selUser.username, venue:selVenue,
      day:`${selDay.label} ${selDay.date}`, time:selTime, interest:selUser.shared[0]
    }, ...prev]);
    setSent(s => [...s, selUser.id]);
    setStep(4);
  }

  function reset() {
    setSelUser(null); setSelVenue(null); setSelDay(null); setSelTime(null);
    setStep(0); setTab("discover");
  }

  if (tab==="book" && step===4) return (
    <div style={{minHeight:"100vh",background:C.bg}}>
      <UserHeader user={user} setScreen={setScreen} nav={NAV}/>
      <div style={{maxWidth:520,margin:"0 auto",padding:40,textAlign:"center"}}>
        <div style={{fontSize:64,marginBottom:16,animation:"float 2s ease-in-out infinite"}}>📅</div>
        <h1 style={{fontFamily:"'Fredoka One'",fontSize:32,color:C.text,marginBottom:8}}>Guild Meeting Sealed!</h1>
        <p style={{color:C.muted,fontSize:15,marginBottom:20}}>Request sent to <span style={{color:C.purple,fontWeight:600}}>{selUser?.username}</span></p>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20,textAlign:"left",marginBottom:24}}>
          <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:32}}>{selVenue?.emoji}</div>
            <div>
              <div style={{fontFamily:"'Fredoka One'",fontSize:18,color:C.text}}>{selVenue?.name}</div>
              <div style={{fontSize:13,color:C.muted}}>{selVenue?.address}</div>
            </div>
          </div>
          {[["Date",`${selDay?.label}, ${selDay?.month} ${selDay?.date}`],["Time",selTime],["With",selUser?.username],["Topic",selUser?.shared?.[0]]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{color:C.muted,fontSize:13}}>{k}</span>
              <span style={{color:C.text,fontSize:13,fontWeight:600}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <button onClick={reset} style={{padding:"13px",borderRadius:12,border:`2px solid ${C.border}`,background:"transparent",color:C.text,cursor:"pointer",fontFamily:"'Fredoka One'",fontSize:15}}>Find Another</button>
          <button onClick={()=>{setStep(0);setTab("confirmed");}} style={{padding:"13px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${C.purpleDark},${C.purple})`,color:"#fff",cursor:"pointer",fontFamily:"'Fredoka One'",fontSize:15}}>My Gatherings 📅</button>
        </div>
      </div>
    </div>
  );

  if (tab==="book") return (
    <div style={{minHeight:"100vh",background:C.bg}}>
      <UserHeader user={user} setScreen={setScreen} nav={NAV}/>
      <div style={{maxWidth:600,margin:"0 auto",padding:24}}>
        <div style={{display:"flex",alignItems:"center",marginBottom:24}}>
          {[{n:1,l:"Venue"},{n:2,l:"Date & Time"},{n:3,l:"Confirm"}].map((s,i) => (
            <div key={s.n} style={{display:"flex",alignItems:"center",flex:i<2?1:"auto"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:step>=s.n?C.purple:C.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:step>=s.n?"#fff":C.muted,transition:"all 0.3s"}}>{s.n}</div>
                <span style={{fontSize:12,color:step>=s.n?C.text:C.muted,fontWeight:step>=s.n?600:400}}>{s.l}</span>
              </div>
              {i<2 && <div style={{flex:1,height:2,background:step>s.n?C.purple:C.border,margin:"0 8px",transition:"all 0.3s"}}/>}
            </div>
          ))}
        </div>
        <div style={{background:C.card,border:`1px solid ${C.purple}44`,borderRadius:14,padding:14,marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
          <Avatar name={selUser?.username} skill={user.skill} size={42}/>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:C.text,marginBottom:2}}>{selUser?.username}</div>
            <div style={{fontSize:12,color:C.muted}}>📍 {selUser?.neighborhood} · <span style={{color:C.green,fontWeight:600}}>{selUser?.distance} away</span></div>
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end",maxWidth:180}}>
            {selUser?.shared?.slice(0,2).map(i => <span key={i} style={{fontSize:11,background:`${SC[user.skill]}22`,color:SC[user.skill],border:`1px solid ${SC[user.skill]}44`,borderRadius:20,padding:"2px 9px",fontWeight:600}}>{i}</span>)}
          </div>
        </div>

        {step===1 && (
          <div className="fade-up">
            <h2 style={{fontFamily:"'Fredoka One'",fontSize:22,marginBottom:6}}>📍 Pick a Spot</h2>
            <p style={{color:C.muted,fontSize:13,marginBottom:16}}>Arcane halls in Dallas suited for {user.skillName}</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {venues.map(v => (
                <button key={v.id} onClick={()=>{setSelVenue(v);setStep(2);}}
                  style={{background:C.card,border:`2px solid ${C.border}`,borderRadius:16,padding:16,cursor:"pointer",textAlign:"left",transition:"all 0.2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=C.purple;e.currentTarget.style.background=`${C.purple}18`;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.card;}}>
                  <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                    <div style={{fontSize:30,lineHeight:1,flexShrink:0}}>{v.emoji}</div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                        <span style={{fontFamily:"'Fredoka One'",fontSize:17,color:C.text}}>{v.name}</span>
                        <span style={{background:`${C.cyan}22`,color:C.cyan,border:`1px solid ${C.cyan}44`,borderRadius:99,padding:"1px 8px",fontSize:11,fontWeight:600}}>{v.type}</span>
                        <span style={{fontSize:12,color:C.muted,marginLeft:"auto"}}>📍 {v.distance}</span>
                      </div>
                      <div style={{fontSize:12,color:C.muted,marginBottom:8}}>{v.address}</div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                        {v.tags.map(t=><span key={t} style={{fontSize:11,background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"2px 7px",color:C.muted}}>#{t}</span>)}
                      </div>
                    </div>
                    <div style={{fontSize:13,color:C.gold,fontWeight:700,flexShrink:0}}>⭐ {v.rating}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step===2 && (
          <div className="fade-up">
            <h2 style={{fontFamily:"'Fredoka One'",fontSize:22,marginBottom:6}}>📅 Pick a Time</h2>
            <p style={{color:C.muted,fontSize:13,marginBottom:16}}>at <strong style={{color:C.text}}>{selVenue?.name}</strong></p>
            <div style={{display:"flex",gap:8,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
              {days.map(d => (
                <button key={d.key} onClick={()=>setSelDay(d)}
                  style={{flexShrink:0,width:56,padding:"10px 0",borderRadius:12,border:`2px solid ${selDay?.key===d.key?C.purple:C.border}`,background:selDay?.key===d.key?`${C.purple}22`:C.card,cursor:"pointer",textAlign:"center",transition:"all 0.2s"}}>
                  <div style={{fontSize:11,color:selDay?.key===d.key?C.purple:C.muted,fontWeight:600,marginBottom:4}}>{d.label}</div>
                  <div style={{fontFamily:"'Fredoka One'",fontSize:20,color:selDay?.key===d.key?C.text:C.muted}}>{d.date}</div>
                  <div style={{fontSize:10,color:C.dim}}>{d.month}</div>
                </button>
              ))}
            </div>
            {selDay && (<>
              <p style={{fontSize:13,color:C.muted,marginBottom:10}}>Available times</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:20}}>
                {TIME_SLOTS.map(t => (
                  <button key={t} onClick={()=>setSelTime(t)}
                    style={{padding:"9px 4px",borderRadius:10,border:`2px solid ${selTime===t?C.purple:C.border}`,background:selTime===t?`${C.purple}22`:C.card,color:selTime===t?C.text:C.muted,cursor:"pointer",fontSize:12,fontWeight:selTime===t?700:400,transition:"all 0.15s"}}>
                    {t}
                  </button>
                ))}
              </div>
              {selTime && (
                <button onClick={()=>setStep(3)} style={{width:"100%",padding:"15px",borderRadius:14,border:"none",background:`linear-gradient(135deg,${C.purpleDark},${C.purple})`,color:"#fff",fontFamily:"'Fredoka One'",fontSize:19,cursor:"pointer",boxShadow:`0 8px 32px ${C.purpleGlow}`}}>
                  Review Gathering →
                </button>
              )}
            </>)}
          </div>
        )}

        {step===3 && (
          <div className="fade-up">
            <h2 style={{fontFamily:"'Fredoka One'",fontSize:22,marginBottom:16}}>✅ Seal the Gathering</h2>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20,marginBottom:16}}>
              <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:16}}>
                <div style={{fontSize:34}}>{selVenue?.emoji}</div>
                <div>
                  <div style={{fontFamily:"'Fredoka One'",fontSize:18,color:C.text}}>{selVenue?.name}</div>
                  <div style={{fontSize:13,color:C.muted}}>{selVenue?.address}</div>
                </div>
              </div>
              {[["📅","Date",`${selDay?.label}, ${selDay?.month} ${selDay?.date}`],["⏰","Time",selTime],["👤","Meeting",selUser?.username],["🎯","Focus",selUser?.shared?.[0]],["📍","Distance",selVenue?.distance]].map(([ic,k,v])=>(
                <div key={k} style={{display:"flex",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                  <span style={{fontSize:16,marginRight:10}}>{ic}</span>
                  <span style={{color:C.muted,fontSize:13,flex:1}}>{k}</span>
                  <span style={{color:C.text,fontSize:13,fontWeight:600}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{background:`${C.purple}18`,border:`1px solid ${C.purple}44`,borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:13,color:C.muted}}>
              ⚡ <span style={{color:C.purple,fontWeight:600}}>Gathering grants +50 XP</span> and extends your streak when confirmed.
            </div>
            <button onClick={confirmBooking} style={{width:"100%",padding:"15px",borderRadius:14,border:"none",background:`linear-gradient(135deg,${C.purpleDark},${C.purple})`,color:"#fff",fontFamily:"'Fredoka One'",fontSize:19,cursor:"pointer",boxShadow:`0 8px 32px ${C.purpleGlow}`,marginBottom:8}}>
              🏰 Seal the Gathering
            </button>
            <button onClick={()=>setStep(2)} style={{width:"100%",padding:"11px",borderRadius:12,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,cursor:"pointer",fontSize:14}}>← Change Time</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg}}>
      <UserHeader user={user} setScreen={setScreen} nav={NAV}/>
      <BottomNav screen={screen} setScreen={setScreen} />
      <div style={{maxWidth:600,margin:"0 auto",padding:24,paddingBottom:90}}>
        <div className="fade-up" style={{marginBottom:20}}>
          <h1 style={{fontFamily:"'Fredoka One'",fontSize:30,color:C.text}}>🏰 Guild Meetups</h1>
          <p style={{color:C.muted,fontSize:14}}>Find allies near you in Dallas, TX · Train together in the realm</p>
        </div>
        <div className="fade-up-1" style={{display:"flex",gap:4,background:C.surface,borderRadius:12,padding:4,marginBottom:20}}>
          {[["discover","🔍 Seek Allies"],["confirmed","🏰 My Gatherings"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              style={{flex:1,padding:"9px",borderRadius:9,border:"none",background:tab===id?C.purple:"transparent",color:tab===id?"#fff":C.muted,cursor:"pointer",fontFamily:"'Fredoka One'",fontSize:14,transition:"all 0.2s"}}>
              {label}{id==="confirmed"&&meetups.length>0&&<span style={{marginLeft:5,background:"rgba(255,255,255,0.25)",borderRadius:99,padding:"1px 7px",fontSize:11}}>{meetups.length}</span>}
            </button>
          ))}
        </div>

        {tab==="discover" && (<>
          <div className="fade-up-2" style={{marginBottom:18}}>
            <p style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Filter by discipline</p>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <button onClick={()=>setFilterInterest(null)} style={{padding:"5px 12px",borderRadius:20,border:`2px solid ${filterInterest===null?C.purple:C.border}`,background:filterInterest===null?`${C.purple}22`:"transparent",color:filterInterest===null?C.purple:C.muted,cursor:"pointer",fontSize:12,fontWeight:600,transition:"all 0.2s"}}>All</button>
              {myInt.map(i=>(
                <button key={i} onClick={()=>setFilterInterest(filterInterest===i?null:i)} style={{padding:"5px 12px",borderRadius:20,border:`2px solid ${filterInterest===i?SC[user.skill]:C.border}`,background:filterInterest===i?`${SC[user.skill]}22`:"transparent",color:filterInterest===i?SC[user.skill]:C.muted,cursor:"pointer",fontSize:12,fontWeight:600,transition:"all 0.2s"}}>{i}</button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {nearby.length===0 && <div style={{textAlign:"center",padding:40,color:C.muted}}>No learners nearby with that interest.</div>}
            {nearby.map((u,i) => {
              const already = sent.includes(u.id);
              return (
                <div key={u.id} className={`fade-up-${Math.min(i+1,5)}`}
                  style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:16,transition:"all 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=SC[user.skill]+"88"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                  <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:10}}>
                    <div style={{position:"relative"}}>
                      <Avatar name={u.username} skill={u.skill} size={46}/>
                      <div style={{position:"absolute",bottom:-2,right:-2,width:12,height:12,borderRadius:"50%",background:C.green,border:`2px solid ${C.card}`}}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:2}}>
                        <span style={{fontWeight:700,fontSize:15,color:C.text}}>{u.username}</span>
                        <span style={{background:`${SC[user.skill]}22`,color:SC[user.skill],border:`1px solid ${SC[user.skill]}44`,borderRadius:99,padding:"1px 7px",fontSize:11,fontWeight:600}}>Lvl {u.level}</span>
                      </div>
                      <div style={{fontSize:12,color:C.muted,marginBottom:4}}>📍 {u.neighborhood} · <span style={{color:C.green,fontWeight:600}}>{u.distance} away</span></div>
                      <p style={{fontSize:13,color:C.muted,lineHeight:1.4}}>{u.bio}</p>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,flexShrink:0}}>
                      <span style={{fontSize:11,color:C.muted}}>🔥</span>
                      <span style={{fontFamily:"'Fredoka One'",fontSize:15,color:C.text}}>{u.streak}</span>
                    </div>
                  </div>
                  <div style={{marginBottom:12}}>
                    <span style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>Shared interests</span>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:5}}>
                      {u.shared.map(int=><span key={int} style={{fontSize:12,background:`${SC[user.skill]}22`,border:`1px solid ${SC[user.skill]}44`,color:SC[user.skill],borderRadius:20,padding:"3px 10px",fontWeight:600}}>{int}</span>)}
                      {u.interests.filter(x=>!u.shared.includes(x)).map(int=><span key={int} style={{fontSize:12,background:C.surface,border:`1px solid ${C.border}`,color:C.dim,borderRadius:20,padding:"3px 10px"}}>{int}</span>)}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>!already&&startBooking(u)} style={{flex:1,padding:"10px",borderRadius:10,border:"none",background:already?C.dim:`linear-gradient(135deg,${C.purpleDark},${C.purple})`,color:"#fff",cursor:already?"not-allowed":"pointer",fontFamily:"'Fredoka One'",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                      {already ? "✓ Summons Sent" : "🏰 Arrange Gathering"}
                    </button>
                    <button onClick={()=>setScreen("buddy")} style={{padding:"10px 14px",borderRadius:10,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,cursor:"pointer",fontSize:13,transition:"all 0.2s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.purple;e.currentTarget.style.color=C.purple;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
                      ⚔️ Duel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>)}

        {tab==="confirmed" && (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {meetups.length===0 && (
              <div style={{textAlign:"center",padding:40}}>
                <div style={{fontSize:40,marginBottom:12}}>📭</div>
                <p style={{color:C.muted}}>No gatherings yet. <button onClick={()=>setTab("discover")} style={{color:C.purple,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Seek an ally nearby!</button></p>
              </div>
            )}
            {meetups.map((m,i)=>(
              <div key={m.id} className={`fade-up-${Math.min(i+1,5)}`} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:16}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                  <div style={{fontSize:28}}>{m.venue?.emoji||"📍"}</div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Fredoka One'",fontSize:16,color:C.text}}>{m.venue?.name}</div>
                    <div style={{fontSize:12,color:C.muted}}>{m.venue?.address}</div>
                  </div>
                  <div style={{background:`${C.green}22`,border:`1px solid ${C.green}44`,borderRadius:99,padding:"3px 10px",fontSize:11,color:C.green,fontWeight:700,flexShrink:0}}>SWORN</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                  {[["👤 With",m.with],["🎯 Topic",m.interest],["📅 Date",m.day],["⏰ Time",m.time]].map(([k,v])=>(
                    <div key={k} style={{background:C.surface,borderRadius:10,padding:"8px 12px"}}>
                      <div style={{fontSize:11,color:C.muted,marginBottom:2}}>{k}</div>
                      <div style={{fontSize:13,fontWeight:600,color:C.text}}>{v||"—"}</div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:12,color:C.muted,background:`${C.purple}11`,borderRadius:8,padding:"8px 12px"}}>
                  ⚡ Complete this gathering to earn <span style={{color:C.purple,fontWeight:600}}>+50 XP</span> and fuel your flame
                </div>
              </div>
            ))}
            <button onClick={()=>setTab("discover")} style={{padding:"13px",borderRadius:12,border:`2px solid ${C.border}`,background:"transparent",color:C.muted,cursor:"pointer",fontFamily:"'Fredoka One'",fontSize:15,transition:"all 0.2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.purple;e.currentTarget.style.color=C.purple;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
              + Seek More Allies
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BRAIN AVATAR COMPONENT ──────────────────────────────────────────────────
function BrainAvatar({ trackColor, size=120, user }) {
  const colors = { music:"#A855F7", crypto:"#22C55E", coding:"#06B6D4" };
  const baseColor = colors[trackColor] || trackColor || C.purple;
  const isLegendaryEffect = user?.avatar?.equipped_effect;
  const isRareAura = user?.avatar?.equipped_aura;
  return (
    <div className={isLegendaryEffect ? "glow-anim" : ""} style={{ position:"relative", width:size, height:size, display:"flex", alignItems:"center", justifyContent:"center" }}>
      {isRareAura && <div style={{ position:"absolute", inset:-size*0.2, borderRadius:"50%", background:`radial-gradient(circle, ${C.gold}44 0%, transparent 60%)`, animation:"orbPulse 3s infinite" }} />}
      <div style={{ width:size*0.8, height:size*0.7, borderRadius:"45% 45% 40% 40%", background:`linear-gradient(135deg, ${baseColor} 0%, ${C.bg} 100%)`, position:"relative", overflow:"hidden", border:`2px solid ${baseColor}88`, boxShadow:`inset 0 -${size*0.1}px 0 rgba(0,0,0,0.3)` }}>
        <div style={{ position:"absolute", top:"20%", left:"10%", width:"80%", height:"2px", background:"rgba(0,0,0,0.3)", borderRadius:"50%", transform:"rotate(5deg)" }} />
        <div style={{ position:"absolute", top:"50%", left:"15%", width:"70%", height:"2px", background:"rgba(0,0,0,0.3)", borderRadius:"50%", transform:"rotate(-5deg)" }} />
      </div>
      <div style={{ position:"absolute", top:"40%", display:"flex", gap:size*0.1 }}>
        <div style={{ width:size*0.1, height:size*0.15, background:"#000", borderRadius:"50%" }} />
        <div style={{ width:size*0.1, height:size*0.15, background:"#000", borderRadius:"50%" }} />
      </div>
      {user?.avatar?.equipped_hat && <div style={{ position:"absolute", top:-(size*0.1), fontSize:size*0.4 }}>🎩</div>}
      {user?.avatar?.equipped_accessory && <div style={{ position:"absolute", top:size*0.3, right:0, fontSize:size*0.3 }}>✨</div>}
    </div>
  );
}

// ─── SCREEN: INVENTORY ────────────────────────────────────────────────────────
function InventoryScreen({ user, setScreen, screen }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/inventory/${user.id}`, "GET")
      .then(data => setInventory(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  async function openCrate(tier) {
    try {
      const result = await apiFetch("/open-crate", "POST", { user_id: user.id, tier });
      alert(`You unboxed a ${result.rarity} ${result.item?.name || "item"}!`);
      apiFetch(`/inventory/${user.id}`, "GET").then(setInventory);
    } catch(e) { alert("Not enough keys!"); }
  }

  async function equip(itemId) {
    try {
      await apiFetch("/equip-item", "POST", { user_id: user.id, item_id: itemId });
      apiFetch(`/inventory/${user.id}`, "GET").then(setInventory);
    } catch(e) {}
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <UserHeader user={user} setScreen={setScreen} nav={[{id:"home",label:"← Home"},{id:"mission",label:"Quests"}]} />
      <BottomNav screen={screen} setScreen={setScreen} />
      <div style={{ maxWidth:600, margin:"0 auto", padding:20, paddingBottom:90 }}>
        <h1 className="fade-up" style={{ color:C.text, fontFamily:"'Fredoka One'", fontSize:28, marginBottom:20 }}>🎒 Vault of Relics</h1>
        <div style={{ display:"flex", gap:10, marginBottom:28 }}>
          <button onClick={()=>openCrate("bronze")} style={{ flex:1, padding:12, background:"#E8833A22", border:`1px solid #E8833A`, color:"#E8833A", borderRadius:12, cursor:"pointer", fontFamily:"'Fredoka One'", fontSize:14 }}>
            🗝️ Bronze ({user.bronze_keys||0})
          </button>
          <button onClick={()=>openCrate("silver")} style={{ flex:1, padding:12, background:"#C8B8FF22", border:`1px solid #C8B8FF`, color:"#C8B8FF", borderRadius:12, cursor:"pointer", fontFamily:"'Fredoka One'", fontSize:14 }}>
            🔑 Silver ({user.silver_keys||0})
          </button>
          <button onClick={()=>openCrate("gold")} style={{ flex:1, padding:12, background:"#FFB83022", border:`1px solid #FFB830`, color:"#FFB830", borderRadius:12, cursor:"pointer", fontFamily:"'Fredoka One'", fontSize:14 }}>
            ✨ Gold ({user.gold_keys||0})
          </button>
        </div>
        {loading ? <Spinner /> : (
          inventory.length === 0
            ? <div style={{ textAlign:"center", padding:40, color:C.muted }}>Your vault is empty. Complete quests to earn keys!</div>
            : <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {inventory.map(item => (
                  <div key={item.item_id} onClick={() => equip(item.item_id)}
                    style={{ background:C.card, border:`2px solid ${item.equipped ? C.green : C.border}`, padding:16, borderRadius:12, cursor:"pointer", transition:"all 0.2s" }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=item.equipped?C.green:C.purple}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=item.equipped?C.green:C.border}>
                    <div style={{ color:C.text, fontWeight:700, marginBottom:4 }}>{item.item_name}</div>
                    <div style={{ color:C.muted, fontSize:12, textTransform:"capitalize" }}>{item.item_rarity} · {item.item_type}</div>
                    {item.equipped && <div style={{ color:C.green, fontSize:11, fontWeight:700, marginTop:6 }}>✓ EQUIPPED</div>}
                  </div>
                ))}
              </div>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN: MESSAGES (Sage AI Trainer) ──────────────────────────────────────
function MessagesScreen({ user, setScreen, screen }) {
  const [history, setHistory] = useState([
    { content: `Greetings, ${user.username}. I am Sage, your arcane trainer. How may I guide your ${user.skillName || user.skill} journey today?`, is_ai: true }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [history]);

  async function sendMsg() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);
    const updated = [...history, { content: trimmed, is_ai: false }];
    setHistory(updated);
    setInput("");
    try {
      const res = await apiFetch("/ai-trainer/message", "POST", {
        user_id: user.id,
        message: trimmed,
        conversation_history: history.map(m => ({ role: m.is_ai ? "assistant" : "user", content: m.content }))
      });
      setHistory(prev => [...prev, { content: res.reply, is_ai: true }]);
    } catch(e) {
      setHistory(prev => [...prev, { content: "The Oracle is unreachable. Try again shortly.", is_ai: true }]);
    } finally { setSending(false); }
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <UserHeader user={user} setScreen={setScreen} nav={[]} />
      <BottomNav screen={screen} setScreen={setScreen} />
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"10px 20px", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:"50%", background:`linear-gradient(135deg,${C.gold}88,${C.gold})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🧙</div>
        <div>
          <div style={{ fontFamily:"'Fredoka One'", fontSize:16, color:C.gold }}>Sage</div>
          <div style={{ fontSize:11, color:C.muted }}>Your AI Trainer · Always watching</div>
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:20, display:"flex", flexDirection:"column", gap:12 }}>
        {history.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.is_ai ? "flex-start" : "flex-end",
            background: m.is_ai ? C.card : `linear-gradient(135deg,${C.purpleDark},${C.purple})`,
            color: C.text, padding:"12px 16px", borderRadius: m.is_ai ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
            maxWidth:"80%", fontSize:14, lineHeight:1.5,
            border: m.is_ai ? `1px solid ${C.border}` : "none",
          }}>
            {m.content}
          </div>
        ))}
        {sending && (
          <div style={{ alignSelf:"flex-start", background:C.card, border:`1px solid ${C.border}`, padding:"12px 16px", borderRadius:"4px 16px 16px 16px", color:C.muted, fontSize:14 }}>
            The Oracle communes...
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding:16, borderTop:`1px solid ${C.border}`, display:"flex", gap:10, background:C.surface }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMsg()}
          placeholder="Ask Sage anything..."
          style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, color:C.text, borderRadius:12, padding:"12px 16px", fontSize:14, outline:"none", fontFamily:"'DM Sans',sans-serif" }}
        />
        <button onClick={sendMsg} disabled={sending || !input.trim()} style={{ background: sending ? C.dim : `linear-gradient(135deg,${C.purpleDark},${C.purple})`, color:"#fff", border:"none", borderRadius:12, padding:"0 20px", fontFamily:"'Fredoka One'", fontSize:16, cursor: sending ? "not-allowed" : "pointer", transition:"all 0.2s" }}>
          Send
        </button>
      </div>
    </div>
  );
}

// ─── SCREEN: CAMPAIGN ─────────────────────────────────────────────────────────
function CampaignScreen({ user, setScreen, screen }) {
  const [room, setRoom] = useState("");
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);

  async function create() {
    setLoading(true);
    try {
      const res = await apiFetch("/campaign/create", "POST", { host_id: user.id, skill: user.skill, is_public: true });
      setState(res);
      setRoom(res.room_code);
    } catch(e) { alert("Failed to create dungeon."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <UserHeader user={user} setScreen={setScreen} nav={[]} />
      <BottomNav screen={screen} setScreen={setScreen} />
      <div style={{ maxWidth:520, margin:"0 auto", padding:24, paddingBottom:90, textAlign:"center" }}>
        <div style={{ fontSize:64, marginBottom:16, animation:"float 2s ease-in-out infinite" }}>🐲</div>
        <h1 style={{ color:C.text, fontFamily:"'Fredoka One'", fontSize:32, marginBottom:8 }}>Dungeon Raids</h1>
        <p style={{ color:C.muted, fontSize:14, marginBottom:32 }}>Battle monsters with 2-4 players. Answer correctly to deal damage.</p>
        {!state ? (
          <div>
            <button onClick={create} disabled={loading} style={{ background: loading ? C.dim : `linear-gradient(135deg,${C.red}CC,${C.red})`, color:"#fff", border:"none", padding:"16px", borderRadius:14, fontSize:18, fontFamily:"'Fredoka One'", width:"100%", marginBottom:16, cursor: loading ? "not-allowed" : "pointer", boxShadow:`0 8px 32px ${C.red}44` }}>
              {loading ? "Summoning dungeon..." : "⚔️ Create Dungeon"}
            </button>
            <div style={{ display:"flex", gap:10 }}>
              <input value={room} onChange={e=>setRoom(e.target.value)} placeholder="Enter room code..."
                style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, padding:14, borderRadius:12, color:C.text, fontSize:16, outline:"none" }}/>
              <button style={{ background:`linear-gradient(135deg,${C.purpleDark},${C.purple})`, color:"#fff", border:"none", padding:"14px 20px", borderRadius:12, cursor:"pointer", fontFamily:"'Fredoka One'", fontSize:16 }}>
                Join
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background:C.card, border:`2px solid ${C.purple}`, borderRadius:20, padding:32 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:2, marginBottom:12 }}>Room Code</div>
            <div style={{ fontFamily:"'Fredoka One'", fontSize:56, color:C.purple, letterSpacing:8, marginBottom:16 }}>{room}</div>
            <p style={{ color:C.muted, fontSize:14 }}>Share this code with your party. Waiting for adventurers...</p>
            <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:20 }}>
              {[1,2,3,4].map(n => (
                <div key={n} style={{ width:40, height:40, borderRadius:"50%", background: n===1 ? C.purple : C.border, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
                  {n===1 ? "👤" : "•"}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN: PROFILE ──────────────────────────────────────────────────────────
function ProfileScreen({ user, setScreen, screen }) {
  const skill = SKILLS.find(s => s.id === user.skill);
  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <UserHeader user={user} setScreen={setScreen} nav={[]} />
      <BottomNav screen={screen} setScreen={setScreen} />
      <div style={{ maxWidth:480, margin:"0 auto", padding:24, paddingBottom:90, textAlign:"center" }}>
        <div className="fade-up" style={{ marginBottom:20 }}>
          <BrainAvatar trackColor={user.skill} size={140} user={user} />
        </div>
        <h1 className="fade-up-1" style={{ color:C.text, fontFamily:"'Fredoka One'", fontSize:32, marginBottom:4 }}>{user.username}</h1>
        <div className="fade-up-2" style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:24 }}>
          <Badge text={`${skill?.name || user.skill}`} color={skill?.color || C.purple} />
          <Badge text={`Level ${user.level} · ${LEVEL_LABELS[user.level] || "Archmage"}`} color={C.purple} />
        </div>
        <div className="fade-up-3" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:24 }}>
          {[["🔥","Streak",`${user.streak} days`],["⚡","XP",user.xp],["🗝️","Keys",`${user.bronze_keys||0}/${user.silver_keys||0}/${user.gold_keys||0}`]].map(([emoji,label,val])=>(
            <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:14 }}>
              <div style={{ fontSize:24, marginBottom:4 }}>{emoji}</div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:2 }}>{label}</div>
              <div style={{ fontFamily:"'Fredoka One'", fontSize:18, color:C.text }}>{val}</div>
            </div>
          ))}
        </div>
        <div className="fade-up-4" style={{ display:"flex", gap:10 }}>
          <button onClick={()=>setScreen("inventory")} style={{ flex:1, padding:"13px", borderRadius:12, border:`2px solid ${C.border}`, background:"transparent", color:C.text, cursor:"pointer", fontFamily:"'Fredoka One'", fontSize:15, transition:"all 0.2s" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.purple;e.currentTarget.style.color=C.purple;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text;}}>
            🎒 Vault
          </button>
          <button onClick={()=>setScreen("messages")} style={{ flex:1, padding:"13px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.purpleDark},${C.purple})`, color:"#fff", cursor:"pointer", fontFamily:"'Fredoka One'", fontSize:15 }}>
            🧙 Ask Sage
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: MAP ──────────────────────────────────────────────────────────────
function MapScreen({ user, setScreen, screen }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  });
  const [enabled, setEnabled] = useState(false);
  const center = { lat: 32.7767, lng: -96.7970 };

  async function toggleLocation(val) {
    setEnabled(val);
    if (val) {
      try {
        await apiFetch("/location/update", "POST", { user_id: user.id, location_enabled: val, latitude: center.lat, longitude: center.lng });
      } catch(e) {}
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <UserHeader user={user} setScreen={setScreen} nav={[]} />
      <BottomNav screen={screen} setScreen={setScreen} />
      <div style={{ padding:"12px 20px", background:C.surface, borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontFamily:"'Fredoka One'", fontSize:16, color:C.text }}>📍 Location Sharing</div>
          <div style={{ fontSize:12, color:C.muted }}>Neighborhood precision only — never exact</div>
        </div>
        <div onClick={() => toggleLocation(!enabled)} style={{ width:44, height:24, borderRadius:12, background: enabled ? C.purple : C.border, cursor:"pointer", position:"relative", transition:"all 0.3s" }}>
          <div style={{ width:20, height:20, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left: enabled ? 22 : 2, transition:"all 0.3s" }} />
        </div>
      </div>
      {enabled && isLoaded ? (
        <div style={{ flex:1, minHeight:400 }}>
          <GoogleMap mapContainerStyle={{ width:"100%", height:"100%" }} center={center} zoom={13}
            options={{ styles:[{elementType:"geometry",stylers:[{color:"#08060F"}]},{elementType:"labels.text.fill",stylers:[{color:"#9D6FFF"}]},{featureType:"road",elementType:"geometry",stylers:[{color:"#2D1F5E"}]},{featureType:"water",elementType:"geometry",stylers:[{color:"#100D1E"}]}] }}>
            <Marker position={center} label={{ text:"You", color:"#fff", fontWeight:"bold" }} />
          </GoogleMap>
        </div>
      ) : (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:40, textAlign:"center" }}>
          <div style={{ fontSize:64, marginBottom:16 }}>🗺️</div>
          <h2 style={{ fontFamily:"'Fredoka One'", fontSize:24, color:C.text, marginBottom:8 }}>Arcane Map</h2>
          <p style={{ color:C.muted, fontSize:14, marginBottom:24 }}>Enable location sharing to discover nearby allies and venues in your neighborhood.</p>
          <button onClick={()=>toggleLocation(true)} style={{ background:`linear-gradient(135deg,${C.purpleDark},${C.purple})`, color:"#fff", border:"none", padding:"14px 32px", borderRadius:12, fontFamily:"'Fredoka One'", fontSize:16, cursor:"pointer" }}>
            Enable Location
          </button>
        </div>
      )}
    </div>
  );
}

// ─── ROOT APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [user, setUser] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  function handleOnboard(u) { setUser(u); setScreen("path"); }

  if (screen === "home" || !user) return <OnboardingScreen onComplete={handleOnboard} />;
  if (screen === "path")         return <LearningPathScreen user={user} setUser={setUser} setScreen={setScreen} screen={screen} />;
  if (screen === "mission")      return <MissionScreen user={user} setUser={setUser} setScreen={setScreen} setLastResult={setLastResult} screen={screen} />;
  if (screen === "results")      return <ResultsScreen user={user} lastResult={lastResult} setScreen={setScreen} screen={screen} />;
  if (screen === "buddy")        return <BuddyScreen user={user} setUser={setUser} setLastResult={setLastResult} setScreen={setScreen} screen={screen} />;
  if (screen === "leaderboard")  return <LeaderboardScreen user={user} setScreen={setScreen} screen={screen} />;
  if (screen === "meetup")       return <MeetupScreen user={user} setScreen={setScreen} screen={screen} />;
  if (screen === "inventory")    return <InventoryScreen user={user} setScreen={setScreen} screen={screen} />;
  if (screen === "messages")     return <MessagesScreen user={user} setScreen={setScreen} screen={screen} />;
  if (screen === "campaign")     return <CampaignScreen user={user} setScreen={setScreen} screen={screen} />;
  if (screen === "profile")      return <ProfileScreen user={user} setScreen={setScreen} screen={screen} />;
  if (screen === "map")          return <MapScreen user={user} setScreen={setScreen} screen={screen} />;
  return null;
}

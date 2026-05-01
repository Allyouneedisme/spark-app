"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function Planner() {
  // ── State ──────────────────────────────────────────────
  const [goal,        setGoal]        = useState("")
  const [days,        setDays]        = useState(30)
  const [examDate,    setExamDate]    = useState("")
  const [skills,      setSkills]      = useState("")
  const [loading,     setLoading]     = useState(false)
  const [tasks,       setTasks]       = useState<any[]>([])
  const [error,       setError]       = useState("")
  const [saved,       setSaved]       = useState(false)
  const [streak,      setStreak]      = useState(0)
  const [daysLeft,    setDaysLeft]    = useState<number|null>(null)
  const [completedIds,setCompletedIds]= useState<string[]>([])
  const [activeTab,   setActiveTab]   = useState("planner")
  const [weeklyStats, setWeeklyStats] = useState({
    completed: 0, total: 0, streak: 0, readiness: 0
  })

  // ── Calculate days left from exam date ─────────────────
  useEffect(() => {
    if (examDate) {
      const today = new Date()
      const exam  = new Date(examDate)
      const diff  = Math.ceil((exam.getTime() - today.getTime()) / (1000*60*60*24))
      setDaysLeft(diff)
      setDays(diff > 0 ? diff : 30)
    }
  }, [examDate])

  // ── Load streak from localStorage ──────────────────────
  useEffect(() => {
    const savedStreak = localStorage.getItem("spark_streak")
    const lastDate    = localStorage.getItem("spark_last_date")
    const today       = new Date().toDateString()
    if (lastDate === today && savedStreak) {
      setStreak(parseInt(savedStreak))
    }
    const ids = localStorage.getItem("spark_completed")
    if (ids) setCompletedIds(JSON.parse(ids))
  }, [])

  // ── Generate tasks with Groq + YouTube ─────────────────
  async function generateTasks() {
    if (!goal.trim()) return
    setLoading(true); setTasks([]); setError(""); setSaved(false)

    try {
      // Build enhanced prompt with skill gap analysis
      const skillContext = skills.trim()
        ? `The student already knows: ${skills}. Focus on filling skill gaps.`
        : ""

      const response = await fetch("/api/generate-tasks", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ goal, days, skillContext })
      })

      const data = await response.json()
      if (data.tasks) {
        setTasks(data.tasks)

        // Auto save to Supabase
        const toInsert = data.tasks.map((t: any) => ({
          title:       t.title,
          description: t.description || "",
          status:      "todo",
          deadline:    t.deadline,
        }))
        await supabase.from("tasks").insert(toInsert)
        setSaved(true)

        // Update weekly stats
        setWeeklyStats(prev => ({
          ...prev,
          total: prev.total + data.tasks.length,
          readiness: Math.min(100, prev.readiness + 10)
        }))
      } else {
        setError("Could not generate tasks. Try again!")
      }
    } catch(e) {
      setError("Something went wrong. Check internet!")
    }
    setLoading(false)
  }

  // ── Mark task complete (streak tracker) ────────────────
  function markComplete(taskId: string) {
    const newIds = [...completedIds, taskId]
    setCompletedIds(newIds)
    localStorage.setItem("spark_completed", JSON.stringify(newIds))

    // Update streak
    const today   = new Date().toDateString()
    const lastDate= localStorage.getItem("spark_last_date")
    let newStreak = streak
    if (lastDate !== today) {
      newStreak = streak + 1
      setStreak(newStreak)
      localStorage.setItem("spark_streak",    String(newStreak))
      localStorage.setItem("spark_last_date", today)
    }

    setWeeklyStats(prev => ({
      ...prev,
      completed: prev.completed + 1,
      readiness: Math.min(100, prev.readiness + 5)
    }))
  }

  const completionPercent = tasks.length > 0
    ? Math.round((completedIds.filter(id => tasks.find((_,i) => String(i) === id)).length / tasks.length) * 100)
    : 0

  // ── RENDER ─────────────────────────────────────────────
  return (
    <main style={{minHeight:"100vh",background:"#07070f",
      color:"white",fontFamily:"sans-serif"}}>

      {/* Navbar */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"12px 28px",background:"rgba(7,7,15,0.9)",
        borderBottom:"1px solid rgba(167,139,250,0.1)"}}>
        <a href="/" style={{display:"flex",alignItems:"center",textDecoration:"none"}}>
          <span style={{fontSize:28,fontWeight:900,fontStyle:"italic",
            color:"white",fontFamily:"Arial Black,sans-serif"}}>SPAR</span>
          <svg width="22" height="28" viewBox="0 0 60 90">
            <polygon points="48,0 24,48 40,48 14,90 62,36 42,36 62,0" fill="#FFD700"/>
          </svg>
        </a>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {/* Streak badge */}
          <div style={{display:"flex",alignItems:"center",gap:6,
            padding:"6px 14px",borderRadius:99,
            background:"rgba(255,165,0,0.15)",
            border:"1px solid rgba(255,165,0,0.3)",
            color:"#ffa500",fontSize:12,fontWeight:700}}>
            🔥 {streak} Day Streak
          </div>
          <a href="/dashboard" style={{background:"rgba(255,255,255,0.05)",
            color:"#c4b5fd",border:"1px solid rgba(167,139,250,0.2)",
            borderRadius:10,padding:"8px 16px",fontSize:13,textDecoration:"none"}}>
            ← Dashboard
          </a>
        </div>
      </nav>

      <div style={{maxWidth:900,margin:"0 auto",padding:"90px 22px 60px"}}>

        {/* Tabs */}
        <div style={{display:"flex",gap:8,marginBottom:28}}>
          {[
            {id:"planner",  label:"🤖 AI Planner"},
            {id:"analytics",label:"📊 Analytics"},
          ].map(tab=>(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
              style={{padding:"9px 20px",borderRadius:10,fontSize:13,
                fontWeight:600,cursor:"pointer",border:"none",
                fontFamily:"sans-serif",
                background:activeTab===tab.id
                  ?"linear-gradient(135deg,#7c3aed,#5b21b6)"
                  :"rgba(255,255,255,0.06)",
                color:activeTab===tab.id?"white":"#9ca3af"}}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── PLANNER TAB ── */}
        {activeTab==="planner" && (
          <>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,
              padding:"4px 14px",borderRadius:99,
              background:"rgba(255,215,0,0.09)",
              border:"1px solid rgba(255,215,0,0.22)",
              color:"#ffd700",fontSize:11,fontWeight:700,marginBottom:14}}>
              ⚡ Groq AI + YouTube Resources — Works for ANY topic
            </div>

            <h1 style={{fontSize:26,fontWeight:800,marginBottom:6}}>
              🤖 AI Student Planner
            </h1>
            <p style={{fontSize:13,color:"#6b6880",marginBottom:20}}>
              Type ANY goal → AI creates tasks + finds YouTube tutorials automatically!
            </p>

            {/* Exam Countdown */}
            {daysLeft !== null && (
              <div style={{padding:"14px 20px",borderRadius:14,marginBottom:20,
                background: daysLeft < 7
                  ? "rgba(220,38,38,0.15)"
                  : daysLeft < 14
                  ? "rgba(245,158,11,0.15)"
                  : "rgba(16,185,129,0.15)",
                border: daysLeft < 7
                  ? "1px solid rgba(220,38,38,0.3)"
                  : daysLeft < 14
                  ? "1px solid rgba(245,158,11,0.3)"
                  : "1px solid rgba(16,185,129,0.3)",
                display:"flex",alignItems:"center",gap:14}}>
                <span style={{fontSize:28}}>
                  {daysLeft < 7 ? "🚨" : daysLeft < 14 ? "⚠️" : "📅"}
                </span>
                <div>
                  <div style={{fontSize:16,fontWeight:700,
                    color: daysLeft < 7 ? "#f87171" : daysLeft < 14 ? "#fbbf24" : "#34d399"}}>
                    {daysLeft > 0
                      ? `${daysLeft} Days Until Your Exam!`
                      : "Exam is today! 💪"}
                  </div>
                  <div style={{fontSize:12,color:"#9ca3af",marginTop:2}}>
                    {daysLeft > 0
                      ? `You need to complete ~${Math.ceil(8/daysLeft*7)} tasks per week to stay on track`
                      : "You got this!"}
                  </div>
                </div>
              </div>
            )}

            {/* Input Form */}
            <div style={{padding:26,borderRadius:20,
              background:"rgba(255,255,255,0.038)",
              border:"1px solid rgba(167,139,250,0.13)",
              marginBottom:20}}>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",
                gap:16,marginBottom:16}}>

                {/* Goal input */}
                <div style={{gridColumn:"1 / -1"}}>
                  <label style={{display:"block",fontSize:11,fontWeight:700,
                    color:"#9ca3af",letterSpacing:"0.7px",marginBottom:8}}>
                    WHAT DO YOU WANT TO ACHIEVE?
                  </label>
                  <textarea value={goal} onChange={e=>setGoal(e.target.value)}
                    placeholder={"Examples:\n• 30 days GATE exam preparation\n• Cloud Computing roadmap\n• Learn Machine Learning from scratch"}
                    style={{width:"100%",minHeight:90,
                      background:"rgba(255,255,255,0.052)",
                      border:"1px solid rgba(167,139,250,0.16)",
                      borderRadius:14,padding:14,color:"white",
                      fontFamily:"sans-serif",fontSize:14,resize:"none",
                      outline:"none",boxSizing:"border-box"}}/>
                </div>

                {/* Skills input */}
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:700,
                    color:"#9ca3af",letterSpacing:"0.7px",marginBottom:8}}>
                    YOUR CURRENT SKILLS (optional)
                  </label>
                  <input type="text" value={skills}
                    onChange={e=>setSkills(e.target.value)}
                    placeholder="e.g. Python, basic DSA, OOP"
                    style={{width:"100%",background:"rgba(255,255,255,0.052)",
                      border:"1px solid rgba(167,139,250,0.16)",
                      borderRadius:12,padding:"11px 14px",color:"white",
                      fontFamily:"sans-serif",fontSize:14,outline:"none",
                      boxSizing:"border-box"}}/>
                </div>

                {/* Exam date */}
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:700,
                    color:"#9ca3af",letterSpacing:"0.7px",marginBottom:8}}>
                    EXAM DATE (optional)
                  </label>
                  <input type="date" value={examDate}
                    onChange={e=>setExamDate(e.target.value)}
                    style={{width:"100%",background:"rgba(255,255,255,0.052)",
                      border:"1px solid rgba(167,139,250,0.16)",
                      borderRadius:12,padding:"11px 14px",color:"white",
                      fontFamily:"sans-serif",fontSize:14,outline:"none",
                      boxSizing:"border-box"}}/>
                </div>

                {/* Days */}
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:700,
                    color:"#9ca3af",letterSpacing:"0.7px",marginBottom:8}}>
                    DAYS AVAILABLE
                  </label>
                  <input type="number" value={days}
                    onChange={e=>setDays(Number(e.target.value))}
                    style={{width:"100%",background:"rgba(255,255,255,0.052)",
                      border:"1px solid rgba(167,139,250,0.16)",
                      borderRadius:12,padding:"11px 14px",color:"white",
                      fontFamily:"sans-serif",fontSize:14,outline:"none",
                      boxSizing:"border-box"}}/>
                </div>
              </div>

              {error && (
                <div style={{background:"rgba(220,38,38,0.15)",
                  border:"1px solid rgba(220,38,38,0.3)",borderRadius:10,
                  padding:"10px 14px",fontSize:13,color:"#f87171",
                  marginBottom:16}}>❌ {error}</div>
              )}

              <button onClick={generateTasks}
                disabled={loading||!goal.trim()}
                style={{width:"100%",padding:15,
                  background:"linear-gradient(135deg,#7c3aed,#5b21b6)",
                  color:"white",border:"none",borderRadius:12,
                  fontSize:15,fontWeight:600,cursor:"pointer",
                  opacity:(loading||!goal.trim())?0.5:1}}>
                {loading
                  ? "⏳ Groq AI is finding tasks + YouTube videos..."
                  : "⚡ Generate My Task Plan with Resources"}
              </button>
            </div>

            {/* Success banner */}
            {saved && (
              <div style={{background:"rgba(16,185,129,0.15)",
                border:"1px solid rgba(16,185,129,0.3)",borderRadius:10,
                padding:"12px 16px",fontSize:13,color:"#34d399",
                marginBottom:16,textAlign:"center"}}>
                ✅ {tasks.length} tasks saved to your Kanban board!
                <a href="/kanban" style={{color:"#34d399",marginLeft:8,
                  fontWeight:700}}>View on Board →</a>
              </div>
            )}

            {/* Task cards with YouTube links */}
            {tasks.length>0 && !loading && (
              <div>
                <div style={{display:"flex",justifyContent:"space-between",
                  alignItems:"center",marginBottom:16}}>
                  <h2 style={{fontSize:18,fontWeight:700}}>
                    ✅ {tasks.length} Tasks Generated
                  </h2>
                  <div style={{fontSize:13,color:"#6b6880"}}>
                    {completedIds.length} completed
                  </div>
                </div>

                {/* Progress bar */}
                {completedIds.length > 0 && (
                  <div style={{marginBottom:20}}>
                    <div style={{display:"flex",justifyContent:"space-between",
                      fontSize:12,color:"#9ca3af",marginBottom:6}}>
                      <span>Overall Progress</span>
                      <span>{completionPercent}%</span>
                    </div>
                    <div style={{height:6,background:"rgba(255,255,255,0.07)",
                      borderRadius:99}}>
                      <div style={{height:6,borderRadius:99,
                        background:"linear-gradient(90deg,#7c3aed,#34d399)",
                        width:completionPercent+"%",
                        transition:"width 0.5s ease"}}/>
                    </div>
                  </div>
                )}

                {tasks.map((t,i)=>{
                  const isCompleted = completedIds.includes(String(i))
                  const diffColors: any = {
                    Easy:   { bg:"rgba(16,185,129,0.15)", text:"#34d399" },
                    Medium: { bg:"rgba(245,158,11,0.15)", text:"#fbbf24" },
                    Hard:   { bg:"rgba(220,38,38,0.15)",  text:"#f87171" },
                  }
                  const dc = diffColors[t.difficulty] || diffColors.Medium

                  return (
                    <div key={i} style={{padding:"18px 20px",borderRadius:16,
                      marginBottom:14,
                      background: isCompleted
                        ? "rgba(16,185,129,0.08)"
                        : "rgba(255,255,255,0.035)",
                      border: isCompleted
                        ? "1px solid rgba(16,185,129,0.25)"
                        : "1px solid rgba(167,139,250,0.1)",
                      transition:"all 0.3s"}}>

                      {/* Task header */}
                      <div style={{display:"flex",alignItems:"flex-start",
                        gap:12,marginBottom:12}}>
                        <div style={{width:32,height:32,minWidth:32,borderRadius:10,
                          background: isCompleted
                            ? "rgba(16,185,129,0.25)"
                            : "rgba(124,58,237,0.25)",
                          color: isCompleted ? "#34d399" : "#a78bfa",
                          fontSize:13,fontWeight:800,display:"flex",
                          alignItems:"center",justifyContent:"center",
                          fontFamily:"monospace"}}>
                          {isCompleted ? "✓" : String(i+1).padStart(2,"0")}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",
                            gap:10,marginBottom:4}}>
                            <span style={{fontSize:15,fontWeight:700,
                              color: isCompleted ? "#6b6880" : "white",
                              textDecoration: isCompleted ? "line-through" : "none"}}>
                              {t.title}
                            </span>
                            {t.difficulty && (
                              <span style={{fontSize:10,fontWeight:700,
                                padding:"2px 8px",borderRadius:99,
                                background:dc.bg,color:dc.text}}>
                                {t.difficulty}
                              </span>
                            )}
                          </div>
                          <div style={{fontSize:12,color:"#6b6880",
                            lineHeight:1.5,marginBottom:6}}>
                            {t.description}
                          </div>
                          <div style={{display:"flex",gap:12,
                            alignItems:"center",flexWrap:"wrap"}}>
                            <span style={{fontSize:11,color:"#ffd700",fontWeight:600}}>
                              📅 {t.deadline}
                            </span>
                          </div>
                        </div>

                        {/* Complete button */}
                        {!isCompleted && (
                          <button onClick={()=>markComplete(String(i))}
                            style={{background:"rgba(16,185,129,0.15)",
                              border:"1px solid rgba(16,185,129,0.3)",
                              color:"#34d399",borderRadius:10,
                              padding:"6px 14px",fontSize:12,
                              cursor:"pointer",fontFamily:"sans-serif",
                              fontWeight:600,whiteSpace:"nowrap"}}>
                            ✓ Done
                          </button>
                        )}
                      </div>

                      {/* YouTube video card */}
                      {t.youtube && (
                        <a href={t.youtube.url} target="_blank"
                          rel="noopener noreferrer"
                          style={{display:"flex",alignItems:"center",gap:12,
                            padding:"10px 14px",borderRadius:12,
                            background:"rgba(255,0,0,0.08)",
                            border:"1px solid rgba(255,0,0,0.2)",
                            textDecoration:"none",marginBottom:8}}>
                          <span style={{fontSize:20}}>▶️</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:12,fontWeight:600,
                              color:"#ff6b6b",marginBottom:2,
                              overflow:"hidden",textOverflow:"ellipsis",
                              whiteSpace:"nowrap"}}>
                              {t.youtube.title}
                            </div>
                            <div style={{fontSize:11,color:"#6b6880"}}>
                              {t.youtube.channel} · YouTube Tutorial
                            </div>
                          </div>
                          <span style={{fontSize:11,color:"#ff6b6b",
                            fontWeight:700,whiteSpace:"nowrap"}}>
                            Watch →
                          </span>
                        </a>
                      )}

                      {/* Doc link */}
                      {t.doc_link && t.doc_link !== "null" && (
                        <a href={t.doc_link} target="_blank"
                          rel="noopener noreferrer"
                          style={{display:"flex",alignItems:"center",gap:10,
                            padding:"8px 14px",borderRadius:10,
                            background:"rgba(56,189,248,0.08)",
                            border:"1px solid rgba(56,189,248,0.2)",
                            textDecoration:"none"}}>
                          <span style={{fontSize:16}}>📄</span>
                          <span style={{fontSize:12,color:"#38bdf8",fontWeight:600}}>
                            Read Documentation →
                          </span>
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab==="analytics" && (
          <div>
            <h1 style={{fontSize:24,fontWeight:800,marginBottom:6}}>
              📊 Your Progress Analytics
            </h1>
            <p style={{fontSize:13,color:"#6b6880",marginBottom:24}}>
              Track your study performance and streaks
            </p>

            {/* Streak card */}
            <div style={{padding:24,borderRadius:18,marginBottom:16,
              background:"linear-gradient(135deg,rgba(255,165,0,0.15),rgba(255,100,0,0.1))",
              border:"1px solid rgba(255,165,0,0.3)",
              display:"flex",alignItems:"center",gap:20}}>
              <span style={{fontSize:52}}>🔥</span>
              <div>
                <div style={{fontSize:40,fontWeight:900,color:"#ffa500"}}>
                  {streak}
                </div>
                <div style={{fontSize:14,color:"#9ca3af"}}>Day Study Streak</div>
                <div style={{fontSize:12,color:"#6b6880",marginTop:4}}>
                  Keep going! Complete tasks daily to maintain your streak
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{display:"grid",
              gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",
              gap:14,marginBottom:24}}>
              {[
                { n:weeklyStats.completed, l:"Tasks Completed",   c:"#34d399", icon:"✅" },
                { n:weeklyStats.total,     l:"Tasks Generated",   c:"#a78bfa", icon:"🤖" },
                { n:streak,                l:"Day Streak",         c:"#ffa500", icon:"🔥" },
                { n:weeklyStats.readiness+"%",l:"Readiness Score", c:"#38bdf8", icon:"🎯" },
              ].map(m=>(
                <div key={m.l} style={{padding:20,borderRadius:16,
                  background:"rgba(255,255,255,0.035)",
                  border:"1px solid rgba(167,139,250,0.12)",
                  textAlign:"center"}}>
                  <div style={{fontSize:28,marginBottom:8}}>{m.icon}</div>
                  <div style={{fontSize:28,fontWeight:900,color:m.c}}>{m.n}</div>
                  <div style={{fontSize:12,color:"#6b6880",marginTop:3}}>{m.l}</div>
                </div>
              ))}
            </div>

            {/* Readiness bar */}
            <div style={{padding:20,borderRadius:16,
              background:"rgba(255,255,255,0.035)",
              border:"1px solid rgba(167,139,250,0.12)",marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",
                marginBottom:10}}>
                <span style={{fontSize:14,fontWeight:700}}>
                  🎯 Exam Readiness Score
                </span>
                <span style={{fontSize:14,fontWeight:700,color:"#38bdf8"}}>
                  {weeklyStats.readiness}%
                </span>
              </div>
              <div style={{height:10,background:"rgba(255,255,255,0.07)",
                borderRadius:99}}>
                <div style={{height:10,borderRadius:99,
                  background:"linear-gradient(90deg,#7c3aed,#38bdf8)",
                  width:weeklyStats.readiness+"%",
                  transition:"width 0.5s ease"}}/>
              </div>
              <div style={{fontSize:12,color:"#6b6880",marginTop:8}}>
                {weeklyStats.readiness < 30
                  ? "🔴 Just getting started — keep going!"
                  : weeklyStats.readiness < 60
                  ? "🟡 Making good progress!"
                  : weeklyStats.readiness < 80
                  ? "🟢 Almost ready for the exam!"
                  : "🏆 You are exam ready!"}
              </div>
            </div>

            {/* Tips */}
            <div style={{padding:20,borderRadius:16,
              background:"rgba(124,58,237,0.08)",
              border:"1px solid rgba(124,58,237,0.2)"}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>
                💡 Study Tips
              </div>
              {[
                "Complete at least 1 task per day to maintain your streak",
                "Watch YouTube tutorials for topics you find difficult",
                "Use the Kanban board to track your daily progress",
                "Generate new task plans as you complete previous ones",
                "Set an exam date to get a countdown and stay motivated",
              ].map((tip,i)=>(
                <div key={i} style={{display:"flex",gap:10,marginBottom:8,
                  fontSize:13,color:"#9ca3af"}}>
                  <span style={{color:"#7c3aed",fontWeight:700}}>→</span>
                  {tip}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
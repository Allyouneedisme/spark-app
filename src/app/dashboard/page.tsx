"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Dashboard() {
  const [projects, setProjects] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [loading,  setLoading]  = useState(true)
  const router = useRouter()

  useEffect(() => { loadProjects() }, [])

  async function loadProjects() {
    setLoading(true)
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })
    if (data) setProjects(data)
    setLoading(false)
  }

  async function addProject() {
    if (!newTitle.trim()) return
    const colors = ["#7c3aed","#059669","#d97706","#dc2626","#0284c7"]
    const color  = colors[Math.floor(Math.random()*colors.length)]
    const { data } = await supabase
      .from("projects")
      .insert([{ title:newTitle, color, total:0, done:0 }])
      .select()
    if (data) setProjects(prev=>[data[0],...prev])
    setNewTitle(""); setShowForm(false)
  }

  async function deleteProject(id: string) {
    await supabase.from("tasks").delete().eq("project_id", id)
    await supabase.from("projects").delete().eq("id", id)
    setProjects(prev=>prev.filter(p=>p.id!==id))
  }

  const total     = projects.reduce((a,p)=>a+(p.total||0),0)
  const completed = projects.reduce((a,p)=>a+(p.done||0), 0)

  return (
    <main style={{minHeight:"100vh",background:"#07070f",
      color:"white",fontFamily:"sans-serif"}}>

      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"12px 28px",background:"rgba(7,7,15,0.9)",
        borderBottom:"1px solid rgba(167,139,250,0.1)"}}>
        <a href="/" style={{display:"flex",alignItems:"center",
          textDecoration:"none"}}>
          <span style={{fontSize:28,fontWeight:900,fontStyle:"italic",
            color:"white",fontFamily:"Arial Black,sans-serif"}}>SPAR</span>
          <svg width="22" height="28" viewBox="0 0 60 90">
            <polygon points="48,0 24,48 40,48 14,90 62,36 42,36 62,0"
              fill="#FFD700"/>
          </svg>
        </a>
        <div style={{display:"flex",gap:10}}>
          <a href="/planner" style={{
            background:"rgba(255,255,255,0.05)",color:"#c4b5fd",
            border:"1px solid rgba(167,139,250,0.2)",
            borderRadius:10,padding:"8px 16px",
            fontSize:13,textDecoration:"none"}}>
            🤖 AI Planner
          </a>
          <button onClick={()=>setShowForm(true)} style={{
            background:"linear-gradient(135deg,#7c3aed,#5b21b6)",
            color:"white",border:"none",borderRadius:10,
            padding:"8px 16px",fontSize:13,cursor:"pointer"}}>
            + New Project
          </button>
        </div>
      </nav>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"90px 22px 60px"}}>
        <h1 style={{fontSize:26,fontWeight:800,marginBottom:4}}>
          Good evening, Developer 👋
        </h1>
        <p style={{fontSize:13,color:"#6b6880",marginBottom:28}}>
          Your projects — saved permanently ✅
        </p>

        <div style={{display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",
          gap:13,marginBottom:28}}>
          {[
            {n:projects.length, l:"Active Projects", c:"#a78bfa"},
            {n:total,           l:"Total Tasks",     c:"#38bdf8"},
            {n:completed,       l:"Completed",       c:"#34d399"},
            {n:total-completed, l:"Remaining",       c:"#fbbf24"},
          ].map(m=>(
            <div key={m.l} style={{padding:20,borderRadius:16,
              background:"rgba(255,255,255,0.035)",
              border:"1px solid rgba(167,139,250,0.12)"}}>
              <div style={{fontSize:32,fontWeight:900,color:m.c}}>{m.n}</div>
              <div style={{fontSize:12,color:"#6b6880",marginTop:3}}>{m.l}</div>
            </div>
          ))}
        </div>

        {showForm && (
          <div style={{display:"flex",gap:10,alignItems:"center",
            padding:"16px 18px",marginBottom:16,
            background:"rgba(255,255,255,0.035)",
            border:"1px solid rgba(167,139,250,0.12)",borderRadius:14}}>
            <input value={newTitle}
              onChange={e=>setNewTitle(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&addProject()}
              placeholder="Project name e.g. Final Year Project"
              autoFocus
              style={{flex:1,background:"rgba(255,255,255,0.055)",
                border:"1px solid rgba(167,139,250,0.16)",
                borderRadius:10,padding:"9px 14px",color:"white",
                fontFamily:"sans-serif",fontSize:14,outline:"none"}}/>
            <button onClick={addProject} style={{
              background:"linear-gradient(135deg,#7c3aed,#5b21b6)",
              color:"white",border:"none",borderRadius:10,
              padding:"9px 18px",fontSize:13,cursor:"pointer"}}>
              Create
            </button>
            <button onClick={()=>setShowForm(false)} style={{
              background:"rgba(255,255,255,0.06)",color:"#9ca3af",
              border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:10,padding:"9px 14px",fontSize:13,
              cursor:"pointer",fontFamily:"sans-serif"}}>
              Cancel
            </button>
          </div>
        )}

        <h2 style={{fontSize:16,fontWeight:700,marginBottom:14}}>
          Your Projects
        </h2>

        {loading ? (
          <div style={{textAlign:"center",color:"#6b6880",padding:40}}>
            Loading projects...
          </div>
        ):(
          <div style={{display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",
            gap:14}}>
            {projects.length===0 && (
              <div style={{color:"#6b6880",fontSize:14,padding:20}}>
                No projects yet. Click + New Project to create one!
              </div>
            )}
            {projects.map(p=>{
              const pct = p.total>0?Math.round(p.done/p.total*100):0
              return (
                <div key={p.id} style={{padding:20,borderRadius:16,
                  background:"rgba(255,255,255,0.035)",
                  border:"1px solid rgba(167,139,250,0.1)",
                  position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,
                    right:0,height:3,background:p.color}}/>
                  <div style={{display:"flex",justifyContent:"space-between",
                    alignItems:"flex-start",marginBottom:14}}>
                    <div style={{fontSize:14,fontWeight:700,cursor:"pointer"}}
                      onClick={()=>router.push(`/kanban?project=${p.id}`)}>
                      {p.title}
                    </div>
                    <button onClick={()=>deleteProject(p.id)} style={{
                      background:"none",border:"none",color:"#6b6880",
                      cursor:"pointer",fontSize:18,padding:0,lineHeight:1}}>
                      ×
                    </button>
                  </div>
                  <div onClick={()=>router.push(`/kanban?project=${p.id}`)}
                    style={{cursor:"pointer"}}>
                    <div style={{height:4,
                      background:"rgba(255,255,255,0.07)",
                      borderRadius:99,marginBottom:8}}>
                      <div style={{height:4,borderRadius:99,
                        background:p.color,width:pct+"%"}}/>
                    </div>
                    <div style={{display:"flex",
                      justifyContent:"space-between",
                      fontSize:11,color:"#6b6880"}}>
                      <span>{p.done}/{p.total} done</span>
                      <span>{pct}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <h2 style={{fontSize:16,fontWeight:700,
          marginTop:28,marginBottom:14}}>
          Recent Activity
        </h2>
        {[
          {icon:"⚙️",text:'Drag tasks on Kanban to update status',time:"Now"},
          {icon:"🤖",text:'AI Planner generates tasks automatically',time:""},
          {icon:"✅",text:'All data saved to Supabase database',    time:""},
        ].map((a,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",
            gap:12,padding:"13px 16px",marginBottom:8,
            background:"rgba(255,255,255,0.035)",
            border:"1px solid rgba(167,139,250,0.1)",borderRadius:13}}>
            <span style={{fontSize:18}}>{a.icon}</span>
            <span style={{flex:1,fontSize:13,color:"#9ca3af"}}>{a.text}</span>
            <span style={{fontSize:11,color:"#4b4665"}}>{a.time}</span>
          </div>
        ))}
      </div>
    </main>
  )
}
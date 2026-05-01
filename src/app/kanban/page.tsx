"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

function KanbanBoard() {
  const searchParams  = useSearchParams()
  const projectId     = searchParams.get("project")

  const [tasks,       setTasks]       = useState<any>({todo:[],inprogress:[],done:[]})
  const [draggingId,  setDraggingId]  = useState("")
  const [draggingCol, setDraggingCol] = useState("")
  const [dragOver,    setDragOver]    = useState("")
  const [addingCol,   setAddingCol]   = useState("")
  const [newTitle,    setNewTitle]    = useState("")
  const [loading,     setLoading]     = useState(true)

  const cols = [
    {id:"todo",       label:"📋 To Do",       dot:"#6b7280"},
    {id:"inprogress", label:"⚙️ In Progress",  dot:"#a78bfa"},
    {id:"done",       label:"✅ Done",          dot:"#34d399"},
  ]

  useEffect(()=>{ loadTasks() },[projectId])

  async function loadTasks() {
    setLoading(true)
    let query = supabase.from("tasks").select("*").order("created_at")
    if (projectId) query = query.eq("project_id", projectId)
    const { data } = await query
    if (data) {
      const grouped: any = { todo:[], inprogress:[], done:[] }
      data.forEach((t: any)=>{
        if (grouped[t.status]) grouped[t.status].push(t)
      })
      setTasks(grouped)
    }
    setLoading(false)
  }

  async function drop(toCol: string) {
    if (!draggingId || draggingCol===toCol) { setDragOver(""); return }
    await supabase.from("tasks")
      .update({ status: toCol })
      .eq("id", draggingId)
    setTasks((prev: any)=>{
      const task = prev[draggingCol].find((t: any)=>t.id===draggingId)
      return {
        ...prev,
        [draggingCol]: prev[draggingCol].filter((t: any)=>t.id!==draggingId),
        [toCol]: [...prev[toCol], {...task, status:toCol}]
      }
    })
    setDragOver("")
  }

  async function addTask(col: string) {
    if (!newTitle.trim()) return
    const { data } = await supabase
      .from("tasks")
      .insert([{
        title:      newTitle,
        status:     col,
        deadline:   "TBD",
        project_id: projectId || null
      }])
      .select()
    if (data) {
      setTasks((prev: any)=>({
        ...prev,
        [col]: [...prev[col], data[0]]
      }))
    }
    setNewTitle(""); setAddingCol("")
  }

  async function deleteTask(id: string, col: string) {
    await supabase.from("tasks").delete().eq("id", id)
    setTasks((prev: any)=>({
      ...prev,
      [col]: prev[col].filter((t: any)=>t.id!==id)
    }))
  }

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
          <a href="/dashboard" style={{
            background:"rgba(255,255,255,0.05)",color:"#c4b5fd",
            border:"1px solid rgba(167,139,250,0.2)",
            borderRadius:10,padding:"8px 16px",
            fontSize:13,textDecoration:"none"}}>
            ← Dashboard
          </a>
          <a href="/planner" style={{
            background:"linear-gradient(135deg,#7c3aed,#5b21b6)",
            color:"white",borderRadius:10,padding:"8px 16px",
            fontSize:13,textDecoration:"none"}}>
            🤖 AI Generate
          </a>
        </div>
      </nav>

      <div style={{maxWidth:1200,margin:"0 auto",
        padding:"90px 18px 60px"}}>
        <h1 style={{fontSize:22,fontWeight:800,marginBottom:4}}>
          Project Board
        </h1>
        <p style={{fontSize:12,color:"#6b6880",marginBottom:24}}>
          {Object.values(tasks).flat().length} tasks ·
          Drag to move · Auto saved ✅
        </p>

        {loading ? (
          <div style={{textAlign:"center",color:"#6b6880",padding:60}}>
            Loading tasks...
          </div>
        ):(
          <div style={{display:"grid",
            gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
            {cols.map(col=>(
              <div key={col.id}
                onDragOver={e=>{e.preventDefault();setDragOver(col.id)}}
                onDrop={()=>drop(col.id)}
                style={{borderRadius:18,padding:16,minHeight:400,
                  background:dragOver===col.id?"rgba(255,215,0,0.05)"
                    :col.id==="todo"?"rgba(255,255,255,0.022)"
                    :col.id==="inprogress"?"rgba(124,58,237,0.07)"
                    :"rgba(16,185,129,0.055)",
                  border:dragOver===col.id?"1px solid rgba(255,215,0,0.4)"
                    :col.id==="todo"?"1px solid rgba(255,255,255,0.07)"
                    :col.id==="inprogress"?"1px solid rgba(124,58,237,0.16)"
                    :"1px solid rgba(16,185,129,0.13)"}}>

                <div style={{display:"flex",alignItems:"center",
                  justifyContent:"space-between",marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",
                    gap:8,fontSize:13,fontWeight:700}}>
                    <span style={{width:8,height:8,borderRadius:"50%",
                      background:col.dot,display:"inline-block"}}/>
                    {col.label}
                  </div>
                  <span style={{fontSize:11,
                    background:"rgba(255,255,255,0.08)",
                    borderRadius:99,padding:"2px 9px",color:"#9ca3af"}}>
                    {tasks[col.id].length}
                  </span>
                </div>

                {tasks[col.id].map((task: any)=>(
                  <div key={task.id} draggable
                    onDragStart={()=>{
                      setDraggingId(task.id)
                      setDraggingCol(col.id)
                    }}
                    style={{padding:13,borderRadius:13,marginBottom:9,
                      cursor:"grab",
                      background:"rgba(255,255,255,0.042)",
                      border:"1px solid rgba(167,139,250,0.1)"}}>
                    <div style={{display:"flex",
                      justifyContent:"space-between",
                      alignItems:"flex-start"}}>
                      <div style={{fontSize:13,fontWeight:600,
                        color:"white",marginBottom:8,
                        lineHeight:1.4,flex:1}}>
                        {task.title}
                      </div>
                      <button
                        onClick={()=>deleteTask(task.id,col.id)}
                        style={{background:"none",border:"none",
                          color:"#6b6880",cursor:"pointer",
                          fontSize:16,padding:"0 0 0 8px"}}>×
                      </button>
                    </div>
                    <div style={{fontSize:10,color:"#6b6880"}}>
                      📅 {task.deadline}
                    </div>
                  </div>
                ))}

                {tasks[col.id].length===0 &&
                  <div style={{fontSize:11,color:"#4b4665",
                    textAlign:"center",marginTop:14,fontStyle:"italic"}}>
                    Drop tasks here
                  </div>}

                {addingCol===col.id ? (
                  <div style={{marginTop:10}}>
                    <input value={newTitle}
                      onChange={e=>setNewTitle(e.target.value)}
                      onKeyDown={e=>e.key==="Enter"&&addTask(col.id)}
                      placeholder="Task title..." autoFocus
                      style={{width:"100%",
                        background:"rgba(255,255,255,0.07)",
                        border:"1px solid rgba(167,139,250,0.25)",
                        borderRadius:10,padding:"9px 12px",
                        color:"white",fontFamily:"sans-serif",
                        fontSize:13,outline:"none",marginBottom:8,
                        boxSizing:"border-box"}}/>
                    <div style={{display:"flex",gap:7}}>
                      <button onClick={()=>addTask(col.id)} style={{
                        background:"linear-gradient(135deg,#7c3aed,#5b21b6)",
                        color:"white",border:"none",borderRadius:8,
                        padding:"6px 14px",fontSize:12,cursor:"pointer"}}>
                        Add
                      </button>
                      <button
                        onClick={()=>{setAddingCol("");setNewTitle("")}}
                        style={{background:"rgba(255,255,255,0.06)",
                          color:"#9ca3af",
                          border:"1px solid rgba(255,255,255,0.08)",
                          borderRadius:8,padding:"6px 12px",fontSize:12,
                          cursor:"pointer",fontFamily:"sans-serif"}}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ):(
                  <button onClick={()=>setAddingCol(col.id)} style={{
                    width:"100%",marginTop:10,padding:7,
                    background:"rgba(255,255,255,0.05)",color:"#9ca3af",
                    border:"1px solid rgba(255,255,255,0.08)",
                    borderRadius:8,fontSize:12,cursor:"pointer",
                    fontFamily:"sans-serif"}}>
                    + Add task
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default function Kanban() {
  return (
    <Suspense fallback={
      <div style={{color:"white",padding:40,textAlign:"center"}}>
        Loading...
      </div>}>
      <KanbanBoard/>
    </Suspense>
  )
}
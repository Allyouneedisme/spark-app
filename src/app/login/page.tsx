"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Login() {
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  function handleLogin() {
    if (email && password) router.push("/dashboard")
  }

  return (
    <main style={{minHeight:"100vh",background:"#07070f",
      display:"flex",alignItems:"center",
      justifyContent:"center",padding:24,fontFamily:"sans-serif"}}>
      <div style={{width:"100%",maxWidth:420,padding:44,
        background:"rgba(255,255,255,0.052)",
        border:"1px solid rgba(167,139,250,0.17)",borderRadius:20}}>

        <div style={{display:"flex",alignItems:"center",marginBottom:24}}>
          <span style={{fontSize:36,fontWeight:900,fontStyle:"italic",
            color:"white",fontFamily:"Arial Black,sans-serif"}}>SPAR</span>
          <svg width="28" height="36" viewBox="0 0 60 90">
            <polygon points="48,0 24,48 40,48 14,90 62,36 42,36 62,0"
              fill="#FFD700"/>
          </svg>
        </div>

        <h1 style={{fontSize:26,fontWeight:800,marginBottom:6}}>
          Welcome back
        </h1>
        <p style={{fontSize:14,color:"#6b6880",marginBottom:28}}>
          Sign in to your SPARK account
        </p>

        <label style={{display:"block",fontSize:11,fontWeight:700,
          color:"#9ca3af",letterSpacing:"0.7px",marginBottom:8}}>
          EMAIL ADDRESS
        </label>
        <input type="email" value={email}
          onChange={e=>setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{width:"100%",background:"rgba(255,255,255,0.055)",
            border:"1px solid rgba(167,139,250,0.16)",borderRadius:12,
            padding:"13px 16px",color:"white",fontFamily:"sans-serif",
            fontSize:15,outline:"none",marginBottom:16,
            boxSizing:"border-box"}}/>

        <label style={{display:"block",fontSize:11,fontWeight:700,
          color:"#9ca3af",letterSpacing:"0.7px",marginBottom:8}}>
          PASSWORD
        </label>
        <input type="password" value={password}
          onChange={e=>setPassword(e.target.value)}
          placeholder="••••••••"
          style={{width:"100%",background:"rgba(255,255,255,0.055)",
            border:"1px solid rgba(167,139,250,0.16)",borderRadius:12,
            padding:"13px 16px",color:"white",fontFamily:"sans-serif",
            fontSize:15,outline:"none",marginBottom:24,
            boxSizing:"border-box"}}/>

        <button onClick={handleLogin} style={{
          width:"100%",
          background:"linear-gradient(135deg,#7c3aed,#5b21b6)",
          color:"white",border:"none",borderRadius:12,
          padding:"13px",fontSize:15,fontWeight:600,
          cursor:"pointer",marginBottom:20}}>
          Sign In →
        </button>

        <p style={{textAlign:"center",fontSize:13,color:"#6b6880"}}>
          No account?{" "}
          <a href="/signup" style={{color:"#a78bfa",textDecoration:"none"}}>
            Create one free →
          </a>
        </p>
      </div>
    </main>
  )
}
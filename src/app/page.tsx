export default function Home() {
  return (
    <main style={{
      minHeight:"100vh",
      background:"#07070f",
      display:"flex",
      flexDirection:"column",
      alignItems:"center",
      justifyContent:"center",
      textAlign:"center",
      padding:"40px 24px",
      fontFamily:"sans-serif",
      backgroundImage:"linear-gradient(rgba(124,58,237,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.06) 1px,transparent 1px)",
      backgroundSize:"48px 48px"
    }}>

      <div style={{display:"inline-flex",alignItems:"center",gap:8,
        padding:"5px 16px",borderRadius:99,
        background:"rgba(255,215,0,0.09)",
        border:"1px solid rgba(255,215,0,0.26)",
        color:"#ffd700",fontSize:12,fontWeight:700,marginBottom:24}}>
        ⚡ SPARK v1.0 — NOW IN BETA
      </div>

      <div style={{display:"flex",alignItems:"center",marginBottom:16}}>
        <span style={{fontSize:90,fontWeight:900,fontStyle:"italic",
          color:"white",fontFamily:"Arial Black,sans-serif",
          letterSpacing:"-4px",lineHeight:1}}>SPAR</span>
        <svg width="70" height="90" viewBox="0 0 60 90"
          style={{marginLeft:"-4px",marginTop:"6px"}}>
          <polygon points="48,0 24,48 40,48 14,90 62,36 42,36 62,0"
            fill="#FFD700"/>
        </svg>
      </div>

      <p style={{fontSize:17,color:"#9ca3af",maxWidth:480,
        lineHeight:1.75,marginBottom:12}}>
        The only AI-powered project manager built
        specifically for CS students.
      </p>

      <div style={{display:"inline-flex",alignItems:"center",gap:6,
        padding:"4px 14px",borderRadius:99,
        background:"rgba(255,215,0,0.07)",
        border:"1px solid rgba(255,215,0,0.2)",
        color:"#ffd700",fontSize:11,fontWeight:700,marginBottom:28}}>
        ⚡ Powered by Groq AI — 100% Free
      </div>

      <div style={{display:"flex",gap:14,flexWrap:"wrap",
        justifyContent:"center"}}>
        <a href="/dashboard" style={{
          background:"linear-gradient(135deg,#7c3aed,#5b21b6)",
          color:"white",borderRadius:12,padding:"12px 28px",
          fontSize:15,fontWeight:600,textDecoration:"none"}}>
          Open Dashboard →
        </a>
        <a href="/login" style={{
          background:"rgba(255,255,255,0.055)",color:"#c4b5fd",
          border:"1px solid rgba(167,139,250,0.22)",
          borderRadius:12,padding:"12px 24px",
          fontSize:15,textDecoration:"none"}}>
          Sign In
        </a>
      </div>

      <div style={{display:"flex",gap:44,marginTop:52,
        padding:"22px 44px",flexWrap:"wrap",justifyContent:"center",
        background:"rgba(255,255,255,0.035)",borderRadius:20,
        border:"1px solid rgba(167,139,250,0.12)"}}>
        {[["AI","Powered"],["4","Months"],["100%","Free"],["∞","Projects"]].map(([n,l])=>(
          <div key={l} style={{textAlign:"center"}}>
            <div style={{fontSize:26,fontWeight:800,color:"#a78bfa"}}>{n}</div>
            <div style={{fontSize:12,color:"#6b6880",marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>
    </main>
  )
}
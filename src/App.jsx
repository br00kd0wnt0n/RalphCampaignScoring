import { useState, useEffect } from "react"

const DIMS = [
  { id: "idea",     label: "Idea strength",  lo: "Derivative",     hi: "Genuinely original" },
  { id: "cultural", label: "Cultural fit",   lo: "Off-moment",     hi: "Of-the-moment"      },
  { id: "craft",    label: "Craft",          lo: "Poorly executed",hi: "Masterful"          },
  { id: "brand",    label: "Brand clarity",  lo: "Brand absent",   hi: "Unmistakable"       },
  { id: "share",    label: "Shareability",   lo: "Nothing to share",hi:"Impossible not to"  },
]
const ROLES = ["Strategist","Creative","Creative Director","Head of Strategy","Other"]
const QLABELS = { anchor:"Undisputed", strong:"Strong", divisive:"Divisive", middling:"Range filler" }
const QCOLORS = {
  anchor:  { bg:"#ECFDF5", color:"#065F46" },
  strong:  { bg:"#EFF6FF", color:"#1E40AF" },
  divisive:{ bg:"#FFF7ED", color:"#9A3412" },
  middling:{ bg:"#F9FAFB", color:"#6B7280" },
}

// Campaigns loaded from API — no defaults needed in frontend

// --- helpers ---
const api = async (path, opts) => { const r = await fetch(path, { headers:{"Content-Type":"application/json"}, ...opts }); return r.json() }
const shuffle = a => { const b = [...a]; for (let i = b.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]] } return b }
const avg = vals => { const v = vals.filter(x => x != null && !isNaN(x)); return v.length ? Math.round((v.reduce((a,b)=>a+b,0)/v.length)*10)/10 : null }

// --- brand ---
const PINK = "#E6007E"
const PINK_LIGHT = "rgba(230,0,126,0.12)"

// --- styles ---
const css = {
  page:   { fontFamily:"var(--font-sans)", padding:"0 0 40px", color:"var(--color-text-primary)" },
  hdr:    { fontSize:"11px", fontWeight:"600", textTransform:"uppercase", letterSpacing:".08em", color:PINK, marginBottom:"6px" },
  h1:     { fontSize:"22px", fontWeight:"600", marginBottom:"4px" },
  h2:     { fontSize:"16px", fontWeight:"500", marginBottom:"12px" },
  sub:    { fontSize:"14px", color:"var(--color-text-secondary)", lineHeight:"1.6", marginBottom:"16px" },
  card:   { background:"var(--color-background-secondary)", border:"1px solid var(--color-border-tertiary)", borderRadius:"12px", overflow:"hidden", marginBottom:"10px" },
  body:   { padding:"16px" },
  label:  { fontSize:"10px", fontWeight:"500", textTransform:"uppercase", letterSpacing:".05em", color:"var(--color-text-tertiary)", marginBottom:"4px" },
  val:    { fontSize:"13px", color:"var(--color-text-secondary)", lineHeight:"1.6", marginBottom:"12px" },
  prompt: { fontSize:"14px", fontStyle:"italic", color:"var(--color-text-primary)", lineHeight:"1.65", padding:"14px 16px", background:"var(--color-background-primary)", borderRadius:"8px", borderLeft:`3px solid ${PINK}`, marginBottom:"0" },
  inp:    { width:"100%", padding:"10px 12px", border:"1px solid var(--color-border-tertiary)", borderRadius:"8px", fontSize:"13px", background:"var(--color-background-secondary)", color:"var(--color-text-primary)", fontFamily:"var(--font-sans)", boxSizing:"border-box" },
  btnP:   { background:PINK, color:"#fff", border:"none", borderRadius:"8px", padding:"10px 20px", fontSize:"13px", cursor:"pointer", fontFamily:"var(--font-sans)", fontWeight:"500" },
  btnS:   { background:"transparent", color:"var(--color-text-secondary)", border:"1px solid var(--color-border-secondary)", borderRadius:"8px", padding:"10px 16px", fontSize:"13px", cursor:"pointer", fontFamily:"var(--font-sans)" },
  tag:    { display:"inline-block", fontSize:"11px", padding:"2px 8px", borderRadius:"8px", background:"var(--color-background-tertiary)", color:"var(--color-text-secondary)", border:"1px solid var(--color-border-tertiary)", marginRight:"4px", marginBottom:"4px" },
  prog:   { height:"2px", background:"var(--color-border-tertiary)", borderRadius:"1px", margin:"0 0 16px" },
  bar:    { height:"2px", background:PINK, borderRadius:"1px", transition:"width .4s" },
  dimRow: { marginBottom:"18px" },
  dimBtns:{ display:"flex", gap:"6px", marginTop:"6px" },
  dimBtn: { flex:1, padding:"10px 0", border:"1px solid var(--color-border-tertiary)", borderRadius:"6px", background:"var(--color-background-secondary)", color:"var(--color-text-secondary)", fontSize:"15px", fontWeight:"500", cursor:"pointer", fontFamily:"var(--font-mono)", transition:"all .1s" },
  dimBtnA:{ background:PINK, color:"#fff", borderColor:PINK },
  dimEnds:{ display:"flex", justifyContent:"space-between", fontSize:"10px", color:"var(--color-text-tertiary)", marginTop:"5px" },
  navRow: { display:"flex", justifyContent:"space-between", alignItems:"center", gap:"8px", marginTop:"16px" },
  pill:   { fontSize:"10px", fontWeight:"500", padding:"2px 9px", borderRadius:"20px" },
  score:  { fontSize:"28px", fontWeight:"500", fontFamily:"var(--font-mono)" },
  imgBox: { width:"100%", height:"180px", background:"var(--color-background-tertiary)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"6px", fontSize:"12px", color:"var(--color-text-tertiary)" },
}

// ── VIDEO EMBED HELPER ──────────────────────────────────────────────────────
function getEmbedUrl(url) {
  if (!url) return null
  // YouTube: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/shorts/ID, youtube.com/embed/ID
  let m = url.match(/youtu\.be\/([^?&]+)/) || url.match(/youtube\.com\/watch\?v=([^&]+)/) || url.match(/youtube\.com\/shorts\/([^?&]+)/) || url.match(/youtube\.com\/embed\/([^?&]+)/)
  if (m) return `https://www.youtube.com/embed/${m[1]}`
  // Vimeo
  m = url.match(/vimeo\.com\/(\d+)/)
  if (m) return `https://player.vimeo.com/video/${m[1]}`
  return null
}

// ── SCORING CARD (local dim state) ──────────────────────────────────────────
function ScoreCard({ camp, existing, idx, total, pct, onSave, onNext, onHome }) {
  const init = () => { const d={}; DIMS.forEach(dim => { d[dim.id] = existing?.dims?.[dim.id] ?? null }); return d }
  const [dims, setDims] = useState(init)
  const [note, setNote] = useState(existing?.note ?? "")
  const allDone = DIMS.every(d => dims[d.id] != null)
  const qc = QCOLORS[camp.quality] || QCOLORS.middling

  const submit = () => { if (allDone) { onSave(camp.id, dims, note); onNext() } }

  return (
    <div style={css.page}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", color:"var(--color-text-tertiary)", marginBottom:"8px" }}>
        <span>{idx+1} of {total}</span>
        <span>{Object.values(dims).filter(v=>v!=null).length} / {DIMS.length} scored</span>
      </div>
      <div style={css.prog}><div style={{...css.bar, width:`${pct}%`}}/></div>

      <div style={css.card}>
        <MediaMatrix images={camp.images && camp.images.length ? camp.images : camp.imageUrl ? [camp.imageUrl] : []}
          videoUrl={camp.videoUrl} link={camp.link} alt={camp.brand}/>
        <div style={css.body}>
          {/* Campaign header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"8px",marginBottom:"12px",paddingBottom:"12px",borderBottom:"1px solid var(--color-border-tertiary)"}}>
            <div>
              <div style={{fontSize:"20px",fontWeight:"600",letterSpacing:"-0.01em"}}>{camp.brand}</div>
              <div style={{fontSize:"14px",color:"var(--color-text-secondary)",marginTop:"3px"}}>
                <span style={{fontStyle:"italic"}}>"{camp.campaign}"</span>
                <span style={{margin:"0 6px",color:"var(--color-text-tertiary)"}}>·</span>
                <span>{camp.year}</span>
              </div>
            </div>
            <span style={{...css.pill,background:qc.bg,color:qc.color,flexShrink:0,marginTop:"4px",fontSize:"11px",padding:"3px 10px"}}>{QLABELS[camp.quality]}</span>
          </div>

          {/* Meta tags */}
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"14px"}}>
            {camp.territory && <span style={css.tag}>{camp.territory}</span>}
            {camp.platform && <span style={css.tag}>{camp.platform}</span>}
            {camp.agency && <span style={css.tag}>{camp.agency}</span>}
          </div>

          {/* Context */}
          {camp.note && <>
            <div style={{...css.label,marginBottom:"4px"}}>Context</div>
            <div style={{...css.val,marginBottom:"14px",lineHeight:"1.7"}}>{camp.note}</div>
          </>}

          {/* Key stat - highlighted */}
          <div style={{background:"var(--color-background-primary)",border:"1px solid var(--color-border-tertiary)",borderRadius:"8px",padding:"12px 14px",marginBottom:"14px"}}>
            <div style={{...css.label,marginBottom:"4px"}}>Key stat</div>
            <div style={{fontSize:"13px",color:"var(--color-text-primary)",lineHeight:"1.65",fontWeight:"500"}}>{camp.stat}</div>
          </div>

          {/* Scoring prompt */}
          <div style={{...css.label,marginBottom:"4px"}}>Score this</div>
          <div style={css.prompt}>{camp.scoring}</div>
        </div>
      </div>

      {/* ── SCORING TABLE ── */}
      <div style={css.card}>
        <div style={css.body}>
          <div style={{fontSize:"16px",fontWeight:"600",color:"var(--color-text-primary)",marginBottom:"4px"}}>Score this campaign</div>
          <div style={{fontSize:"12px",color:"var(--color-text-secondary)",marginBottom:"18px"}}>Rate each dimension from 1 (low) to 5 (high)</div>
          <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
            {DIMS.map(dim => (
              <div key={dim.id} style={{padding:"12px 14px",background:"var(--color-background-primary)",borderRadius:"8px",border:"1px solid var(--color-border-tertiary)"}}>
                <div style={{fontSize:"14px",fontWeight:"600",color:"var(--color-text-primary)",marginBottom:"6px"}}>{dim.label}</div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
                  <span style={{fontSize:"11px",fontWeight:"500",color:"#b45309",background:"#fef3c7",padding:"2px 8px",borderRadius:"4px"}}>{dim.lo}</span>
                  <span style={{fontSize:"11px",fontWeight:"500",color:"#047857",background:"#d1fae5",padding:"2px 8px",borderRadius:"4px"}}>{dim.hi}</span>
                </div>
                <div style={{display:"flex",gap:"6px"}}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={()=>setDims({...dims,[dim.id]:n})}
                      style={{...css.dimBtn,...(dims[dim.id]===n?css.dimBtnA:{})}}>{n}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:"16px"}}>
            <div style={css.label}>Note (optional)</div>
            <textarea value={note} onChange={e=>setNote(e.target.value)}
              placeholder="Any reaction, disagreement, or reasoning..."
              style={{...css.inp,height:"60px",resize:"vertical",marginTop:"4px"}}/>
          </div>
        </div>
      </div>

      <div style={css.navRow}>
        <div style={{display:"flex",gap:"8px"}}>
          <button style={css.btnS} onClick={onHome}>Home</button>
          <button style={css.btnS} onClick={onNext}>skip</button>
        </div>
        <button style={{...css.btnP,opacity:allDone?1:.4}} disabled={!allDone} onClick={submit}>
          {idx===total-1 ? "Finish & review →" : "Save & next →"}
        </button>
      </div>
    </div>
  )
}

// ── CAMPAIGN DETAIL (admin) ──────────────────────────────────────────────────
function CampDetail({ camp }) {
  const [open, setOpen] = useState(false)
  const qc = QCOLORS[camp.quality] || QCOLORS.middling
  const fields = [
    ["Year", camp.year], ["Territory", camp.territory], ["Agency", camp.agency],
    ["Platform", camp.platform], ["Quality", QLABELS[camp.quality]],
    ["Key stat", camp.stat], ["Context", camp.note], ["Scoring prompt", camp.scoring],
    ["Watch link", camp.link],
  ].filter(([,v]) => v)
  return (
    <div>
      <div onClick={()=>setOpen(!open)} style={{cursor:"pointer",fontSize:"12px",color:"var(--color-text-info)",marginBottom:open?"8px":"0",userSelect:"none"}}>
        {open ? "▾ Hide details" : "▸ Show details"}
      </div>
      {open && (
        <div style={{fontSize:"12px",background:"var(--color-background-secondary)",borderRadius:"6px",padding:"10px 12px",marginBottom:"8px"}}>
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"8px"}}>
            <span style={{...css.pill,background:qc.bg,color:qc.color,fontSize:"11px"}}>{QLABELS[camp.quality]}</span>
            {camp.territory && <span style={{...css.tag,fontSize:"11px"}}>{camp.territory}</span>}
            {camp.agency && <span style={{...css.tag,fontSize:"11px"}}>{camp.agency}</span>}
          </div>
          {fields.map(([label, val]) => (
            <div key={label} style={{marginBottom:"6px"}}>
              <span style={{color:"var(--color-text-tertiary)",marginRight:"6px"}}>{label}:</span>
              {label === "Watch link"
                ? <a href={val} target="_blank" rel="noreferrer" style={{color:"var(--color-text-info)",wordBreak:"break-all"}}>{val}</a>
                : <span style={{color:"var(--color-text-primary)"}}>{val}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── MEDIA EDITOR (admin) ─────────────────────────────────────────────────────
function MediaEdit({ camp, onSave }) {
  const [images, setImages] = useState(() => {
    const arr = camp.images && camp.images.length ? [...camp.images] : camp.imageUrl ? [camp.imageUrl] : [""]
    return arr
  })
  const [vidUrl, setVidUrl] = useState(camp.videoUrl || "")
  const [ok, setOk] = useState(false)
  const save = async () => {
    const cleaned = images.map(u=>u.trim()).filter(Boolean)
    await onSave(camp.id, cleaned, vidUrl)
    setOk(true); setTimeout(()=>setOk(false),2000)
  }
  const updateImage = (i, val) => { const n=[...images]; n[i]=val; setImages(n) }
  const addSlot = () => setImages([...images, ""])
  const removeSlot = (i) => { const n=images.filter((_,j)=>j!==i); setImages(n.length?n:[""])}
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
      {images.map((url,i) => (
        <div key={i} style={{display:"flex",gap:"8px",alignItems:"center"}}>
          <span style={{fontSize:"11px",color:"var(--color-text-tertiary)",width:"52px",flexShrink:0}}>Image {i+1}</span>
          <input style={{...css.inp,flex:1,fontSize:"12px",padding:"8px 10px"}} value={url} onChange={e=>updateImage(i,e.target.value)} placeholder="https://... (jpg, png, webp)"/>
          {images.length > 1 && <button onClick={()=>removeSlot(i)} style={{background:"none",border:"none",color:"var(--color-text-tertiary)",cursor:"pointer",fontSize:"16px",padding:"4px"}}>×</button>}
        </div>
      ))}
      <div style={{display:"flex",justifyContent:"flex-start"}}>
        <button onClick={addSlot} style={{background:"none",border:"none",color:"var(--color-text-info)",cursor:"pointer",fontSize:"12px",padding:"2px 0"}}>+ Add another image</button>
      </div>
      <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
        <span style={{fontSize:"11px",color:"var(--color-text-tertiary)",width:"52px",flexShrink:0}}>Video</span>
        <input style={{...css.inp,flex:1,fontSize:"12px",padding:"8px 10px"}} value={vidUrl} onChange={e=>setVidUrl(e.target.value)} placeholder="https://youtube.com/... or https://vimeo.com/..."/>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end"}}>
        <button style={{...css.btnS,padding:"8px 12px",fontSize:"12px",whiteSpace:"nowrap"}} onClick={save}>{ok?"✓ Saved":"Save"}</button>
      </div>
    </div>
  )
}

// ── MEDIA MATRIX (scoring card) ─────────────────────────────────────────────
function MediaMatrix({ images, videoUrl, link, alt }) {
  const imgs = images && images.length ? images : []
  const embedUrl = getEmbedUrl(videoUrl)
  const items = []
  if (embedUrl) items.push({ type:"video", embedUrl, videoUrl })
  imgs.forEach((src,i) => items.push({ type:"image", src, idx:i }))
  if (link && !embedUrl) items.push({ type:"link", url:link })
  if (items.length === 0) return (
    <div style={css.imgBox}>
      <span>Media to be added</span>
      {link && <a href={link} target="_blank" rel="noreferrer" style={{color:"var(--color-text-info)",fontSize:"12px"}}>Watch campaign →</a>}
    </div>
  )
  const cols = items.length === 1 ? 1 : 2
  return (
    <div style={{padding:"12px 12px 0"}}>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${cols}, 1fr)`,gap:"8px"}}>
        {items.map((item, i) => {
          if (item.type === "video") return (
            <div key={`v${i}`} style={{position:"relative",paddingBottom:"56.25%",background:"#000",borderRadius:"8px",overflow:"hidden",gridColumn:cols===2&&imgs.length===0?"1 / -1":"auto"}}>
              <iframe src={item.embedUrl} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/>
            </div>
          )
          if (item.type === "image") return (
            <div key={`i${item.idx}`} style={{borderRadius:"8px",overflow:"hidden"}}>
              <img src={item.src} alt={`${alt} ${item.idx+1}`} style={{width:"100%",height:"160px",objectFit:"cover",display:"block"}}/>
            </div>
          )
          return (
            <a key={`l${i}`} href={item.url} target="_blank" rel="noreferrer" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"160px",borderRadius:"8px",background:"var(--color-background-tertiary)",textDecoration:"none",gap:"8px",border:"1px solid var(--color-border-tertiary)"}}>
              <span style={{fontSize:"24px"}}>🔗</span>
              <span style={{fontSize:"12px",color:"var(--color-text-info)"}}>Watch campaign →</span>
            </a>
          )
        })}
      </div>
      {link && <div style={{textAlign:"right",marginTop:"6px",marginBottom:"4px"}}>
        <a href={link} target="_blank" rel="noreferrer" style={{fontSize:"11px",color:"var(--color-text-info)",textDecoration:"none"}}>Open campaign link ↗</a>
      </div>}
    </div>
  )
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,   setScreen]   = useState("loading")
  const [camps,    setCamps]    = useState([])
  const [profile,  setProfile]  = useState(null)
  const [order,    setOrder]    = useState([])
  const [idx,      setIdx]      = useState(0)
  const [scores,   setScores]   = useState({})
  const [teamData, setTeamData] = useState({})
  const [nameIn,   setNameIn]   = useState("")
  const [roleIn,   setRoleIn]   = useState("")
  const [unlocked, setUnlocked] = useState(false)
  const [passIn,   setPassIn]   = useState("")
  const [newC,     setNewC]     = useState({brand:"",campaign:"",year:"2024",territory:"brand",platform:"",agency:"",stat:"",note:"",scoring:"",link:"",imageUrl:"",videoUrl:"",quality:"strong"})

  useEffect(()=>{
    ;(async()=>{
      try {
        const c = await api("/api/campaigns")
        if (!Array.isArray(c)) throw new Error("bad response")
        setCamps(c)
        const scorerId = localStorage.getItem("rs_scorer_id")
        if (scorerId) {
          try {
            const prof = await api(`/api/profile/${scorerId}`)
            const sc = await api(`/api/scores/${scorerId}`)
            setProfile({ id: prof.id, name: prof.name, role: prof.role }); setScores(sc)
            const savedOrd = localStorage.getItem("rs_order")
            const o = savedOrd ? JSON.parse(savedOrd) : shuffle(c.map(x=>x.id))
            if (!savedOrd) localStorage.setItem("rs_order", JSON.stringify(o))
            setOrder(o)
            const first = o.findIndex(id => !sc[id])
            setIdx(first === -1 ? o.length : first)
            setScreen(first === -1 ? "complete" : "scoring")
          } catch { localStorage.removeItem("rs_scorer_id"); setScreen("welcome") }
        } else { setScreen("welcome") }
      } catch { setScreen("error") }
    })()
  },[])

  const start = async () => {
    if (!nameIn.trim() || !roleIn) return
    const p = await api("/api/profile", { method:"POST", body:JSON.stringify({ name:nameIn.trim(), role:roleIn }) })
    setProfile(p); localStorage.setItem("rs_scorer_id", p.id)
    // Load any existing scores for this scorer (in case they're returning)
    const existingScores = await api(`/api/scores/${p.id}`)
    setScores(existingScores)
    const o = shuffle(camps.map(c=>c.id))
    setOrder(o); localStorage.setItem("rs_order", JSON.stringify(o))
    const first = o.findIndex(id => !existingScores[id])
    setIdx(first === -1 ? 0 : first)
    setScreen("scoring")
  }

  const saveScore = async (id, dims, note) => {
    const u = { ...scores, [id]:{ dims, note, ts:Date.now() } }
    setScores(u)
    await api("/api/scores", { method:"POST", body:JSON.stringify({ scorer_id:profile.id, campaign_id:id, dims, note }) })
  }

  const submit = async () => {
    // Scores are already saved to DB individually — just transition
    setScreen("complete")
  }

  const loadTeam = async () => {
    try {
      const data = await api("/api/team")
      setTeamData(data)
    } catch { setTeamData({}) }
    setScreen("team")
  }

  const updateMedia = async (id, images, videoUrl) => {
    const imageUrl = images.length ? images[0] : ""
    const u = camps.map(c => c.id===id ? {...c, imageUrl, images, videoUrl} : c)
    setCamps(u)
    await api(`/api/campaigns/${id}/media`, { method:"PUT", body:JSON.stringify({ imageUrl, images, videoUrl }) })
  }

  const addCamp = async () => {
    if (!newC.brand.trim() || !newC.campaign.trim()) return
    const camp = {...newC, id:`c_${Date.now()}`}
    setCamps([...camps, camp])
    await api("/api/campaigns", { method:"POST", body:JSON.stringify(camp) })
    setNewC({brand:"",campaign:"",year:"2024",territory:"brand",platform:"",agency:"",stat:"",note:"",scoring:"",link:"",imageUrl:"",videoUrl:"",quality:"strong"})
  }

  const camp = camps.find(c => c.id === order[idx])
  const scored = Object.keys(scores).length
  const pct = order.length ? Math.round(scored/order.length*100) : 0
  const unscored = order.filter(id => !scores[id]).length

  // ── LOADING ──
  if (screen==="loading") return (
    <div style={{...css.page,display:"flex",alignItems:"center",justifyContent:"center",height:"200px"}}>
      <span style={{fontSize:"13px",color:"var(--color-text-tertiary)"}}>Loading Voices Calibration…</span>
    </div>
  )

  // ── ERROR ──
  if (screen==="error") return (
    <div style={{...css.page,display:"flex",alignItems:"center",justifyContent:"center",height:"200px",flexDirection:"column",gap:"12px"}}>
      <span style={{fontSize:"13px",color:"var(--color-text-secondary)"}}>Could not connect to the server.</span>
      <button style={css.btnS} onClick={()=>{ setScreen("loading"); window.location.reload() }}>Retry</button>
    </div>
  )

  // ── WELCOME ──
  if (screen==="welcome") return (
    <div style={css.page}>
      <div style={{paddingTop:"8px",marginBottom:"24px"}}>
        <img src="/ralph-logo.png" alt="ralph" style={{height:"36px",marginBottom:"8px"}}/>
        <div style={css.hdr}>Voices Calibration</div>
        <div style={css.sub}>We're building a shared definition of creative excellence — and that starts with your taste, your instincts, and your judgement. This exercise asks you to score {camps.length} real campaigns across 5 dimensions. Your scores help us understand what great creative looks like through the eyes of the people who actually make it. This isn't about replacing anyone's expertise — it's about capturing it. Voices gets smarter when it learns from the team, not instead of the team.</div>
        <div style={{display:"flex",gap:"16px",fontSize:"12px",color:"var(--color-text-tertiary)"}}>
          <span>~45 minutes</span><span>·</span><span>Return anytime</span><span>·</span><span>{camps.length} campaigns</span>
        </div>
      </div>
      {profile && Object.keys(scores).length > 0 && (
        <div style={{...css.card,marginBottom:"12px"}}>
          <div style={{...css.body,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:"14px",fontWeight:"500"}}>Welcome back, {profile.name}</div>
              <div style={{fontSize:"12px",color:"var(--color-text-secondary)",marginTop:"2px"}}>{Object.keys(scores).length} of {camps.length} scored</div>
            </div>
            <button style={css.btnP} onClick={()=>{
              const first = order.findIndex(id => !scores[id])
              setIdx(first === -1 ? 0 : first)
              setScreen("scoring")
            }}>Resume scoring →</button>
          </div>
        </div>
      )}
      <div style={css.card}>
        <div style={css.body}>
          <div style={{marginBottom:"14px"}}>
            <div style={css.label}>{profile ? "Start as someone else" : "Your name"}</div>
            <input style={css.inp} value={nameIn} onChange={e=>setNameIn(e.target.value)} placeholder="First name is fine"
              onKeyDown={e=>e.key==="Enter"&&start()}/>
          </div>
          <div style={{marginBottom:"20px"}}>
            <div style={css.label}>Your role</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginTop:"6px"}}>
              {ROLES.map(r=>(
                <div key={r} onClick={()=>setRoleIn(r)} style={{...css.tag,cursor:"pointer",
                  background:roleIn===r?PINK:"var(--color-background-tertiary)",
                  color:roleIn===r?"#fff":"var(--color-text-secondary)",
                  border:roleIn===r?`1px solid ${PINK}`:"1px solid var(--color-border-tertiary)"}}>
                  {r}
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:"12px",color:"var(--color-text-tertiary)"}}>Scores save automatically as you go.</div>
            <button style={{...css.btnP,opacity:(!nameIn.trim()||!roleIn)?.4:1}} onClick={start}>Start scoring →</button>
          </div>
        </div>
      </div>
      <div onClick={()=>setScreen("admin")} style={{fontSize:"12px",color:"var(--color-text-tertiary)",textAlign:"right",cursor:"pointer",marginTop:"10px",padding:"4px"}}>Admin ›</div>
    </div>
  )

  // ── SCORING ──
  if (screen==="scoring" && camp) return (
    <ScoreCard key={camp.id} camp={camp} existing={scores[camp.id]} idx={idx} total={order.length} pct={pct}
      onSave={saveScore}
      onNext={() => { if (idx < order.length-1) setIdx(idx+1); else setScreen("review") }}
      onHome={() => setScreen("welcome")}/>
  )

  // ── REVIEW ──
  if (screen==="review") return (
    <div style={css.page}>
      <div style={{marginBottom:"20px"}}>
        <div style={css.hdr}>Almost done</div>
        <div style={css.h1}>Review & submit</div>
        <div style={css.sub}>{scored} of {order.length} scored.{unscored>0?` ${unscored} still unscored — click to go back, or submit now.`:` All done.`}</div>
      </div>
      {order.map(id => {
        const c = camps.find(x=>x.id===id)
        const s = scores[id]
        if (!c) return null
        const campAvg = s ? avg(Object.values(s.dims)) : null
        return (
          <div key={id} style={{...css.card,opacity:s?1:.5,cursor:"pointer"}}
            onClick={()=>{ const i=order.indexOf(id); setIdx(i); setScreen("scoring") }}>
            <div style={{...css.body,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:"13px",fontWeight:"500"}}>{c.brand}</div>
                <div style={{fontSize:"12px",color:"var(--color-text-secondary)"}}>{c.campaign}</div>
              </div>
              {campAvg!=null
                ? <div style={{...css.score,fontSize:"22px"}}>{campAvg}</div>
                : <div style={{fontSize:"12px",color:"var(--color-text-tertiary)"}}>not scored →</div>}
            </div>
          </div>
        )
      })}
      <div style={{display:"flex",gap:"10px",marginTop:"20px",flexWrap:"wrap"}}>
        <button style={css.btnP} onClick={submit}>Submit scores →</button>
        {unscored>0&&<button style={css.btnS} onClick={()=>{ const f=order.findIndex(id=>!scores[id]); if(f>=0){setIdx(f);setScreen("scoring")} }}>Score {unscored} more</button>}
      </div>
    </div>
  )

  // ── COMPLETE ──
  if (screen==="complete") {
    const dimAvgs = {}
    DIMS.forEach(d => { dimAvgs[d.id] = avg(Object.values(scores).map(s=>s.dims?.[d.id]).filter(v=>v!=null)) })
    const overall = avg(Object.values(dimAvgs).filter(v=>v!=null))
    const top5 = camps.filter(c=>scores[c.id]).sort((a,b)=>(avg(Object.values(scores[b.id]?.dims||{})))-(avg(Object.values(scores[a.id]?.dims||{})))).slice(0,5)
    return (
      <div style={css.page}>
        <div style={{marginBottom:"24px"}}>
          <div style={css.hdr}>Scoring complete</div>
          <div style={css.h1}>Your taste profile</div>
          <div style={css.sub}>{scored} campaigns · Average score: <strong>{overall}/5</strong></div>
        </div>
        <div style={{...css.card,marginBottom:"20px"}}>
          <div style={css.body}>
            <div style={css.label}>By dimension</div>
            {DIMS.map(d=>(
              <div key={d.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"12px"}}>
                <div style={{fontSize:"13px",color:"var(--color-text-secondary)"}}>{d.label}</div>
                <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <div style={{width:"90px",height:"3px",background:"var(--color-border-tertiary)",borderRadius:"2px"}}>
                    <div style={{width:`${((dimAvgs[d.id]||0)/5)*100}%`,height:"3px",background:PINK,borderRadius:"2px"}}/>
                  </div>
                  <span style={{...css.score,fontSize:"16px",minWidth:"28px",textAlign:"right"}}>{dimAvgs[d.id]??"-"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={css.label}>Your top 5</div>
        {top5.map((c,i)=>{
          const a = avg(Object.values(scores[c.id]?.dims||{}))
          return (
            <div key={c.id} style={{...css.card,cursor:"pointer"}} onClick={()=>{ const oi=order.indexOf(c.id); setIdx(oi); setScreen("scoring") }}>
              <div style={{...css.body,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",gap:"12px",alignItems:"center"}}>
                  <span style={{fontSize:"14px",color:"var(--color-text-tertiary)",minWidth:"18px"}}>#{i+1}</span>
                  <div>
                    <div style={{fontSize:"13px",fontWeight:"500"}}>{c.brand}</div>
                    <div style={{fontSize:"12px",color:"var(--color-text-secondary)"}}>{c.campaign}</div>
                  </div>
                </div>
                <div style={css.score}>{a}</div>
              </div>
            </div>
          )
        })}
        <div style={{display:"flex",gap:"10px",marginTop:"24px",flexWrap:"wrap"}}>
          <button style={css.btnP} onClick={loadTeam}>See team scores</button>
          {unscored>0&&<button style={css.btnS} onClick={()=>{ const f=order.findIndex(id=>!scores[id]); if(f>=0){setIdx(f);setScreen("scoring")} }}>Score {unscored} more</button>}
          <button style={css.btnS} onClick={()=>setScreen("admin")}>Admin</button>
        </div>
      </div>
    )
  }

  // ── TEAM VIEW ──
  if (screen==="team") {
    const scorerCount = Object.keys(teamData).length
    const agg = {}
    camps.forEach(c => {
      const cs = Object.values(teamData).map(d=>d.scores?.[c.id]).filter(Boolean)
      if (!cs.length) return
      const da = {}; DIMS.forEach(d => { da[d.id]=avg(cs.map(s=>s.dims?.[d.id]).filter(v=>v!=null)) })
      agg[c.id] = { overall:avg(Object.values(da).filter(v=>v!=null)), dims:da, count:cs.length, notes:cs.map(s=>s.note).filter(Boolean) }
    })
    const ranked = camps.filter(c=>agg[c.id]).sort((a,b)=>(agg[b.id]?.overall||0)-(agg[a.id]?.overall||0))
    return (
      <div style={css.page}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"24px"}}>
          <div>
            <div style={css.hdr}>Collective taste</div>
            <div style={css.h1}>Team scores</div>
            <div style={{...css.sub,marginBottom:0}}>{scorerCount} scorer{scorerCount!==1?"s":""} · {ranked.length} campaigns rated</div>
          </div>
          <button style={css.btnS} onClick={()=>setScreen("complete")}>← Back</button>
        </div>
        {ranked.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"var(--color-text-tertiary)",fontSize:"13px"}}>No team scores submitted yet.</div>}
        {ranked.map(c=>{
          const a=agg[c.id]; if(!a) return null
          const qc=QCOLORS[c.quality]||QCOLORS.middling
          return (
            <div key={c.id} style={css.card}>
              <div style={css.body}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px"}}>
                  <div>
                    <div style={{fontSize:"14px",fontWeight:"500"}}>{c.brand}</div>
                    <div style={{fontSize:"12px",color:"var(--color-text-secondary)"}}>{c.campaign} · <span style={{...css.pill,...qc}}>{QLABELS[c.quality]}</span> · {a.count} scorer{a.count!==1?"s":""}</div>
                  </div>
                  <div style={css.score}>{a.overall}</div>
                </div>
                <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:a.notes.length?"10px":"0"}}>
                  {DIMS.map(d=>(
                    <span key={d.id} style={{...css.tag,fontSize:"11px"}}>{d.label.split(" ")[0]} {a.dims[d.id]??"-"}</span>
                  ))}
                </div>
                {a.notes.length>0&&(
                  <div style={{paddingTop:"10px",borderTop:"1px solid var(--color-border-tertiary)"}}>
                    {a.notes.map((n,i)=><div key={i} style={{fontSize:"12px",color:"var(--color-text-secondary)",lineHeight:"1.5",marginBottom:"4px",fontStyle:"italic"}}>"{n}"</div>)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── ADMIN ──
  if (screen==="admin") return (
    <div style={css.page}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
        <div style={css.h2}>Admin</div>
        <button style={css.btnS} onClick={()=>setScreen(profile?"complete":"welcome")}>← Back</button>
      </div>
      {!unlocked ? (
        <div style={css.card}>
          <div style={css.body}>
            <div style={css.label}>Password</div>
            <div style={{display:"flex",gap:"8px",marginTop:"4px"}}>
              <input type="password" style={{...css.inp,flex:1}} value={passIn} onChange={e=>setPassIn(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&passIn==="ralph"&&setUnlocked(true)} placeholder="Enter password"/>
              <button style={css.btnP} onClick={()=>{if(passIn==="ralph")setUnlocked(true)}}>Unlock</button>
            </div>
            <div style={{fontSize:"11px",color:"var(--color-text-tertiary)",marginTop:"8px"}}>Default: ralph</div>
          </div>
        </div>
      ) : (
        <>
          <div style={css.label}>Campaign media</div>
          <div style={{...css.sub,marginBottom:"12px"}}>Add an image and/or video URL for each campaign. YouTube and Vimeo links will embed automatically.</div>
          {camps.map(c=>{
            const imgCount = c.images?.length || (c.imageUrl ? 1 : 0)
            const hasVid = !!c.videoUrl
            const hasMedia = imgCount > 0 || hasVid
            return (
            <div key={c.id} style={{...css.card,marginBottom:"8px"}}>
              <div style={{...css.body,padding:"10px 14px"}}>
                <div style={{fontSize:"13px",fontWeight:"500",marginBottom:"6px"}}>{c.brand} — <span style={{fontWeight:"400",color:"var(--color-text-secondary)"}}>{c.campaign} · {c.year}</span>
                  {hasMedia && (()=>{
                    const parts = []
                    if (imgCount) parts.push(`${imgCount} img${imgCount>1?"s":""}`)
                    if (hasVid) parts.push("video")
                    return <span style={{fontSize:"11px",color:"var(--color-text-success)",marginLeft:"6px"}}>✓ {parts.join(" + ")}</span>
                  })()}
                </div>
                {/* Media preview */}
                {hasMedia && (
                  <div style={{marginBottom:"10px",borderRadius:"8px",overflow:"hidden",border:"1px solid var(--color-border-tertiary)"}}>
                    <MediaMatrix
                      images={c.images && c.images.length ? c.images : c.imageUrl ? [c.imageUrl] : []}
                      videoUrl={c.videoUrl} link={c.link} alt={c.brand}/>
                  </div>
                )}
                <CampDetail camp={c}/>
                <MediaEdit camp={c} onSave={updateMedia}/>
              </div>
            </div>
            )
          })}

          <div style={{...css.card,marginTop:"24px"}}>
            <div style={css.body}>
              <div style={{...css.h2,marginBottom:"16px"}}>Add campaign</div>
              {[["brand","Brand"],["campaign","Campaign name"],["year","Year"],["agency","Agency"],["platform","Platform(s)"],["stat","Key stat"],["note","Context (1-2 lines)"],["scoring","Scoring prompt"],["link","Watch link"],["imageUrl","Image URL"],["videoUrl","Video URL (YouTube/Vimeo)"]].map(([f,l])=>(
                <div key={f} style={{marginBottom:"10px"}}>
                  <div style={css.label}>{l}</div>
                  <input style={css.inp} value={newC[f]} onChange={e=>setNewC({...newC,[f]:e.target.value})}/>
                </div>
              ))}
              <div style={{marginBottom:"12px"}}>
                <div style={css.label}>Territory</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginTop:"6px"}}>
                  {["brand","social","purpose","collab","product"].map(t=>(
                    <div key={t} onClick={()=>setNewC({...newC,territory:t})} style={{...css.tag,cursor:"pointer",
                      background:newC.territory===t?PINK:"var(--color-background-tertiary)",
                      color:newC.territory===t?"#fff":"var(--color-text-secondary)"}}>{t}</div>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:"16px"}}>
                <div style={css.label}>Quality tier</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginTop:"6px"}}>
                  {["anchor","strong","divisive","middling"].map(q=>(
                    <div key={q} onClick={()=>setNewC({...newC,quality:q})} style={{...css.tag,cursor:"pointer",
                      background:newC.quality===q?PINK:"var(--color-background-tertiary)",
                      color:newC.quality===q?"#fff":"var(--color-text-secondary)"}}>{QLABELS[q]}</div>
                  ))}
                </div>
              </div>
              <button style={css.btnP} onClick={addCamp}>Add campaign</button>
            </div>
          </div>
        </>
      )}
    </div>
  )

  return null
}

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

// Admin token storage. Persists across reloads so the unlock flow is a
// one-time entry per browser. Cleared explicitly via clearAdminToken
// (e.g. if a request 401s — token was rotated server-side).
const ADMIN_TOKEN_KEY = "rs_admin_token"
const getAdminToken = () => { try { return localStorage.getItem(ADMIN_TOKEN_KEY) || "" } catch { return "" } }
const setAdminToken = (t) => {
  try {
    if (t) localStorage.setItem(ADMIN_TOKEN_KEY, t)
    else localStorage.removeItem(ADMIN_TOKEN_KEY)
  } catch { /* private mode / quota — silent */ }
}

// adminApi attaches X-Admin-Token from localStorage. Returns the parsed
// JSON on success; throws an Error with the response status on failure
// so callers can distinguish auth issues from validation. Use this for
// every admin-write endpoint — never `api()`.
// Defensive URL guard for render — even though the server validates on
// insert (server.js: safeUrl), pre-existing rows from before that fix
// could carry javascript:/data:/vbscript: payloads. Render-time guard
// returns the URL if it parses as http(s), null otherwise. Components
// fall back to placeholders when null.
const renderSafeUrl = (s) => {
  if (typeof s !== "string" || !s) return null
  try {
    const u = new URL(s)
    return (u.protocol === "http:" || u.protocol === "https:") ? u.href : null
  } catch { return null }
}

const adminApi = async (path, opts = {}) => {
  const token = getAdminToken()
  const r = await fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Token": token,
      ...(opts.headers || {}),
    },
  })
  if (!r.ok) {
    let body = null
    try { body = await r.json() } catch { /* non-JSON error body — fall through */ }
    const err = new Error(body?.error || `HTTP ${r.status}`)
    err.status = r.status
    throw err
  }
  // 204 has no body
  if (r.status === 204) return null
  return r.json()
}
const shuffle = a => { const b = [...a]; for (let i = b.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]] } return b }
const avg = vals => { const v = vals.filter(x => x != null && !isNaN(x)); return v.length ? Math.round((v.reduce((a,b)=>a+b,0)/v.length)*10)/10 : null }

// --- brand ---
const PINK = "#E6007E"
const PINK_GLOW = "rgba(217, 77, 143, 0.4)"
const PINK_SUBTLE = "rgba(217, 77, 143, 0.15)"

// --- styles ---
const css = {
  page:   { fontFamily:"var(--font-sans)", padding:"0 0 40px", color:"var(--color-text-primary)", maxWidth:"640px", margin:"0 auto" },
  hdr:    { fontSize:"11px", fontWeight:"600", textTransform:"uppercase", letterSpacing:".08em", color:PINK, marginBottom:"6px" },
  h1:     { fontSize:"24px", fontWeight:"700", marginBottom:"4px", letterSpacing:"-0.02em" },
  h2:     { fontSize:"16px", fontWeight:"600", marginBottom:"12px" },
  sub:    { fontSize:"14px", color:"var(--color-text-secondary)", lineHeight:"1.6", marginBottom:"16px" },
  card:   { background:"rgba(255,255,255,0.03)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"12px", overflow:"hidden", marginBottom:"10px", transition:"box-shadow .2s" },
  body:   { padding:"16px" },
  label:  { fontSize:"10px", fontWeight:"600", textTransform:"uppercase", letterSpacing:".06em", color:"var(--color-text-tertiary)", marginBottom:"4px" },
  val:    { fontSize:"13px", color:"var(--color-text-secondary)", lineHeight:"1.6", marginBottom:"12px" },
  prompt: { fontSize:"14px", fontStyle:"italic", color:"var(--color-text-primary)", lineHeight:"1.65", padding:"14px 16px", background:PINK_SUBTLE, borderRadius:"8px", borderLeft:`3px solid ${PINK}`, marginBottom:"0" },
  inp:    { width:"100%", padding:"10px 12px", border:"1px solid var(--color-border-tertiary)", borderRadius:"8px", fontSize:"13px", background:"var(--color-background-secondary)", color:"var(--color-text-primary)", fontFamily:"var(--font-sans)", boxSizing:"border-box", outline:"none", transition:"border-color .15s" },
  btnP:   { background:PINK, color:"#fff", border:"none", borderRadius:"8px", padding:"10px 20px", fontSize:"13px", cursor:"pointer", fontFamily:"var(--font-sans)", fontWeight:"600", boxShadow:`0 0 20px -5px ${PINK_GLOW}`, transition:"box-shadow .15s, transform .1s" },
  btnS:   { background:"transparent", color:"var(--color-text-secondary)", border:"1px solid var(--color-border-secondary)", borderRadius:"8px", padding:"10px 16px", fontSize:"13px", cursor:"pointer", fontFamily:"var(--font-sans)", transition:"border-color .15s" },
  tag:    { display:"inline-block", fontSize:"11px", padding:"2px 8px", borderRadius:"8px", background:"var(--color-background-tertiary)", color:"var(--color-text-secondary)", border:"1px solid rgba(255,255,255,0.05)", marginRight:"4px", marginBottom:"4px" },
  prog:   { height:"2px", background:"var(--color-border-tertiary)", borderRadius:"1px", margin:"0 0 16px" },
  bar:    { height:"2px", background:PINK, borderRadius:"1px", transition:"width .4s", boxShadow:`0 0 8px ${PINK_GLOW}` },
  dimRow: { marginBottom:"18px" },
  dimBtns:{ display:"flex", gap:"6px", marginTop:"6px" },
  dimBtn: { flex:1, padding:"10px 0", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"6px", background:"rgba(255,255,255,0.03)", color:"var(--color-text-secondary)", fontSize:"15px", fontWeight:"500", cursor:"pointer", fontFamily:"var(--font-mono)", transition:"all .15s cubic-bezier(0.4,0,0.2,1)" },
  dimBtnA:{ background:PINK, color:"#fff", borderColor:PINK, boxShadow:`0 0 12px -3px ${PINK_GLOW}` },
  dimEnds:{ display:"flex", justifyContent:"space-between", fontSize:"10px", color:"var(--color-text-tertiary)", marginTop:"5px" },
  navRow: { display:"flex", justifyContent:"space-between", alignItems:"center", gap:"8px", marginTop:"16px" },
  pill:   { fontSize:"10px", fontWeight:"500", padding:"2px 9px", borderRadius:"20px" },
  score:  { fontSize:"28px", fontWeight:"600", fontFamily:"var(--font-mono)", letterSpacing:"-0.02em" },
  imgBox: { width:"100%", height:"180px", background:"rgba(255,255,255,0.03)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"6px", fontSize:"12px", color:"var(--color-text-tertiary)", border:"1px dashed rgba(255,255,255,0.08)", borderRadius:"8px" },
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

// ── RADAR CHART ─────────────────────────────────────────────────────────────
const RADAR_SHORT = { idea:"Idea", cultural:"Culture", craft:"Craft", brand:"Brand", share:"Share" }
function Radar({ size=260, user, team, showTeam=true }) {
  const cx = size/2, cy = size/2
  const r = size/2 - 44
  const n = DIMS.length
  const angle = i => (Math.PI*2*i/n) - Math.PI/2
  const point = (i, val) => {
    const a = angle(i); const rr = r * (Math.max(0, Math.min(5, val||0))/5)
    return [cx + Math.cos(a)*rr, cy + Math.sin(a)*rr]
  }
  const polyStr = pts => pts.map(([x,y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const userPts = DIMS.map((d,i) => point(i, user?.[d.id] ?? 0))
  const teamPts = (showTeam && team) ? DIMS.map((d,i) => point(i, team?.[d.id] ?? 0)) : null
  const hasUser = DIMS.some(d => user?.[d.id] != null)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{display:"block",margin:"0 auto",overflow:"visible"}}>
      {[1,2,3,4,5].map(level => (
        <polygon key={level} points={polyStr(DIMS.map((_,i)=>point(i,level)))}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      ))}
      {DIMS.map((_,i) => {
        const [x,y] = point(i,5)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      })}
      {teamPts && (
        <polygon points={polyStr(teamPts)}
          fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" strokeDasharray="3 3"/>
      )}
      {hasUser && (
        <polygon points={polyStr(userPts)}
          fill={PINK_SUBTLE} stroke={PINK} strokeWidth="2"/>
      )}
      {hasUser && userPts.map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill={PINK} stroke="#0b0b0b" strokeWidth="1"/>
      ))}
      {DIMS.map((d,i) => {
        const a = angle(i)
        const lx = cx + Math.cos(a) * (r + 22)
        const ly = cy + Math.sin(a) * (r + 22)
        const anchor = Math.abs(Math.cos(a)) < 0.15 ? "middle" : Math.cos(a) > 0 ? "start" : "end"
        return (
          <text key={i} x={lx} y={ly} fontSize="10" fill="var(--color-text-secondary)"
            textAnchor={anchor} dominantBaseline="middle"
            style={{textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>
            {RADAR_SHORT[d.id] || d.label.split(" ")[0]}
          </text>
        )
      })}
    </svg>
  )
}

// ── PROGRESS RING ───────────────────────────────────────────────────────────
function ProgressRing({ value, total, size=72 }) {
  const r = size/2 - 5
  const c = 2*Math.PI*r
  const pct = total ? value/total : 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={PINK} strokeWidth="4"
        strokeDasharray={`${c*pct} ${c}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:"stroke-dasharray .4s",filter:`drop-shadow(0 0 4px ${PINK_GLOW})`}}/>
      <text x={size/2} y={size/2} fontSize="16" fontWeight="600" fill="var(--color-text-primary)"
        textAnchor="middle" dominantBaseline="central" style={{fontFamily:"var(--font-mono)"}}>{value}</text>
    </svg>
  )
}

// ── SCORING CARD (local dim state) ──────────────────────────────────────────
function ScoreCard({ camp, existing, idx, total, pct, scoredCount, onSave, onNext, onHome, onViewTaste }) {
  const init = () => { const d={}; DIMS.forEach(dim => { d[dim.id] = existing?.dims?.[dim.id] ?? null }); return d }
  const [dims, setDims] = useState(init)
  const [note, setNote] = useState(existing?.note ?? "")
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 900px)").matches)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)")
    const fn = e => setWide(e.matches)
    mq.addEventListener("change", fn)
    return () => mq.removeEventListener("change", fn)
  }, [])
  const allDone = DIMS.every(d => dims[d.id] != null)
  const qc = QCOLORS[camp.quality] || QCOLORS.middling

  const submit = () => { if (allDone) { onSave(camp.id, dims, note); onNext() } }

  return (
    <div style={{...css.page, maxWidth: wide ? "1100px" : "640px"}}>
      <div style={{marginBottom:"8px"}}>
        <img src="/ralph-logo.png" alt="ralph" style={{height:"36px"}}/>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", color:"var(--color-text-tertiary)", marginBottom:"8px" }}>
        <span>{idx+1} of {total}</span>
        <span>{Object.values(dims).filter(v=>v!=null).length} / {DIMS.length} dimensions rated</span>
      </div>
      <div style={css.prog}><div style={{...css.bar, width:`${pct}%`}}/></div>

      <div style={wide ? {display:"grid",gridTemplateColumns:"minmax(0, 1fr) 400px",gap:"20px",alignItems:"start"} : {}}>
      <div>
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
      </div>

      {/* ── SCORING TABLE (right column when wide) ── */}
      <div style={wide ? {position:"sticky",top:"12px"} : {}}>
      <div style={css.card}>
        <div style={{...css.body, padding: wide ? "12px 14px" : "16px"}}>
          <div style={{fontSize: wide ? "14px" : "16px",fontWeight:"600",color:"var(--color-text-primary)",marginBottom:"4px"}}>Score this campaign</div>
          <div style={{fontSize:"11px",color:"var(--color-text-secondary)",marginBottom: wide ? "10px" : "18px"}}>Rate each dimension 1 (low) to 5 (high)</div>
          <div style={{display:"flex",flexDirection:"column",gap: wide ? "8px" : "16px"}}>
            {DIMS.map(dim => (
              <div key={dim.id} style={{padding: wide ? "8px 10px" : "12px 14px",background:"var(--color-background-primary)",borderRadius:"8px",border:"1px solid var(--color-border-tertiary)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom: wide ? "5px" : "6px",gap:"6px"}}>
                  <div style={{fontSize: wide ? "13px" : "14px",fontWeight:"600",color:"var(--color-text-primary)"}}>{dim.label}</div>
                  {wide && (
                    <div style={{display:"flex",gap:"4px",fontSize:"10px",color:"var(--color-text-tertiary)"}}>
                      <span style={{color:"#b45309"}}>{dim.lo}</span><span>·</span><span style={{color:"#047857"}}>{dim.hi}</span>
                    </div>
                  )}
                </div>
                {!wide && (
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
                    <span style={{fontSize:"11px",fontWeight:"500",color:"#b45309",background:"#fef3c7",padding:"2px 8px",borderRadius:"4px"}}>{dim.lo}</span>
                    <span style={{fontSize:"11px",fontWeight:"500",color:"#047857",background:"#d1fae5",padding:"2px 8px",borderRadius:"4px"}}>{dim.hi}</span>
                  </div>
                )}
                <div style={{display:"flex",gap:"6px"}}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={()=>setDims({...dims,[dim.id]:n})}
                      style={{...css.dimBtn, padding: wide ? "6px 0" : "10px 0", fontSize: wide ? "14px" : "15px", ...(dims[dim.id]===n?css.dimBtnA:{})}}>{n}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop: wide ? "10px" : "16px"}}>
            <div style={css.label}>Note (optional)</div>
            <textarea value={note} onChange={e=>setNote(e.target.value)}
              placeholder="Any reaction, disagreement, or reasoning..."
              style={{...css.inp,height: wide ? "44px" : "60px",resize:"vertical",marginTop:"4px"}}/>
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
      {scoredCount > 0 && (
        <div style={{display:"flex",justifyContent:"center",marginTop:"14px"}}>
          <button style={{...css.btnS,fontSize:"12px",padding:"8px 14px"}} onClick={onViewTaste}>
            ✦ View your taste so far ({scoredCount} scored)
          </button>
        </div>
      )}
      </div>
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
          if (item.type === "image") {
            const safeSrc = renderSafeUrl(item.src)
            if (!safeSrc) return null
            return (
              <div key={`i${item.idx}`} style={{borderRadius:"8px",overflow:"hidden"}}>
                <img src={safeSrc} alt={`${alt} ${item.idx+1}`} style={{width:"100%",height:"160px",objectFit:"cover",display:"block"}}/>
              </div>
            )
          }
          const safeHref = renderSafeUrl(item.url)
          if (!safeHref) return null
          return (
            <a key={`l${i}`} href={safeHref} target="_blank" rel="noreferrer" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"160px",borderRadius:"8px",background:"var(--color-background-tertiary)",textDecoration:"none",gap:"8px",border:"1px solid var(--color-border-tertiary)"}}>
              <span style={{fontSize:"24px"}}>🔗</span>
              <span style={{fontSize:"12px",color:"var(--color-text-info)"}}>Watch campaign →</span>
            </a>
          )
        })}
      </div>
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
  // unlocked + passIn are the admin-token UI state. On mount we
  // optimistically mark unlocked when localStorage already has a token —
  // the first admin mutation will 401 + clear if the server rotated.
  const [unlocked, setUnlocked] = useState(() => !!getAdminToken())
  const [passIn,   setPassIn]   = useState("")
  const [adminErr, setAdminErr] = useState("")

  // Verify a candidate token against /api/admin/verify. Stores on
  // success (204), surfaces a message on 401 or 503 (the latter means
  // ADMIN_TOKEN env var isn't set on the server — different fix).
  const tryUnlock = async () => {
    setAdminErr("")
    const candidate = passIn.trim()
    if (!candidate) { setAdminErr("Enter a token."); return }
    try {
      const r = await fetch("/api/admin/verify", { headers: { "X-Admin-Token": candidate } })
      if (r.status === 204) {
        setAdminToken(candidate)
        setUnlocked(true)
        setPassIn("")
        return
      }
      if (r.status === 503) { setAdminErr("Admin operations are disabled on this deployment (ADMIN_TOKEN unset)."); return }
      setAdminErr("Wrong token.")
    } catch (err) {
      setAdminErr("Could not reach the server.")
      console.error("[admin] verify failed:", err)
    }
  }
  const [newC,     setNewC]     = useState({brand:"",campaign:"",year:"2024",territory:"brand",platform:"",agency:"",stat:"",note:"",scoring:"",link:"",imageUrl:"",videoUrl:"",quality:"strong"})
  const [narrativConcept, setNarrativConcept] = useState(null)
  const [tasteWide, setTasteWide] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 820px)").matches)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 820px)")
    const fn = e => setTasteWide(e.matches)
    mq.addEventListener("change", fn)
    return () => mq.removeEventListener("change", fn)
  }, [])

  useEffect(()=>{
    // Parse Narrativ handoff params
    const params = new URLSearchParams(window.location.search)
    if (params.get("source") === "narrativ") {
      const concept = {
        sessionId: params.get("session_id") || "",
        title: params.get("concept") || "Untitled Concept",
        statement: params.get("statement") || "",
        audience: params.get("audience") || "",
        hypotheses: (() => { try { return JSON.parse(params.get("hypotheses") || "[]") } catch { return [] } })(),
      }
      setNarrativConcept(concept)
      // Clean URL without reloading
      window.history.replaceState({}, "", window.location.pathname)
    }

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
            // If arriving from Narrativ, show the narrativ screen instead
            if (params.get("source") === "narrativ") setScreen("narrativ")
            else setScreen(first === -1 ? "complete" : "scoring")
          } catch { localStorage.removeItem("rs_scorer_id"); setScreen(params.get("source") === "narrativ" ? "narrativ" : "welcome") }
        } else { setScreen(params.get("source") === "narrativ" ? "narrativ" : "welcome") }
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

  const viewTaste = async () => {
    try {
      const data = await api("/api/team")
      setTeamData(data)
    } catch { /* keep stale or empty teamData */ }
    setScreen("taste")
  }

  const updateMedia = async (id, images, videoUrl) => {
    const imageUrl = images.length ? images[0] : ""
    const u = camps.map(c => c.id===id ? {...c, imageUrl, images, videoUrl} : c)
    setCamps(u)
    try {
      await adminApi(`/api/campaigns/${id}/media`, { method:"PUT", body:JSON.stringify({ imageUrl, images, videoUrl }) })
    } catch (err) {
      if (err?.status === 401) { setAdminToken(""); setUnlocked(false); alert("Admin session expired. Please unlock again.") }
      else { console.error("[admin] updateMedia failed:", err) }
    }
  }

  const addCamp = async () => {
    if (!newC.brand.trim() || !newC.campaign.trim()) return
    const camp = {...newC, id:`c_${Date.now()}`}
    setCamps([...camps, camp])
    try {
      await adminApi("/api/campaigns", { method:"POST", body:JSON.stringify(camp) })
      setNewC({brand:"",campaign:"",year:"2024",territory:"brand",platform:"",agency:"",stat:"",note:"",scoring:"",link:"",imageUrl:"",videoUrl:"",quality:"strong"})
    } catch (err) {
      if (err?.status === 401) { setAdminToken(""); setUnlocked(false); alert("Admin session expired. Please unlock again.") }
      else { console.error("[admin] addCamp failed:", err) }
    }
  }

  const camp = camps.find(c => c.id === order[idx])
  const scored = Object.keys(scores).length
  const pct = order.length ? Math.round(scored/order.length*100) : 0
  const unscored = order.filter(id => !scores[id]).length

  // ── LOADING ──
  if (screen==="loading") return (
    <div style={{...css.page,display:"flex",alignItems:"center",justifyContent:"center",height:"200px"}}>
      <span style={{fontSize:"13px",color:"var(--color-text-tertiary)"}}>Loading Ralph Score…</span>
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
        <div style={css.hdr}>Ralph Score</div>
        <div style={css.sub}>Watch and score {camps.length} standout campaigns from the last few years — deliberately none of them ours. The exercise is two-fold: <strong>capture what Ralph thinks is good and what isn't</strong> across idea, culture, craft, brand and share, and <strong>broaden the team's view of standout work</strong> in the wider industry. Watch the case film, score it, leave a note on what made it land or fall flat. Your scores stack with everyone else's into Ralph's shared definition of great creative.</div>
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

  // ── NARRATIV HANDOFF ──
  if (screen==="narrativ" && narrativConcept) {
    const startNarrativTest = async () => {
      if ((!profile && !nameIn.trim()) || !roleIn) return
      let p = profile
      if (!p) {
        p = await api("/api/profile", { method:"POST", body:JSON.stringify({ name:nameIn.trim(), role:roleIn }) })
        setProfile(p); localStorage.setItem("rs_scorer_id", p.id)
      }

      // Create the Narrativ concept as a campaign in Voices
      const { campaign } = await api("/api/campaigns/from-narrativ", {
        method: "POST",
        body: JSON.stringify({
          session_id: narrativConcept.sessionId,
          concept: narrativConcept.title,
          statement: narrativConcept.statement,
          audience: narrativConcept.audience,
          hypotheses: narrativConcept.hypotheses,
        }),
      })

      // Refresh campaigns list with the new concept
      const updatedCamps = await api("/api/campaigns")
      if (Array.isArray(updatedCamps)) setCamps(updatedCamps)

      const existingScores = await api(`/api/scores/${p.id}`)
      setScores(existingScores)

      // Put the Narrativ concept first, then shuffle the rest
      const conceptId = campaign.id
      const otherIds = (updatedCamps || camps).map(c => c.id).filter(id => id !== conceptId)
      const o = [conceptId, ...shuffle(otherIds)]
      setOrder(o); localStorage.setItem("rs_order", JSON.stringify(o))
      setIdx(0) // Start with the Narrativ concept
      setScreen("scoring")
    }
    return (
      <div style={css.page}>
        <div style={{marginBottom:"8px"}}>
          <img src="/ralph-logo.png" alt="ralph" style={{height:"36px"}}/>
        </div>
        <div style={{marginBottom:"20px"}}>
          <div style={css.hdr}>From Narrativ</div>
          <div style={css.h1}>Score this concept</div>
          <div style={css.sub}>A concept has been sent from Narrativ for scoring. You'll score it first across the 5 dimensions, then continue with the Ralph Score campaign set. Select your persona to begin.</div>
        </div>

        {/* Concept card */}
        <div style={{...css.card,marginBottom:"16px",borderLeft:`3px solid ${PINK}`}}>
          <div style={css.body}>
            <div style={{...css.label,marginBottom:"4px"}}>Concept</div>
            <div style={{fontSize:"18px",fontWeight:"600",marginBottom:"10px",letterSpacing:"-0.01em"}}>{narrativConcept.title}</div>
            {narrativConcept.statement && <>
              <div style={{...css.label,marginBottom:"4px"}}>Statement</div>
              <div style={{...css.val,lineHeight:"1.7"}}>{narrativConcept.statement}</div>
            </>}
            {narrativConcept.audience && <>
              <div style={{...css.label,marginBottom:"4px"}}>Target audience</div>
              <div style={{...css.val}}>{narrativConcept.audience}</div>
            </>}
            {narrativConcept.hypotheses.length > 0 && <>
              <div style={{...css.label,marginBottom:"4px"}}>Testing hypotheses</div>
              {narrativConcept.hypotheses.map((h,i) => (
                <div key={i} style={{fontSize:"13px",color:"var(--color-text-secondary)",lineHeight:"1.6",paddingLeft:"12px",borderLeft:`2px solid ${PINK_SUBTLE}`,marginBottom:"6px"}}>{h}</div>
              ))}
            </>}
          </div>
        </div>

        {/* Quick persona selection */}
        <div style={css.card}>
          <div style={css.body}>
            {!profile && <div style={{marginBottom:"14px"}}>
              <div style={css.label}>Your name</div>
              <input style={css.inp} value={nameIn} onChange={e=>setNameIn(e.target.value)} placeholder="First name is fine"
                onKeyDown={e=>e.key==="Enter"&&startNarrativTest()}/>
            </div>}
            {profile && <div style={{fontSize:"13px",color:"var(--color-text-secondary)",marginBottom:"14px"}}>Scoring as <strong style={{color:"var(--color-text-primary)"}}>{profile.name}</strong></div>}
            <div style={{marginBottom:"16px"}}>
              <div style={css.label}>Your persona</div>
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
              <div style={{fontSize:"12px",color:"var(--color-text-tertiary)"}}>Concept + {camps.length} calibration campaigns</div>
              <button style={{...css.btnP,opacity:((!profile&&!nameIn.trim())||!roleIn)?.4:1}} disabled={(!profile&&!nameIn.trim())||!roleIn} onClick={startNarrativTest}>
                Score concept →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── SCORING ──
  if (screen==="scoring" && camp) return (
    <ScoreCard key={camp.id} camp={camp} existing={scores[camp.id]} idx={idx} total={order.length} pct={pct}
      scoredCount={scored}
      onSave={saveScore}
      onNext={() => { if (idx < order.length-1) setIdx(idx+1); else setScreen("review") }}
      onHome={() => setScreen("welcome")}
      onViewTaste={viewTaste}/>
  )

  // ── REVIEW ──
  if (screen==="review") return (
    <div style={css.page}>
      <div style={{marginBottom:"8px"}}>
        <img src="/ralph-logo.png" alt="ralph" style={{height:"36px"}}/>
      </div>
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
        {scored>0&&<button style={css.btnS} onClick={viewTaste}>✦ View your taste</button>}
      </div>
    </div>
  )

  // ── TASTE / COMPLETE (shared) ──
  if (screen==="taste" || screen==="complete") {
    const isComplete = screen==="complete"
    const userDims = {}
    DIMS.forEach(d => { userDims[d.id] = avg(Object.values(scores).map(s=>s.dims?.[d.id]).filter(v=>v!=null)) })
    const overall = avg(Object.values(userDims).filter(v=>v!=null))

    // Team aggregates per dimension across all team scores
    const teamDims = {}
    DIMS.forEach(d => {
      const all = []
      Object.values(teamData).forEach(scorer => {
        Object.values(scorer.scores || {}).forEach(s => { if (s.dims?.[d.id] != null) all.push(s.dims[d.id]) })
      })
      teamDims[d.id] = all.length ? avg(all) : null
    })
    const teamHasData = Object.values(teamDims).some(v => v != null)
    const otherScorerCount = Math.max(0, Object.keys(teamData).filter(id => id !== profile?.id).length)

    const topN = Math.min(5, scored)
    const top = camps.filter(c=>scores[c.id])
      .sort((a,b)=>(avg(Object.values(scores[b.id]?.dims||{})))-(avg(Object.values(scores[a.id]?.dims||{}))))
      .slice(0, topN)

    const isPreliminary = scored < 3
    const continueScoring = () => {
      const f = order.findIndex(id=>!scores[id])
      if (f >= 0) { setIdx(f); setScreen("scoring") }
    }
    const resumeAtCurrent = () => setScreen("scoring")

    // ── Persona & narrative insights ──
    const PERSONAS = {
      idea:     { title:"Originality-First",  line:"Bold, original ideas earn your top marks." },
      cultural: { title:"Zeitgeist Tracker",  line:"You reward work that catches the cultural moment." },
      craft:    { title:"Craft Devotee",      line:"Execution and craft are where you set the bar high." },
      brand:    { title:"Brand Purist",       line:"Distinctive brand presence is what wins you over." },
      share:    { title:"Virality Hunter",    line:"You back work people will actually pass on." },
    }
    // user's strongest dim relative to their own mean (so it's about *their* lean, not absolute scores)
    const dimVals = DIMS.map(d => ({ id:d.id, label:d.label, val:userDims[d.id] })).filter(x => x.val != null)
    const userMean = dimVals.length ? avg(dimVals.map(x=>x.val)) : null
    const ranked = dimVals.map(x => ({ ...x, rel: x.val - userMean })).sort((a,b)=>b.rel-a.rel)
    const topDim = ranked[0]
    const bottomDim = ranked[ranked.length-1]
    const persona = topDim && !isPreliminary ? PERSONAS[topDim.id] : null

    // Tough vs generous grader vs team
    const teamOverall = avg(Object.values(teamDims).filter(v=>v!=null))
    const graderDelta = (overall != null && teamOverall != null) ? (overall - teamOverall) : null
    const graderLabel = graderDelta == null ? null
      : graderDelta >= 0.3 ? "generous critic"
      : graderDelta <= -0.3 ? "tough grader"
      : "in line with the team"

    // Boldest take: campaign with biggest |user_avg - team_avg| where team has scored it
    let hotTake = null
    if (teamHasData) {
      camps.forEach(c => {
        const myS = scores[c.id]; if (!myS) return
        const my = avg(Object.values(myS.dims||{})); if (my == null) return
        const otherAvgs = Object.entries(teamData)
          .filter(([id]) => id !== profile?.id)
          .map(([,sc]) => sc.scores?.[c.id])
          .filter(Boolean)
          .map(s => avg(Object.values(s.dims||{})))
          .filter(v => v != null)
        if (otherAvgs.length === 0) return
        const tm = avg(otherAvgs)
        const d = Math.abs(my - tm)
        if (!hotTake || d > hotTake.delta) hotTake = { camp:c, my, tm, delta:d, direction: my > tm ? "above" : "below" }
      })
      if (hotTake && hotTake.delta < 0.8) hotTake = null
    }

    return (
      <div style={{...css.page, maxWidth: tasteWide ? "920px" : "640px"}}>
        <div style={{marginBottom:"8px"}}>
          <img src="/ralph-logo.png" alt="ralph" style={{height:"36px"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"12px",marginBottom:"20px"}}>
          <div>
            <div style={css.hdr}>{isComplete ? "Scoring complete" : "Your taste, taking shape"}</div>
            <div style={css.h1}>Your taste profile</div>
            <div style={css.sub}>{scored} of {order.length} scored · Average <strong>{overall ?? "–"}/5</strong></div>
          </div>
          <ProgressRing value={scored} total={order.length}/>
        </div>

        {/* Persona headline */}
        {persona ? (
          <div style={{...css.card, marginBottom:"16px", background:`linear-gradient(135deg, ${PINK_SUBTLE}, rgba(255,255,255,0.02))`, borderColor:`rgba(230,0,126,0.25)`}}>
            <div style={{...css.body, padding:"18px 20px"}}>
              <div style={{...css.hdr, marginBottom:"8px"}}>You're scoring like a</div>
              <div style={{fontSize:"28px",fontWeight:"700",letterSpacing:"-0.02em",lineHeight:"1.1",marginBottom:"6px"}}>{persona.title}</div>
              <div style={{fontSize:"13px",color:"var(--color-text-secondary)",lineHeight:"1.55"}}>{persona.line}</div>
            </div>
          </div>
        ) : (
          <div style={{...css.card, marginBottom:"16px"}}>
            <div style={{...css.body, padding:"16px 20px"}}>
              <div style={{fontSize:"14px",color:"var(--color-text-secondary)",lineHeight:"1.55"}}>
                Score a few more campaigns and we'll show you what kind of scorer you are.
              </div>
            </div>
          </div>
        )}

        {/* Radar + narrative insights */}
        <div style={tasteWide ? {display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",alignItems:"stretch",marginBottom:"16px"} : {marginBottom:"16px"}}>
          {/* Radar */}
          <div style={{...css.card, marginBottom: tasteWide ? 0 : "16px"}}>
            <div style={{...css.body,paddingBottom:"8px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
                <div style={css.label}>Taste shape</div>
                {teamHasData && otherScorerCount>0 && (
                  <div style={{display:"flex",gap:"12px",fontSize:"10px",color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600}}>
                    <span style={{display:"flex",alignItems:"center",gap:"5px"}}><span style={{width:"10px",height:"2px",background:PINK,borderRadius:"1px"}}/>You</span>
                    <span style={{display:"flex",alignItems:"center",gap:"5px"}}><span style={{width:"10px",height:"0",borderTop:"2px dashed rgba(255,255,255,0.5)"}}/>Team</span>
                  </div>
                )}
              </div>
              <Radar user={userDims} team={teamDims} showTeam={teamHasData} size={tasteWide ? 240 : 260}/>
              {isPreliminary && (
                <div style={{textAlign:"center",fontSize:"11px",color:"var(--color-text-tertiary)",marginTop:"4px",fontStyle:"italic"}}>
                  Preliminary — shape sharpens as you score more.
                </div>
              )}
            </div>
          </div>

          {/* Narrative insights — what the radar means */}
          <div style={css.card}>
            <div style={{...css.body, display:"flex", flexDirection:"column", gap:"14px"}}>
              <div style={css.label}>What this says about you</div>
              {topDim && (
                <div>
                  <div style={{fontSize:"11px",color:PINK,fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"3px"}}>You reward most</div>
                  <div style={{fontSize:"15px",fontWeight:"600",marginBottom:"2px"}}>{topDim.label} · {topDim.val?.toFixed(1)}</div>
                  {teamDims[topDim.id] != null && (() => {
                    const diff = topDim.val - teamDims[topDim.id]
                    return (
                      <div style={{fontSize:"12px",color:"var(--color-text-secondary)",lineHeight:"1.5"}}>
                        {diff >= 0.3
                          ? `${diff.toFixed(1)} above the team's ${teamDims[topDim.id].toFixed(1)} — you hold this to a higher bar.`
                          : diff <= -0.3
                          ? `Team gives it ${teamDims[topDim.id].toFixed(1)} — they value this even more than you.`
                          : `Team avg ${teamDims[topDim.id].toFixed(1)} — close to the room.`}
                      </div>
                    )
                  })()}
                </div>
              )}
              {bottomDim && bottomDim.id !== topDim?.id && (
                <div>
                  <div style={{fontSize:"11px",color:"var(--color-text-tertiary)",fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"3px"}}>You're hardest on</div>
                  <div style={{fontSize:"15px",fontWeight:"600",marginBottom:"2px"}}>{bottomDim.label} · {bottomDim.val?.toFixed(1)}</div>
                  {teamDims[bottomDim.id] != null && (
                    <div style={{fontSize:"12px",color:"var(--color-text-secondary)",lineHeight:"1.5"}}>
                      Team gives it {teamDims[bottomDim.id].toFixed(1)}{bottomDim.val < teamDims[bottomDim.id] ? " — you push back here." : "."}
                    </div>
                  )}
                </div>
              )}
              {graderLabel && (
                <div>
                  <div style={{fontSize:"11px",color:"var(--color-text-tertiary)",fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"3px"}}>Compared to the team</div>
                  <div style={{fontSize:"13px",lineHeight:"1.55"}}>You're a <strong>{graderLabel}</strong> — your average <strong>{overall}</strong> vs the team's {teamOverall?.toFixed(1)}.</div>
                </div>
              )}
              {hotTake && (
                <div style={{paddingTop:"4px",borderTop:"1px solid var(--color-border-tertiary)"}}>
                  <div style={{fontSize:"11px",color:PINK,fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"3px",marginTop:"6px"}}>Your boldest call</div>
                  <div style={{fontSize:"13px",lineHeight:"1.55"}}>You scored <strong>{hotTake.camp.brand}</strong> at <strong>{hotTake.my.toFixed(1)}</strong>. The team: {hotTake.tm.toFixed(1)}.</div>
                </div>
              )}
              {!topDim && !graderLabel && !hotTake && (
                <div style={{fontSize:"13px",color:"var(--color-text-secondary)",lineHeight:"1.55"}}>
                  Insights will appear here as you score more campaigns.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Per-dim numeric breakdown */}
        <div style={{...css.card,marginBottom:"20px"}}>
          <div style={css.body}>
            <div style={css.label}>By dimension</div>
            {DIMS.map(d=>{
              const u = userDims[d.id]; const t = teamDims[d.id]
              return (
                <div key={d.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"12px"}}>
                  <div style={{fontSize:"13px",color:"var(--color-text-secondary)"}}>{d.label}</div>
                  <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                    <div style={{position:"relative",width:"90px",height:"3px",background:"var(--color-border-tertiary)",borderRadius:"2px"}}>
                      <div style={{width:`${((u||0)/5)*100}%`,height:"3px",background:PINK,borderRadius:"2px"}}/>
                      {t != null && (
                        <div title={`Team ${t}`} style={{position:"absolute",top:"-3px",left:`calc(${(t/5)*100}% - 1px)`,width:"2px",height:"9px",background:"rgba(255,255,255,0.6)",borderRadius:"1px"}}/>
                      )}
                    </div>
                    <span style={{...css.score,fontSize:"16px",minWidth:"28px",textAlign:"right"}}>{u ?? "-"}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {top.length > 0 && <>
          <div style={css.label}>Your top {top.length}</div>
          {top.map((c,i)=>{
            const a = avg(Object.values(scores[c.id]?.dims||{}))
            return (
              <div key={c.id} style={{...css.card,cursor:"pointer"}} onClick={()=>{ const oi=order.indexOf(c.id); if(oi>=0){setIdx(oi);setScreen("scoring")} }}>
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
        </>}

        <div style={{display:"flex",gap:"10px",marginTop:"24px",flexWrap:"wrap"}}>
          {isComplete ? (
            <>
              <button style={css.btnP} onClick={loadTeam}>See team scores</button>
              {unscored>0 && <button style={css.btnS} onClick={continueScoring}>Score {unscored} more</button>}
              <button style={css.btnS} onClick={()=>setScreen("admin")}>Admin</button>
            </>
          ) : (
            <>
              {unscored>0
                ? <button style={css.btnP} onClick={camp ? resumeAtCurrent : continueScoring}>← Continue scoring</button>
                : <button style={css.btnP} onClick={()=>setScreen("review")}>Review & submit →</button>}
              {teamHasData && otherScorerCount>0 && <button style={css.btnS} onClick={loadTeam}>See team scores</button>}
            </>
          )}
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
        <div style={{marginBottom:"8px"}}>
          <img src="/ralph-logo.png" alt="ralph" style={{height:"36px"}}/>
        </div>
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
      <div style={{marginBottom:"8px"}}>
        <img src="/ralph-logo.png" alt="ralph" style={{height:"36px"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
        <div style={css.h2}>Admin</div>
        <button style={css.btnS} onClick={()=>setScreen(profile?"complete":"welcome")}>← Back</button>
      </div>
      {!unlocked ? (
        <div style={css.card}>
          <div style={css.body}>
            <div style={css.label}>Admin token</div>
            <div style={{display:"flex",gap:"8px",marginTop:"4px"}}>
              <input type="password" style={{...css.inp,flex:1}} value={passIn} onChange={e=>setPassIn(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&tryUnlock()} placeholder="Enter admin token"/>
              <button style={css.btnP} onClick={tryUnlock}>Unlock</button>
            </div>
            <div style={{fontSize:"11px",color:"var(--color-text-tertiary)",marginTop:"8px"}}>
              Server-side ADMIN_TOKEN required. Ask Brook for the current value.
            </div>
            {adminErr && (
              <div style={{fontSize:"12px",color:"#E85656",marginTop:"8px"}}>{adminErr}</div>
            )}
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
                <div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"6px"}}>
                  <button style={{...css.btnS,padding:"6px 10px",fontSize:"11px"}} onClick={()=>{ if(!order.length){const o=camps.map(x=>x.id);setOrder(o)} const oi=(order.length?order:camps.map(x=>x.id)).indexOf(c.id); if(oi>=0){setIdx(oi);setScreen("scoring")} }}>Preview scoring →</button>
                </div>
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

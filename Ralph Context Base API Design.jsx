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

const DEFAULTS = [
  {id:"c01",brand:"Spotify",campaign:"Wrapped",year:"2022–23",quality:"anchor",territory:"brand",platform:"Social, app",agency:"In-house (Spotify Studios)",stat:"60M+ social shares in 2022. Users become brand ambassadors. Zero paid media required.",note:"Annual personalised data roundup that turns every user into an organic brand ambassador across every social platform.",scoring:"Does making users the medium count as creative excellence — or is this a data product masquerading as a campaign?",link:"https://youtu.be/Yjkp_ckQMmc",imageUrl:null},
  {id:"c02",brand:"CeraVe",campaign:"Michael CeraVe",year:"2024",quality:"anchor",territory:"social",platform:"TikTok, earned, Super Bowl",agency:"Ogilvy PR New York",stat:"15.4B earned impressions before Super Bowl day. 450 influencers. +25% sales. #1 ranked SB campaign across Adweek, AdAge, Forbes.",note:"A 4-week manufactured conspiracy theory — seeded via 450 influencers — that CeraVe was founded by Michael Cera, debunked live on Super Bowl Sunday.",scoring:"Is a 4-week manufactured conspiracy theory the pinnacle of earned-first thinking — or an expensive illusion of authenticity?",link:"https://youtu.be/zL3MJnfGMK0",imageUrl:null},
  {id:"c03",brand:"Dove",campaign:"Cost of Beauty",year:"2023",quality:"anchor",territory:"purpose",platform:"Film, social",agency:"Ogilvy UK & Ogilvy Toronto",stat:"19M+ views. 5B earned impressions. 95K+ petition signatures for the Kids Online Safety Act.",note:"A film built entirely from a real girl's own diary entries, photos and videos documenting her eating disorder triggered by social media beauty content.",scoring:"When a brand uses a real person's trauma to drive legislation and sell soap — does the scale of impact justify the premise?",link:"https://youtu.be/GkAJDqJSQzo",imageUrl:null},
  {id:"c04",brand:"Barbie (Mattel/WB)",campaign:"Barbie Movie",year:"2023",quality:"anchor",territory:"collab",platform:"OOH, social, earned, AR",agency:"Warner Bros. in-house + multiple partners",stat:"$155M opening weekend. Brand revenue +60% to $314.5M. AI selfie generator drove millions in organic reach.",note:"Total cultural saturation — pink OOH takeover, AI selfie generator, brand collabs with 100+ partners — tied to the Greta Gerwig film.",scoring:"Is total cultural saturation a creative achievement — or what happens when you spend $150M on IP everyone already loves?",link:"https://youtu.be/pBk4NYhWNMM",imageUrl:null},
  {id:"c05",brand:"Xbox",campaign:"Everyday Tactician",year:"2023–24",quality:"anchor",territory:"collab",platform:"Earned, documentary, social",agency:"McCann London",stat:"1.5B impressions. 190% increase in FM players on Xbox. Bromley FC won promotion to EFL. Titanium + 2 Grand Prix at Cannes.",note:"Xbox hired a Football Manager player as a real-life tactician at Bromley FC. The journey became a 3-part TNT Sports documentary.",scoring:"The campaign only truly worked because the real-world outcome was extraordinary. Does luck disqualify great creative?",link:"https://youtu.be/0sVJaKoZpIM",imageUrl:null},
  {id:"c06",brand:"Coca-Cola",campaign:"Recycle Me",year:"2024",quality:"anchor",territory:"purpose",platform:"OOH, print",agency:"Ogilvy New York",stat:"Cannes Grand Prix Print & Publishing. Zero media spend — the crushed cans were the media.",note:"Coke crushed its own signature red cans into misshapen forms to promote recycling. The deformed logo became the message.",scoring:"Is a brilliantly simple visual idea about sustainability more honest than a purpose film — or just easier to make?",link:"https://www.adsoftheworld.com/campaigns/recycle-me",imageUrl:null},
  {id:"c07",brand:"Specsavers",campaign:"The Misheard Version",year:"2023–24",quality:"anchor",territory:"brand",platform:"Radio, audio, social",agency:"Golin London",stat:"20M organic plays in 8 hours. 1,220% hearing test bookings above target. Zero paid media. Double Cannes Grand Prix.",note:"Rick Astley re-recorded Never Gonna Give You Up with famously misheard lyrics and released it without branding — a hearing test disguised as a Rick-Roll.",scoring:"The most awarded campaign in this set — but it only works in the UK, with Rick Astley. Does cultural specificity limit creative greatness?",link:"https://youtu.be/M7XBB0bD3TQ",imageUrl:null},
  {id:"c08",brand:"Heinz x Absolut",campaign:"Tomato Vodka Pasta Sauce",year:"2023",quality:"strong",territory:"collab",platform:"OOH, social, retail",agency:"Wunderman Thompson Spain",stat:"500M earned impressions. 52% sales uplift across pasta range. Sold out within days. Jars on eBay at 10x RRP.",note:"Limited-edition vodka pasta sauce born from the TikTok penne alla vodka trend. Campaign homaged classic 1980s Absolut print ads.",scoring:"When a collab is this culturally inevitable — is finding the inevitability the craft, or just not messing it up?",link:"https://youtu.be/0DkJwwDh6s8",imageUrl:null},
  {id:"c09",brand:"Burger King",campaign:"Whopper Whopper jingle",year:"2022–23",quality:"strong",territory:"brand",platform:"TV, TikTok, NFL",agency:"OKRP",stat:"1B+ social impressions. 985M TikTok views. 12,000 UGC pieces. Released on Spotify, reached 3.3M streams.",note:"A deceptively simple jingle breaking down the Whopper's ingredients went viral through NFL media buys. The BK president publicly hated it before launch.",scoring:"The BK president admitted he hated the jingle before launch. Does creative instinct beat client instinct — or did the audience prove him wrong?",link:"https://youtu.be/fNRN1j8jqSM",imageUrl:null},
  {id:"c10",brand:"Dunkin'",campaign:"Ben Affleck / Matt Damon",year:"2023",quality:"strong",territory:"brand",platform:"TV, social",agency:"Artists Equity",stat:"One of the most talked-about Super Bowl spots of 2023. Launched a formal production partnership with Affleck's company.",note:"Ben Affleck directed himself in a Dunkin' ad, leaning entirely into existing Boston-native memes — then returned with Matt Damon.",scoring:"Does a celebrity partnership that leans entirely into existing memes represent genuine creative strategy — or spending your way to authenticity?",link:"https://youtu.be/QliMiL0P4EM",imageUrl:null},
  {id:"c11",brand:"Airbnb",campaign:"Icons",year:"2024",quality:"strong",territory:"collab",platform:"Social, earned, PR",agency:"In-house (Airbnb)",stat:"Polly Pocket house, X-Mansion, Up house. Each experience generated global earned media at scale.",note:"Branded experiences in cultural locations — designed entirely as a marketing vehicle, not a product feature. The product is the press release.",scoring:"Experiences engineered as press releases — is this the future of brand marketing, or expensive stunts with an Instagram filter?",link:"https://youtu.be/Yk2O_BOtxFI",imageUrl:null},
  {id:"c12",brand:"McDonald's",campaign:"As Featured In",year:"2024",quality:"strong",territory:"brand",platform:"Social, in-store, Snapchat AR",agency:"Wieden+Kennedy",stat:"45 years of pop culture curated. QR on Loki sauce unlocked Marvel AR. Broad UGC engagement.",note:"McDonald's compiled 45 years of film and TV appearances — Space Jam, Richie Rich, The Fifth Element — into a limited-edition menu and AR experience.",scoring:"When you're so embedded in culture you can just curate proof — is that a creative strategy or an archive?",link:"https://youtu.be/4I9vEy5WMxA",imageUrl:null},
  {id:"c13",brand:"Gap",campaign:"Get Loose (Troye Sivan)",year:"2024",quality:"strong",territory:"social",platform:"TikTok, OOH, digital",agency:"Invisible Dynamics + Buttermilk",stat:"55M+ TikTok views. 100K+ #GetLoose videos. Gap's head of marketing said they needed to 'one-up' their most successful campaign to date.",note:"Troye Sivan + CDK Company dance to a viral Thundercat track in baggy denim. Choreographed by the director of Sivan's own music videos.",scoring:"Is fashion-as-entertainment a genuine creative territory — or a formula that only works until the next brand copies it?",link:"https://www.tiktok.com/@gap/video/7405582193751231786",imageUrl:null},
  {id:"c14",brand:"Heinz",campaign:"Ketchup and Seemingly Ranch",year:"2023",quality:"strong",territory:"social",platform:"Social, earned",agency:"In-house reactive",stat:"New product concept developed and announced within 24 hours of Taylor Swift's condiment tweet going viral.",note:"Taylor Swift photographed eating chicken with ketchup and ranch. Heinz announced 'Ketchup and Seemingly Ranch' before the news cycle moved on.",scoring:"Reactive marketing this fast is genuinely rare — but does speed of execution make it creative, or just competent?",link:"https://www.instagram.com/p/CyFmqPILsSY/",imageUrl:null},
  {id:"c15",brand:"Chili's",campaign:"Big Smasher BurgerTime",year:"2024",quality:"strong",territory:"product",platform:"Gaming, TV, social",agency:"Mischief @ No Fixed Address",stat:"Turned a retro arcade game into a direct attack on McDonald's and BK value perception. Made Chili's one of the top-discussed QSR brands of 2024.",note:"Chili's revived the 1982 arcade BurgerTime — rebranded as Big Smasher — to attack fast-food value messaging in a media format competitors couldn't copy.",scoring:"Picking a cultural fight using a 1980s arcade game — clever disruption, or does it only work because Chili's had nothing to lose?",link:"https://youtu.be/EqKtfA1o4M4",imageUrl:null},
  {id:"c16",brand:"Heineken",campaign:"The Boring Phone",year:"2024",quality:"strong",territory:"product",platform:"Social, PR, events",agency:"LePub Milan",stat:"Collab with streetwear brand Bodega. Generated global earned media as a cultural object. Multiple award show shortlists.",note:"Heineken released a functional phone — with streetwear brand Bodega — that only makes calls and texts. A product launch as brand philosophy.",scoring:"A beer brand making a functional product to sell the experience of drinking beer — most sophisticated brand logic in the set, or an overengineered stunt?",link:"https://youtu.be/2gQWlWk_b8o",imageUrl:null},
  {id:"c17",brand:"Visit Oslo",campaign:"Worst of Oslo",year:"2023–24",quality:"strong",territory:"brand",platform:"Social, OOH",agency:"TRY Oslo",stat:"Went globally viral. Reverse psychology that drove a significant spike in destination interest.",note:"A self-deprecating tourism campaign that openly questioned whether Oslo was worth visiting — and in doing so made the world want to go.",scoring:"Self-deprecating brand voice is either the most confident creative move or the laziest. Where does this one land?",link:"https://youtu.be/lVRb7uyEDRI",imageUrl:null},
  {id:"c18",brand:"Netflix",campaign:"Wednesday Addams social",year:"2022",quality:"strong",territory:"social",platform:"TikTok, Twitter/X",agency:"In-house Netflix social",stat:"Contributed to 1.2B viewing hours in 28 days. Character account stayed fully in voice throughout.",note:"Netflix ran Wednesday Addams as a real in-character social account — never broke the fourth wall — throughout the show's cultural peak.",scoring:"A social character that stayed fully in voice — is this creative excellence or just good brand governance?",link:"https://twitter.com/wednesdayaddams",imageUrl:null},
  {id:"c19",brand:"E.l.f. Cosmetics",campaign:"So Many Dicks",year:"2024",quality:"divisive",territory:"purpose",platform:"OOH, social, earned",agency:"Oberland",stat:"OOH placed in NYC's Financial District. Follow-up 'Dupe That!' generated 99% positive sentiment.",note:"Called out the number of men named Richard on US corporate boards — roughly equal to women from diverse groups — with blunt NYC Financial District OOH.",scoring:"Purpose work that names names and picks a real fight — genuine advocacy or performance activism in a market that rewards boldness?",link:"https://youtu.be/XzGBVy5KWCU",imageUrl:null},
  {id:"c20",brand:"Liquid Death",campaign:"Rebel Moon spoof ads",year:"2023",quality:"divisive",territory:"brand",platform:"YouTube, social",agency:"In-house Liquid Death",stat:"3.6M views. Spoofed traditional patriotic beer advertising in partnership with Netflix's Rebel Moon.",note:"Satirical spoof ads mocking traditional American beer advertising — Liquid Death's ongoing anti-advertising brand philosophy made into content.",scoring:"Liquid Death's brand is built on anti-advertising. Does that make every campaign they do inherently meta — or inherently hollow?",link:"https://youtu.be/2Kj5XaFVFTQ",imageUrl:null},
  {id:"c21",brand:"Bud Light",campaign:"Dylan Mulvaney partnership",year:"2023",quality:"divisive",territory:"brand",platform:"Instagram, social",agency:"In-house activation",stat:"Sales down 25%. Lost #1 US beer position after 20+ years. $1.4B+ revenue impact. Brand then abandoned the stance under pressure.",note:"A commemorative can sent to trans influencer Dylan Mulvaney triggered a boycott. The brand then failed to defend the decision — angering both sides.",scoring:"The brand took a values stance, got backlash, then abandoned it. Which decision was the bigger brand crime?",link:"https://www.instagram.com/p/Cqin8VVLmcD/",imageUrl:null},
  {id:"c22",brand:"Nike",campaign:"What the Football",year:"2023–24",quality:"divisive",territory:"purpose",platform:"Film, social",agency:"Wieden+Kennedy",stat:"Timed to Women's World Cup. Strong earned coverage. Divided opinion on Nike's values credibility post-athlete disputes.",note:"An emotional father-daughter film about women's football — released as Nike faced scrutiny over its treatment of female athletes.",scoring:"Nike keeps making emotional films about women in sport while settling lawsuits about treatment of female athletes. Does that undermine the work?",link:"https://youtu.be/E5LQHBpKMdg",imageUrl:null},
  {id:"c23",brand:"Duolingo",campaign:"Duo's death stunt",year:"2024",quality:"divisive",territory:"social",platform:"TikTok, social",agency:"In-house Duolingo social",stat:"Killing the mascot drove a massive social spike. One of the most-studied TikTok brand character strategies in the industry.",note:"Duolingo killed off its owl mascot on TikTok ahead of the Super Bowl to drive engagement — then brought it back. Part of an ongoing character-led strategy.",scoring:"Duolingo's social team is the most cited TikTok brand character example. Is killing your mascot for engagement confidence or desperation?",link:"https://www.tiktok.com/@duolingo",imageUrl:null},
  {id:"c24",brand:"CALM",campaign:"Missed Birthdays",year:"2024",quality:"divisive",territory:"purpose",platform:"OOH installation, PR",agency:"Adam&EveDDB",stat:"6,929 balloons in Westfield London — one per young person lost to suicide in the previous year.",note:"6,929 birthday balloons installed in Westfield London shopping centre, each representing a young person lost to suicide that year.",scoring:"There is a line between powerful and traumatising in mental health advertising. Did this cross it — and does it matter if it drove action?",link:"https://youtu.be/E8qQUxcUoI0",imageUrl:null},
  {id:"c25",brand:"IKEA",campaign:"No Place Like Home",year:"2024",quality:"divisive",territory:"purpose",platform:"OOH, social, PR",agency:"IKEA in-house + Save the Children",stat:"Cannes Creative Strategy Gold. Spotlighted 120,000+ Australians made homeless by domestic violence.",note:"IKEA used its catalogue aesthetic to depict the actual spaces that domestic violence survivors were living in after being forced from their homes.",scoring:"Using a furniture catalogue aesthetic to represent DV homelessness — creative contrast or tonal exploitation?",link:"https://youtu.be/vgqGXvhJ0bE",imageUrl:null},
  {id:"c26",brand:"Bumble",campaign:"It Starts With Hello",year:"2024",quality:"divisive",territory:"brand",platform:"OOH, social, film",agency:"In-house + partners",stat:"Recovered from 2023 'be single' backlash via Amelia Dimoldenberg partnership. Divided on whether brand values pivots can be credible.",note:"After a 2023 campaign criticised as anti-dating, Bumble publicly reversed — partnering with Chicken Shop Date's Amelia Dimoldenberg.",scoring:"When a brand publicly reverses a creative position after backlash — is that listening to the audience or capitulating to it?",link:"https://youtu.be/XQb4sqy4JHI",imageUrl:null},
  {id:"c27",brand:"State Farm",campaign:"Jake and the Kelces",year:"2023",quality:"middling",territory:"collab",platform:"TV, social",agency:"DDB Chicago + Maximum Effort",stat:"Viral moment. Perfect timing. Said nothing ownable about State Farm.",note:"Jake from State Farm sat with Travis Kelce's mother during an Eagles game, recreating Taylor Swift moments — timed to peak Kelce/Swift cultural saturation.",scoring:"This worked entirely because of timing and cultural luck. Is reactive opportunism a creative skill — or just being in the right room?",link:"https://youtu.be/cVVFl0KdYJo",imageUrl:null},
  {id:"c28",brand:"Starbucks",campaign:"Pumpkin Spice Latte (annual)",year:"2022–24",quality:"middling",territory:"product",platform:"Social, in-store",agency:"In-house + BBDO",stat:"PSL generates ~$1.4B annually. 'PSL' is a cultural shorthand. Same formula for 20+ years.",note:"The original seasonal social campaign — launching the same product every August with minor variations for over 20 years, building an indestructible ritual.",scoring:"Is building an indestructible seasonal ritual the most sustainable brand creative achievement — or proof that the best marketing sometimes needs no ideas at all?",link:"https://youtu.be/nH-mxgCQSQY",imageUrl:null},
]

// --- storage helpers ---
const sg = async k => { try { const r = await window.storage.get(k, true);  return r ? JSON.parse(r.value) : null } catch { return null } }
const ss = async (k, v) => { try { await window.storage.set(k, JSON.stringify(v), true)  } catch {} }
const pg = async k => { try { const r = await window.storage.get(k, false); return r ? JSON.parse(r.value) : null } catch { return null } }
const ps = async (k, v) => { try { await window.storage.set(k, JSON.stringify(v), false) } catch {} }
const shuffle = a => { const b = [...a]; for (let i = b.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]] } return b }
const avg = vals => { const v = vals.filter(x => x != null && !isNaN(x)); return v.length ? Math.round((v.reduce((a,b)=>a+b,0)/v.length)*10)/10 : null }
const ytId = url => { if (!url) return null; const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/); return m?m[1]:null }
const ytThumb = id => `https://img.youtube.com/vi/${id}/hqdefault.jpg`

// --- styles ---
const css = {
  page:   { fontFamily:"var(--font-sans)", padding:"0 0 40px", color:"var(--color-text-primary)" },
  hdr:    { fontSize:"11px", fontWeight:"500", textTransform:"uppercase", letterSpacing:".06em", color:"var(--color-text-tertiary)", marginBottom:"6px" },
  h1:     { fontSize:"22px", fontWeight:"500", marginBottom:"4px" },
  h2:     { fontSize:"16px", fontWeight:"500", marginBottom:"12px" },
  sub:    { fontSize:"14px", color:"var(--color-text-secondary)", lineHeight:"1.6", marginBottom:"16px" },
  card:   { background:"var(--color-background-secondary)", border:"1px solid var(--color-border-tertiary)", borderRadius:"12px", overflow:"hidden", marginBottom:"10px" },
  body:   { padding:"16px" },
  label:  { fontSize:"10px", fontWeight:"500", textTransform:"uppercase", letterSpacing:".05em", color:"var(--color-text-tertiary)", marginBottom:"4px" },
  val:    { fontSize:"13px", color:"var(--color-text-secondary)", lineHeight:"1.6", marginBottom:"12px" },
  prompt: { fontSize:"14px", fontStyle:"italic", color:"var(--color-text-primary)", lineHeight:"1.65", padding:"14px 16px", background:"var(--color-background-primary)", borderRadius:"8px", borderLeft:"3px solid var(--color-text-primary)", marginBottom:"0" },
  inp:    { width:"100%", padding:"10px 12px", border:"1px solid var(--color-border-tertiary)", borderRadius:"8px", fontSize:"13px", background:"var(--color-background-secondary)", color:"var(--color-text-primary)", fontFamily:"var(--font-sans)", boxSizing:"border-box" },
  btnP:   { background:"var(--color-text-primary)", color:"var(--color-background-primary)", border:"none", borderRadius:"8px", padding:"10px 20px", fontSize:"13px", cursor:"pointer", fontFamily:"var(--font-sans)", fontWeight:"500" },
  btnS:   { background:"transparent", color:"var(--color-text-secondary)", border:"1px solid var(--color-border-secondary)", borderRadius:"8px", padding:"10px 16px", fontSize:"13px", cursor:"pointer", fontFamily:"var(--font-sans)" },
  tag:    { display:"inline-block", fontSize:"11px", padding:"2px 8px", borderRadius:"8px", background:"var(--color-background-tertiary)", color:"var(--color-text-secondary)", border:"1px solid var(--color-border-tertiary)", marginRight:"4px", marginBottom:"4px" },
  prog:   { height:"2px", background:"var(--color-border-tertiary)", borderRadius:"1px", margin:"0 0 16px" },
  bar:    { height:"2px", background:"var(--color-text-primary)", borderRadius:"1px", transition:"width .4s" },
  dimRow: { marginBottom:"18px" },
  dimBtns:{ display:"flex", gap:"6px", marginTop:"6px" },
  dimBtn: { flex:1, padding:"10px 0", border:"1px solid var(--color-border-tertiary)", borderRadius:"6px", background:"var(--color-background-secondary)", color:"var(--color-text-secondary)", fontSize:"15px", fontWeight:"500", cursor:"pointer", fontFamily:"var(--font-mono)", transition:"all .1s" },
  dimBtnA:{ background:"var(--color-text-primary)", color:"var(--color-background-primary)", borderColor:"var(--color-text-primary)" },
  dimEnds:{ display:"flex", justifyContent:"space-between", fontSize:"10px", color:"var(--color-text-tertiary)", marginTop:"5px" },
  navRow: { display:"flex", justifyContent:"space-between", alignItems:"center", gap:"8px", marginTop:"16px" },
  pill:   { fontSize:"10px", fontWeight:"500", padding:"2px 9px", borderRadius:"20px" },
  score:  { fontSize:"28px", fontWeight:"500", fontFamily:"var(--font-mono)" },
  imgBox: { width:"100%", height:"180px", background:"var(--color-background-tertiary)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"6px", fontSize:"12px", color:"var(--color-text-tertiary)" },
}

// ── SCORING CARD (local dim state) ──────────────────────────────────────────
function ScoreCard({ camp, existing, idx, total, pct, onSave, onNext }) {
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
        {/* ── MEDIA MATRIX ── */}
        {(()=>{
          const vid = ytId(camp.link)
          const hasImage = !!camp.imageUrl
          const hasVideo = !!vid
          const hasExternalLink = !!camp.link && !vid
          const mediaItems = []
          if (hasImage) mediaItems.push({ type:"image", src:camp.imageUrl })
          if (hasVideo) mediaItems.push({ type:"video", id:vid, url:camp.link })
          if (hasExternalLink) mediaItems.push({ type:"link", url:camp.link })
          if (mediaItems.length === 0) mediaItems.push({ type:"placeholder" })

          const cols = mediaItems.length >= 2 ? 2 : 1
          return (
            <div style={{padding:"12px 12px 0"}}>
              <div style={{display:"grid",gridTemplateColumns:`repeat(${cols}, 1fr)`,gap:"8px"}}>
                {mediaItems.map((item, i) => {
                  if (item.type === "image") return (
                    <a key={i} href={camp.link||"#"} target="_blank" rel="noreferrer" style={{display:"block",borderRadius:"8px",overflow:"hidden",position:"relative"}}>
                      <img src={item.src} alt={camp.brand} style={{width:"100%",height:"160px",objectFit:"cover",display:"block"}}/>
                      <div style={{position:"absolute",bottom:"6px",left:"6px",fontSize:"10px",background:"rgba(0,0,0,.6)",color:"#fff",padding:"2px 8px",borderRadius:"4px"}}>Image</div>
                    </a>
                  )
                  if (item.type === "video") return (
                    <a key={i} href={item.url} target="_blank" rel="noreferrer" style={{display:"block",borderRadius:"8px",overflow:"hidden",position:"relative",cursor:"pointer"}}>
                      <img src={ytThumb(item.id)} alt="Video thumbnail" style={{width:"100%",height:"160px",objectFit:"cover",display:"block"}}/>
                      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.25)"}}>
                        <div style={{width:"40px",height:"40px",borderRadius:"50%",background:"rgba(255,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <div style={{width:0,height:0,borderLeft:"14px solid #fff",borderTop:"8px solid transparent",borderBottom:"8px solid transparent",marginLeft:"3px"}}/>
                        </div>
                      </div>
                      <div style={{position:"absolute",bottom:"6px",left:"6px",fontSize:"10px",background:"rgba(0,0,0,.6)",color:"#fff",padding:"2px 8px",borderRadius:"4px"}}>Video</div>
                    </a>
                  )
                  if (item.type === "link") return (
                    <a key={i} href={item.url} target="_blank" rel="noreferrer" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"160px",borderRadius:"8px",background:"var(--color-background-tertiary)",textDecoration:"none",gap:"8px",border:"1px solid var(--color-border-tertiary)"}}>
                      <span style={{fontSize:"24px"}}>🔗</span>
                      <span style={{fontSize:"12px",color:"var(--color-text-info)"}}>Watch campaign →</span>
                    </a>
                  )
                  return (
                    <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"160px",borderRadius:"8px",background:"var(--color-background-tertiary)",fontSize:"12px",color:"var(--color-text-tertiary)"}}>
                      <span>No media yet</span>
                    </div>
                  )
                })}
              </div>
              {camp.link && <div style={{textAlign:"right",marginTop:"6px",marginBottom:"4px"}}>
                <a href={camp.link} target="_blank" rel="noreferrer" style={{fontSize:"11px",color:"var(--color-text-info)",textDecoration:"none"}}>Open campaign link ↗</a>
              </div>}
            </div>
          )
        })()}

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
            <span style={css.tag}>{camp.territory}</span>
            <span style={css.tag}>{camp.platform}</span>
            <span style={css.tag}>{camp.agency}</span>
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
                      style={{...css.dimBtn,flex:1,padding:"10px 0",...(dims[dim.id]===n?css.dimBtnA:{})}}>{n}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:"8px"}}>
            <div style={css.label}>Note (optional)</div>
            <textarea value={note} onChange={e=>setNote(e.target.value)}
              placeholder="Any reaction, disagreement, or reasoning..."
              style={{...css.inp,height:"60px",resize:"vertical",marginTop:"4px"}}/>
          </div>
        </div>
      </div>

      <div style={css.navRow}>
        <button style={css.btnS} onClick={onNext}>skip</button>
        <button style={{...css.btnP,opacity:allDone?1:.4}} disabled={!allDone} onClick={submit}>
          {idx===total-1 ? "Finish & review →" : "Save & next →"}
        </button>
      </div>
    </div>
  )
}

// ── IMAGE EDITOR (admin) ──────────────────────────────────────────────────────
function ImgEdit({ camp, onSave }) {
  const [url, setUrl] = useState(camp.imageUrl || "")
  const [ok, setOk] = useState(false)
  const save = async () => { await onSave(camp.id, url); setOk(true); setTimeout(()=>setOk(false),2000) }
  return (
    <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
      <input style={{...css.inp,flex:1,fontSize:"12px",padding:"8px 10px"}} value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..."/>
      <button style={{...css.btnS,padding:"8px 12px",fontSize:"12px",whiteSpace:"nowrap"}} onClick={save}>{ok?"✓ Saved":"Save"}</button>
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
  const [newC,     setNewC]     = useState({brand:"",campaign:"",year:"2024",territory:"brand",platform:"",agency:"",stat:"",note:"",scoring:"",link:"",imageUrl:"",quality:"strong"})

  useEffect(()=>{
    ;(async()=>{
      let c = await sg("rs_camps_v2")
      if (!c) { c = DEFAULTS; await ss("rs_camps_v2", c) }
      setCamps(c)
      const prof = await pg("rs_profile")
      const sc   = await pg("rs_scores") || {}
      const ord  = await pg("rs_order")
      if (prof) {
        setProfile(prof); setScores(sc)
        const o = ord || shuffle(c.map(x=>x.id))
        if (!ord) await ps("rs_order", o)
        setOrder(o)
        const first = o.findIndex(id => !sc[id])
        setIdx(first === -1 ? o.length : first)
        setScreen(first === -1 ? "complete" : "scoring")
      } else { setScreen("welcome") }
    })()
  },[])

  const start = async () => {
    if (!nameIn.trim() || !roleIn) return
    const p = { name:nameIn.trim(), role:roleIn }
    setProfile(p); await ps("rs_profile", p)
    const o = shuffle(camps.map(c=>c.id))
    setOrder(o); await ps("rs_order", o)
    setIdx(0); setScreen("scoring")
  }

  const saveScore = async (id, dims, note) => {
    const u = { ...scores, [id]:{ dims, note, ts:Date.now() } }
    setScores(u); await ps("rs_scores", u)
  }

  const submit = async () => {
    const key = `rs_team_${(profile.name||"anon").replace(/[^a-z0-9]/gi,"_")}`
    await ss(key, { scorer:profile, scores })
    setScreen("complete")
  }

  const loadTeam = async () => {
    try {
      const res = await window.storage.list("rs_team_", true)
      const data = {}
      for (const k of (res?.keys || [])) { const v = await sg(k); if (v) data[k] = v }
      setTeamData(data)
    } catch { setTeamData({}) }
    setScreen("team")
  }

  const updateImg = async (id, url) => {
    const u = camps.map(c => c.id===id ? {...c,imageUrl:url} : c)
    setCamps(u); await ss("rs_camps_v2", u)
  }

  const addCamp = async () => {
    if (!newC.brand.trim() || !newC.campaign.trim()) return
    const u = [...camps, {...newC, id:`c_${Date.now()}`}]
    setCamps(u); await ss("rs_camps_v2", u)
    setNewC({brand:"",campaign:"",year:"2024",territory:"brand",platform:"",agency:"",stat:"",note:"",scoring:"",link:"",imageUrl:"",quality:"strong"})
  }

  const camp = camps.find(c => c.id === order[idx])
  const scored = Object.keys(scores).length
  const pct = order.length ? Math.round(scored/order.length*100) : 0
  const unscored = order.filter(id => !scores[id]).length

  // ── LOADING ──
  if (screen==="loading") return (
    <div style={{...css.page,display:"flex",alignItems:"center",justifyContent:"center",height:"200px"}}>
      <span style={{fontSize:"13px",color:"var(--color-text-tertiary)"}}>Loading RalphScore…</span>
    </div>
  )

  // ── WELCOME ──
  if (screen==="welcome") return (
    <div style={css.page}>
      <div style={{paddingTop:"8px",marginBottom:"24px"}}>
        <div style={css.hdr}>Ralph Calibration Set</div>
        <div style={css.h1}>RalphScore</div>
        <div style={css.sub}>Score {camps.length} real campaigns across 5 dimensions. Your scores will calibrate what Ralph considers excellent creative — and build a shared taste profile across the team.</div>
        <div style={{display:"flex",gap:"16px",fontSize:"12px",color:"var(--color-text-tertiary)"}}>
          <span>~45 minutes</span><span>·</span><span>Return anytime</span><span>·</span><span>{camps.length} campaigns</span>
        </div>
      </div>
      <div style={css.card}>
        <div style={css.body}>
          <div style={{marginBottom:"14px"}}>
            <div style={css.label}>Your name</div>
            <input style={css.inp} value={nameIn} onChange={e=>setNameIn(e.target.value)} placeholder="First name is fine"
              onKeyDown={e=>e.key==="Enter"&&start()}/>
          </div>
          <div style={{marginBottom:"20px"}}>
            <div style={css.label}>Your role</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginTop:"6px"}}>
              {ROLES.map(r=>(
                <div key={r} onClick={()=>setRoleIn(r)} style={{...css.tag,cursor:"pointer",
                  background:roleIn===r?"var(--color-text-primary)":"var(--color-background-tertiary)",
                  color:roleIn===r?"var(--color-background-primary)":"var(--color-text-secondary)",
                  border:roleIn===r?"1px solid var(--color-text-primary)":"1px solid var(--color-border-tertiary)"}}>
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
      onNext={() => { if (idx < order.length-1) setIdx(idx+1); else setScreen("review") }}/>
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
          <div style={css.h1}>Your Ralph taste profile</div>
          <div style={css.sub}>{scored} campaigns · Average RalphScore: <strong>{overall}/5</strong></div>
        </div>
        <div style={{...css.card,marginBottom:"20px"}}>
          <div style={css.body}>
            <div style={css.label}>By dimension</div>
            {DIMS.map(d=>(
              <div key={d.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"12px"}}>
                <div style={{fontSize:"13px",color:"var(--color-text-secondary)"}}>{d.label}</div>
                <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <div style={{width:"90px",height:"3px",background:"var(--color-border-tertiary)",borderRadius:"2px"}}>
                    <div style={{width:`${((dimAvgs[d.id]||0)/5)*100}%`,height:"3px",background:"var(--color-text-primary)",borderRadius:"2px"}}/>
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
          <div style={css.label}>Campaign images</div>
          <div style={{...css.sub,marginBottom:"12px"}}>Paste an image URL for each campaign. Use direct image links (jpg, png, webp).</div>
          {camps.map(c=>(
            <div key={c.id} style={{...css.card,marginBottom:"8px"}}>
              <div style={{...css.body,padding:"10px 14px"}}>
                <div style={{fontSize:"13px",fontWeight:"500",marginBottom:"6px"}}>{c.brand} — <span style={{fontWeight:"400",color:"var(--color-text-secondary)"}}>{c.campaign}</span></div>
                <ImgEdit camp={c} onSave={updateImg}/>
              </div>
            </div>
          ))}

          <div style={{...css.card,marginTop:"24px"}}>
            <div style={css.body}>
              <div style={{...css.h2,marginBottom:"16px"}}>Add campaign</div>
              {[["brand","Brand"],["campaign","Campaign name"],["year","Year"],["agency","Agency"],["platform","Platform(s)"],["stat","Key stat"],["note","Context (1-2 lines)"],["scoring","Scoring prompt"],["link","Watch link"],["imageUrl","Image URL"]].map(([f,l])=>(
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
                      background:newC.territory===t?"var(--color-text-primary)":"var(--color-background-tertiary)",
                      color:newC.territory===t?"var(--color-background-primary)":"var(--color-text-secondary)"}}>{t}</div>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:"16px"}}>
                <div style={css.label}>Quality tier</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginTop:"6px"}}>
                  {["anchor","strong","divisive","middling"].map(q=>(
                    <div key={q} onClick={()=>setNewC({...newC,quality:q})} style={{...css.tag,cursor:"pointer",
                      background:newC.quality===q?"var(--color-text-primary)":"var(--color-background-tertiary)",
                      color:newC.quality===q?"var(--color-background-primary)":"var(--color-text-secondary)"}}>{QLABELS[q]}</div>
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

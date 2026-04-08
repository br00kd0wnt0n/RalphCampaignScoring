import express from "express"
import path from "path"
import { fileURLToPath } from "url"
import { query, initDB } from "./db.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json())

// --- Seed default campaigns if table is empty ---
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

async function seedCampaigns() {
  const { rows } = await query("SELECT COUNT(*) FROM campaigns")
  if (parseInt(rows[0].count) === 0) {
    for (const c of DEFAULTS) {
      await query("INSERT INTO campaigns (id, data) VALUES ($1, $2) ON CONFLICT DO NOTHING", [c.id, JSON.stringify(c)])
    }
    console.log(`Seeded ${DEFAULTS.length} campaigns`)
  }
}

// --- API Routes ---

// Profile: create or find scorer
app.post("/api/profile", async (req, res) => {
  const { name, role } = req.body
  if (!name?.trim() || !role) return res.status(400).json({ error: "name and role required" })

  // Check if scorer already exists
  const existing = await query("SELECT * FROM scorers WHERE LOWER(name) = LOWER($1) AND role = $2", [name.trim(), role])
  if (existing.rows.length > 0) {
    return res.json(existing.rows[0])
  }

  const result = await query("INSERT INTO scorers (name, role) VALUES ($1, $2) RETURNING *", [name.trim(), role])
  res.json(result.rows[0])
})

// Get scorer profile
app.get("/api/profile/:id", async (req, res) => {
  const { rows } = await query("SELECT * FROM scorers WHERE id = $1", [req.params.id])
  if (!rows.length) return res.status(404).json({ error: "not found" })
  res.json(rows[0])
})

// Save/upsert a score
app.post("/api/scores", async (req, res) => {
  const { scorer_id, campaign_id, dims, note } = req.body
  if (!scorer_id || !campaign_id || !dims) return res.status(400).json({ error: "missing fields" })

  const result = await query(`
    INSERT INTO scores (scorer_id, campaign_id, idea, cultural, craft, brand, share, note)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (scorer_id, campaign_id)
    DO UPDATE SET idea=$3, cultural=$4, craft=$5, brand=$6, share=$7, note=$8, created_at=NOW()
    RETURNING *
  `, [scorer_id, campaign_id, dims.idea, dims.cultural, dims.craft, dims.brand, dims.share, note || ""])
  res.json(result.rows[0])
})

// Get all scores for a scorer
app.get("/api/scores/:scorerId", async (req, res) => {
  const { rows } = await query("SELECT * FROM scores WHERE scorer_id = $1", [req.params.scorerId])
  // Transform to the shape App.jsx expects: { [campaign_id]: { dims: {...}, note, ts } }
  const scores = {}
  for (const row of rows) {
    scores[row.campaign_id] = {
      dims: { idea: row.idea, cultural: row.cultural, craft: row.craft, brand: row.brand, share: row.share },
      note: row.note || "",
      ts: new Date(row.created_at).getTime(),
    }
  }
  res.json(scores)
})

// Get all team data
app.get("/api/team", async (req, res) => {
  const scorers = await query("SELECT * FROM scorers ORDER BY created_at")
  const allScores = await query("SELECT * FROM scores")

  const teamData = {}
  for (const scorer of scorers.rows) {
    const scorerScores = {}
    for (const s of allScores.rows.filter(r => r.scorer_id === scorer.id)) {
      scorerScores[s.campaign_id] = {
        dims: { idea: s.idea, cultural: s.cultural, craft: s.craft, brand: s.brand, share: s.share },
        note: s.note || "",
      }
    }
    if (Object.keys(scorerScores).length > 0) {
      teamData[`scorer_${scorer.id}`] = { scorer: { name: scorer.name, role: scorer.role }, scores: scorerScores }
    }
  }
  res.json(teamData)
})

// Get all campaigns
app.get("/api/campaigns", async (req, res) => {
  const { rows } = await query("SELECT * FROM campaigns ORDER BY id")
  res.json(rows.map(r => r.data))
})

// Admin: update campaign image
app.put("/api/campaigns/:id/image", async (req, res) => {
  const { imageUrl } = req.body
  const { rows } = await query("SELECT data FROM campaigns WHERE id = $1", [req.params.id])
  if (!rows.length) return res.status(404).json({ error: "not found" })

  const data = { ...rows[0].data, imageUrl }
  await query("UPDATE campaigns SET data = $1 WHERE id = $2", [JSON.stringify(data), req.params.id])
  res.json(data)
})

// Admin: update campaign media (images + video)
app.put("/api/campaigns/:id/media", async (req, res) => {
  const { imageUrl, images, videoUrl } = req.body
  const { rows } = await query("SELECT data FROM campaigns WHERE id = $1", [req.params.id])
  if (!rows.length) return res.status(404).json({ error: "not found" })

  const data = { ...rows[0].data, imageUrl, images: images || [], videoUrl }
  await query("UPDATE campaigns SET data = $1 WHERE id = $2", [JSON.stringify(data), req.params.id])
  res.json(data)
})

// Admin: add new campaign
app.post("/api/campaigns", async (req, res) => {
  const camp = req.body
  if (!camp.id || !camp.brand) return res.status(400).json({ error: "id and brand required" })

  await query("INSERT INTO campaigns (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2", [camp.id, JSON.stringify(camp)])
  res.json(camp)
})

// Create or update campaign from Narrativ concept handoff
app.post("/api/campaigns/from-narrativ", async (req, res) => {
  const { session_id, concept, statement, audience, hypotheses } = req.body
  if (!session_id || !concept) return res.status(400).json({ error: "session_id and concept required" })

  const id = `narrativ_${session_id}`
  const data = {
    id,
    brand: "Concept Test",
    campaign: concept,
    year: new Date().getFullYear().toString(),
    territory: "concept",
    platform: "Narrativ",
    agency: "Ralph",
    stat: audience || "Audience to be validated",
    note: statement || "",
    scoring: hypotheses?.length
      ? `Score this concept against these hypotheses:\n${hypotheses.map((h, i) => `${i + 1}. ${h}`).join("\n")}`
      : `Score this concept across the 5 dimensions. Is it strong enough to take forward?`,
    link: "",
    imageUrl: null,
    quality: "strong",
    source: "narrativ",
    narrativ_session_id: session_id,
  }

  await query(
    "INSERT INTO campaigns (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2",
    [id, JSON.stringify(data)]
  )
  res.json({ success: true, campaign: data })
})

// --- Static files (production) ---
app.use(express.static(path.join(__dirname, "dist")))
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"))
})

// --- Start ---
const PORT = process.env.PORT || 3001

async function start() {
  await initDB()
  await seedCampaigns()
  app.listen(PORT, () => console.log(`RalphScore API running on port ${PORT}`))
}

start().catch(err => { console.error("Failed to start:", err); process.exit(1) })

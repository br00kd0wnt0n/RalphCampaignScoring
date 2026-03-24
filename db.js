import pg from "pg"

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

export async function query(text, params) {
  return pool.query(text, params)
}

export async function initDB() {
  await query(`
    CREATE TABLE IF NOT EXISTS scorers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS scores (
      id SERIAL PRIMARY KEY,
      scorer_id INT NOT NULL REFERENCES scorers(id),
      campaign_id TEXT NOT NULL,
      idea INT,
      cultural INT,
      craft INT,
      brand INT,
      share INT,
      note TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(scorer_id, campaign_id)
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL
    )
  `)
}

export default pool

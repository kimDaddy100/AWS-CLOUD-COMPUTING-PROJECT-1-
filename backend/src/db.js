const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || 'taskmanager',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Creates the tasks table if it doesn't exist yet
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id          SERIAL PRIMARY KEY,
        title       VARCHAR(255) NOT NULL,
        description TEXT,
        status      VARCHAR(20)  NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'in_progress', 'done')),
        priority    VARCHAR(10)  NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('low', 'medium', 'high')),
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Database initialised — tasks table ready.');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };

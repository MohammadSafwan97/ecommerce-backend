// db.js
import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

if (!process.env.SUPABASE_DB_URL) {
  console.error("Missing SUPABASE_DB_URL in .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }, // safe for Supabase
});

// Quick test when node starts
pool
  .connect()
  .then((client) => {
    client.release();
    console.log("DB pool connected");
  })
  .catch((err) => {
    console.error("DB pool connection error:", err.message);
  });

export default pool;

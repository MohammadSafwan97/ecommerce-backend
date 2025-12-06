import pkg from "pg";
import dotenv from "dotenv";

dotenv.config(); // make sure this is CALLING the function

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false, // required for Supabase
  },
});

export default pool;

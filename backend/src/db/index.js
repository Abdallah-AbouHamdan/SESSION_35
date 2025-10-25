import pkg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: new URL("../.env", import.meta.url) });

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
});

export const q = async (text, params = []) => {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
};

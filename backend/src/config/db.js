const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'business_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() AS current_time, current_database() AS db_name');
    console.log(`[Database] PostgreSQL connected successfully! DB: "${result.rows[0].db_name}"`);
    client.release();
    return true;
  } catch (error) {
    console.error('[Database Error] Connection failed:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  testConnection,
};
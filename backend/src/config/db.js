const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'business_management',
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'postgres'),
};

// Create a PostgreSQL connection pool
const pool = new Pool(dbConfig);

// Helper function to test database connectivity
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() AS current_time, current_database() AS db_name');
    console.log(`[Database] PostgreSQL connected successfully! DB: "${result.rows[0].db_name}", Server Time: ${result.rows[0].current_time}`);
    client.release();
    return true;
  } catch (error) {
    console.error(`[Database Note] PostgreSQL Connection Status:`, error.message);
    return false;
  }
};

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  testConnection,
};

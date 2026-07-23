const { Pool } = require('pg');

// Supabase fornece uma connection string PostgreSQL
// Formato: postgresql://user:password@host:port/database
// Você encontra em: Supabase Dashboard > Project Settings > Database > Connection > URI

const pool = new Pool({
  connectionString: `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${process.env.SUPABASE_URL.split('//')[1].split('.')[0]}.supabase.co:5432/postgres?sslmode=require`,
});

pool.on('error', (err) => {
  console.error('Erro na pool de conexão:', err);
});

module.exports = pool;

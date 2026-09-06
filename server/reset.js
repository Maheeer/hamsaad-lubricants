const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:JPyQxlNYOBUPsVizKsqgBTzGecXmBukN@ballast.proxy.rlwy.net:41600/railway',
  ssl: { rejectUnauthorized: false },
});

async function reset() {
  const hash = await bcrypt.hash('HMS-CLT-0001', 10);
  console.log('New hash:', hash);
  const result = await pool.query(
    'UPDATE clients SET password_hash = $1 WHERE client_id = $2 RETURNING client_id, LEFT(password_hash, 20) as hash_preview',
    [hash, 'HMS-CLT-0001']
  );
  console.log('Updated:', result.rows[0]);
  process.exit(0);
}

reset().catch(err => { console.error(err); process.exit(1); });
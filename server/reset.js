const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:JPyQxlNYOBUPsVizKsqgBTzGecXmBukN@ballast.proxy.rlwy.net:41600/railway',
  ssl: { rejectUnauthorized: false },
});

async function reset() {
  const hash = await bcrypt.hash('manager123', 10);
  await pool.query(
    'UPDATE users SET password = $1 WHERE role = $2',
    [hash, 'manager']
  );
  console.log('All manager passwords reset to: manager123');
  process.exit(0);
}

reset().catch(err => { console.error(err); process.exit(1); });
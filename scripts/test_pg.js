const { Client } = require('pg');

async function test() {
  const connStr = process.env.DATABASE_URL;
  if (!connStr) {
    console.error("DATABASE_URL not set");
    return;
  }
  console.log("Testing PostgreSQL pooler connection...");
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    console.log("CONNECTED TO POSTGRESQL SUCCESS!");
    const res = await client.query('SELECT count(*) FROM "User"');
    console.log("User count in PostgreSQL:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
}

test();

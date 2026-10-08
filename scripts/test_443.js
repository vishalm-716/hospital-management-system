const { Client } = require('pg');

async function test443() {
  const connStr = process.env.DATABASE_URL;
  if (!connStr) {
    console.error("DATABASE_URL not set");
    return;
  }
  console.log("Testing PostgreSQL on configured port...");
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("SUCCESS: Connected to PostgreSQL over port 443!");
    const res = await client.query('SELECT count(*) FROM "User";');
    console.log("User count in DB:", res.rows[0]);
    const deptRes = await client.query('SELECT count(*) FROM "Department";');
    console.log("Department count in DB:", deptRes.rows[0]);
    await client.end();
  } catch (err) {
    console.error("Error on 443:", err);
  }
}

test443();

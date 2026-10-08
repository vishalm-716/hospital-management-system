const { execSync } = require('child_process');
const fs = require('fs');
const { Client } = require('pg');

async function main() {
  console.log("Generating migration SQL from schema.prisma...");
  const sql = execSync('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script', {
    encoding: 'utf-8'
  });

  fs.writeFileSync('prisma/migration.sql', sql, 'utf-8');
  console.log("Saved to prisma/migration.sql. Length:", sql.length);

  console.log("Connecting to Supabase PostgreSQL database...");
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DIRECT_URL or DATABASE_URL environment variable.");
  }
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log("Connected! Applying migration SQL...");

  // Execute schema creation
  await client.query(sql);
  console.log("SUCCESS: All tables, enums, indexes and constraints created in Supabase!");

  // Verify created tables
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  console.log("\nCreated tables in public schema:");
  tables.rows.forEach(r => console.log(" -", r.table_name));

  await client.end();
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});

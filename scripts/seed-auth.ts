import { createClient } from "@libsql/client";

const url = process.env.VITE_TURSO_DB_URL;
const authToken = process.env.VITE_TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Missing VITE_TURSO_DB_URL or VITE_TURSO_AUTH_TOKEN — make sure .env is present");
  process.exit(1);
}

const turso = createClient({ url, authToken });

async function seed() {
  console.log("Ensuring admins table exists...");
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS admins (
      id       TEXT PRIMARY KEY,
      email    TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `);

  console.log("Ensuring users table exists...");
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id       TEXT PRIMARY KEY,
      email    TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name     TEXT NOT NULL
    )
  `);

  console.log("Ensuring reviews table exists...");
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      id         TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      user_id    TEXT,
      user_name  TEXT NOT NULL,
      rating     INTEGER NOT NULL,
      title      TEXT,
      body       TEXT NOT NULL,
      image_url  TEXT,
      status     TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Ensuring settings table exists...");
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  const adminEmail = "admin@gmail.com";
  const adminPassword = "admin123";

  const existing = await turso.execute({
    sql: "SELECT id FROM admins WHERE email = ?",
    args: [adminEmail],
  });

  if (existing.rows.length === 0) {
    await turso.execute({
      sql: "INSERT INTO admins (id, email, password) VALUES (?, ?, ?)",
      args: [crypto.randomUUID(), adminEmail, adminPassword],
    });
    console.log(`  ✓ Admin created: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`  - Admin already exists: ${adminEmail}`);
  }

  console.log("Seeding sample reviews...");
  const productRows = await turso.execute(
    "SELECT id FROM products ORDER BY created_at DESC LIMIT 3",
  );
  const productIds = productRows.rows.map((r) => r.id as string);
  const sampleReviews = [
    {
      user_name: "Yasmine B.",
      rating: 5,
      title: "My cat loves it!",
      body: "Ordered the sea fish food and my cat finished the whole bowl in minutes. Delivery was fast and paying on delivery made it so easy.",
    },
    {
      user_name: "Omar K.",
      rating: 5,
      title: "Great quality, fast delivery",
      body: "The grooming brush is excellent quality. The seller called to confirm the order right away. Highly recommend this store!",
    },
    {
      user_name: "Salma R.",
      rating: 4,
      title: "Happy puppy",
      body: "Bought the soft puppy bed — my dog sleeps on it all day. Would love to see more sizes and colors.",
    },
  ];
  for (const [i, r] of sampleReviews.entries()) {
    const existing = await turso.execute({
      sql: "SELECT id FROM reviews WHERE user_name = ? AND title = ?",
      args: [r.user_name, r.title],
    });
    if (existing.rows.length === 0) {
      await turso.execute({
        sql: "INSERT INTO reviews (id, product_id, user_id, user_name, rating, title, body, image_url, status) VALUES (?, ?, NULL, ?, ?, ?, ?, NULL, 'approved')",
        args: [crypto.randomUUID(), productIds[i] ?? null, r.user_name, r.rating, r.title, r.body],
      });
      console.log(`  ✓ Review seeded: ${r.user_name} — ${r.title}`);
    }
  }

  console.log("\nDone.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

import { createClient } from "@libsql/client";
import { sampleCategories, sampleProducts } from "../src/lib/sampleData";

const url = process.env.VITE_TURSO_DB_URL;
const authToken = process.env.VITE_TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Missing VITE_TURSO_DB_URL or VITE_TURSO_AUTH_TOKEN");
  process.exit(1);
}

const turso = createClient({ url, authToken });

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const categories = sampleCategories;
const products = sampleProducts;

async function seed() {
  console.log("Ensuring tables exist...");

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id   TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE
    )
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      slug        TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      price       REAL NOT NULL,
      image_url   TEXT NOT NULL,
      images      TEXT,
      category    TEXT NOT NULL,
      badge       TEXT,
      tag         TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const cols = await turso.execute("PRAGMA table_info(products)");
  if (!(cols.rows as { name: string }[]).some((c) => c.name === "images")) {
    await turso.execute("ALTER TABLE products ADD COLUMN images TEXT");
  }

  console.log(`\nSeeding ${categories.length} categories...`);
  for (const c of categories) {
    await turso.execute({
      sql: "INSERT OR IGNORE INTO categories (id, name, slug) VALUES (?, ?, ?)",
      args: [crypto.randomUUID(), c.name, c.slug],
    });
    console.log(`  ✓ ${c.name}`);
  }

  console.log(`\nSeeding ${products.length} products...`);
  for (const p of products) {
    const slug = slugify(p.name) + "-" + Math.random().toString(36).slice(2, 6);
    await turso.execute({
      sql: "INSERT INTO products (id, name, slug, description, price, image_url, category, badge, tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [
        crypto.randomUUID(),
        p.name,
        slug,
        p.description,
        p.price,
        p.image_url,
        p.category,
        p.badge,
        p.tag,
      ],
    });
    console.log(`  ✓ ${p.name} — ${p.price.toFixed(2)} MAD [${p.category}]`);
  }

  console.log(`\nDone — ${categories.length} categories, ${products.length} products inserted.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

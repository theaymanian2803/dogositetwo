import { getTursoClient } from "@/integrations/turso/client";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS admins (
  id       TEXT PRIMARY KEY,
  email    TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id       TEXT PRIMARY KEY,
  email    TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name     TEXT NOT NULL
);

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
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

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
);

CREATE TABLE IF NOT EXISTS orders (
  id          TEXT PRIMARY KEY,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  phone       TEXT NOT NULL,
  address     TEXT NOT NULL,
  items       TEXT NOT NULL,
  total       REAL NOT NULL,
  status      TEXT DEFAULT 'new',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sections (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,
  name        TEXT NOT NULL,
  size        TEXT NOT NULL DEFAULT 'medium',
  align       TEXT NOT NULL DEFAULT 'center',
  image_url   TEXT,
  title       TEXT,
  subtitle    TEXT,
  button_text TEXT,
  button_link TEXT,
  grid_items  TEXT,
  columns     INTEGER DEFAULT 3,
  product_ids TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

export const DEFAULT_ADMIN_EMAIL = "admin@gmail.com";
export const DEFAULT_ADMIN_PASSWORD = "admin123";

export async function ensureSectionColumns(): Promise<void> {
  const turso = getTursoClient();
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS sections (
      id          TEXT PRIMARY KEY,
      type        TEXT NOT NULL,
      name        TEXT NOT NULL,
      size        TEXT NOT NULL DEFAULT 'medium',
      align       TEXT NOT NULL DEFAULT 'center',
      image_url   TEXT,
      title       TEXT,
      subtitle    TEXT,
      button_text TEXT,
      button_link TEXT,
      grid_items  TEXT,
      columns     INTEGER DEFAULT 3,
      product_ids TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const sectionCols = await turso.execute("PRAGMA table_info(sections)");
  const names = new Set((sectionCols.rows as unknown as { name: string }[]).map((c) => c.name));
  if (!names.has("align")) {
    await turso.execute("ALTER TABLE sections ADD COLUMN align TEXT NOT NULL DEFAULT 'center'");
  }
  if (!names.has("columns")) {
    await turso.execute("ALTER TABLE sections ADD COLUMN columns INTEGER DEFAULT 3");
  }
  if (!names.has("product_ids")) {
    await turso.execute("ALTER TABLE sections ADD COLUMN product_ids TEXT");
  }
}

export async function setupDatabase(): Promise<void> {
  const turso = getTursoClient();
  await turso.executeMultiple(SCHEMA_SQL);

  const cols = await turso.execute("PRAGMA table_info(products)");
  if (!(cols.rows as unknown as { name: string }[]).some((c) => c.name === "images")) {
    await turso.execute("ALTER TABLE products ADD COLUMN images TEXT");
  }

  await ensureSectionColumns();

  const existing = await turso.execute({
    sql: "SELECT id FROM admins WHERE email = ?",
    args: [DEFAULT_ADMIN_EMAIL],
  });
  if (existing.rows.length === 0) {
    await turso.execute({
      sql: "INSERT INTO admins (id, email, password) VALUES (?, ?, ?)",
      args: [crypto.randomUUID(), DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD],
    });
  }
}

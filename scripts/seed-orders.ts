import { createClient } from "@libsql/client";

const url = process.env.VITE_TURSO_DB_URL;
const authToken = process.env.VITE_TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Missing VITE_TURSO_DB_URL or VITE_TURSO_AUTH_TOKEN — make sure .env is present");
  process.exit(1);
}

const turso = createClient({ url, authToken });

type OrderItem = { id: string; name: string; qty: number; price: number; image_url: string };

const sampleOrders: {
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  items: OrderItem[];
  total: number;
  status: string;
}[] = [
  {
    first_name: "Alice",
    last_name: "Johnson",
    phone: "+1-555-0101",
    address: "123 Maple St, Springfield, IL 62701",
    items: [
      {
        id: crypto.randomUUID(),
        name: "Premium Dog Food",
        qty: 2,
        price: 24.99,
        image_url: "https://images.unsplash.com/photo-1565708097881-b382c57d3dbf?w=200",
      },
      {
        id: crypto.randomUUID(),
        name: "Chew Bone Toy",
        qty: 1,
        price: 8.99,
        image_url: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=200",
      },
    ],
    total: 58.97,
    status: "delivered",
  },
  {
    first_name: "Bob",
    last_name: "Smith",
    phone: "+1-555-0202",
    address: "456 Oak Ave, Portland, OR 97201",
    items: [
      {
        id: crypto.randomUUID(),
        name: "Cat Scratching Post",
        qty: 1,
        price: 34.99,
        image_url: "https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=200",
      },
    ],
    total: 34.99,
    status: "shipped",
  },
  {
    first_name: "Carol",
    last_name: "Williams",
    phone: "+1-555-0303",
    address: "789 Pine Rd, Austin, TX 73301",
    items: [
      {
        id: crypto.randomUUID(),
        name: "Organic Cat Treats",
        qty: 3,
        price: 6.99,
        image_url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200",
      },
      {
        id: crypto.randomUUID(),
        name: "Pet Bed Deluxe",
        qty: 1,
        price: 49.99,
        image_url: "https://images.unsplash.com/photo-1541188495357-ad2d2e0c9c18?w=200",
      },
      {
        id: crypto.randomUUID(),
        name: "Stainless Steel Bowl",
        qty: 2,
        price: 12.49,
        image_url: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=200",
      },
    ],
    total: 85.95,
    status: "processing",
  },
  {
    first_name: "David",
    last_name: "Brown",
    phone: "+1-555-0404",
    address: "321 Elm St, Denver, CO 80201",
    items: [
      {
        id: crypto.randomUUID(),
        name: "Dog Leash (Retractable)",
        qty: 1,
        price: 18.99,
        image_url: "https://images.unsplash.com/photo-1591198030640-3bd6a212f5fc?w=200",
      },
      {
        id: crypto.randomUUID(),
        name: "Grooming Brush Kit",
        qty: 1,
        price: 22.49,
        image_url: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=200",
      },
    ],
    total: 41.48,
    status: "new",
  },
  {
    first_name: "Eve",
    last_name: "Davis",
    phone: "+1-555-0505",
    address: "654 Birch Ln, Seattle, WA 98101",
    items: [
      {
        id: crypto.randomUUID(),
        name: "Fish Tank Filter",
        qty: 1,
        price: 29.99,
        image_url: "https://images.unsplash.com/photo-1519121785383-3229633bb75b?w=200",
      },
    ],
    total: 34.99,
    status: "cancelled",
  },
  {
    first_name: "Frank",
    last_name: "Miller",
    phone: "+1-555-0606",
    address: "987 Walnut Ct, Chicago, IL 60601",
    items: [
      {
        id: crypto.randomUUID(),
        name: "Premium Dog Food",
        qty: 4,
        price: 24.99,
        image_url: "https://images.unsplash.com/photo-1565708097881-b382c57d3dbf?w=200",
      },
      {
        id: crypto.randomUUID(),
        name: "Dog Leash (Retractable)",
        qty: 2,
        price: 18.99,
        image_url: "https://images.unsplash.com/photo-1591198030640-3bd6a212f5fc?w=200",
      },
      {
        id: crypto.randomUUID(),
        name: "Chew Bone Toy",
        qty: 3,
        price: 8.99,
        image_url: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=200",
      },
    ],
    total: 163.91,
    status: "new",
  },
];

async function seed() {
  console.log("Ensuring orders table exists...");
  await turso.execute(`
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
    )
  `);
  console.log("Seeding orders...\n");

  for (const o of sampleOrders) {
    const id = crypto.randomUUID();
    await turso.execute({
      sql: "INSERT INTO orders (id, first_name, last_name, phone, address, items, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      args: [
        id,
        o.first_name,
        o.last_name,
        o.phone,
        o.address,
        JSON.stringify(o.items),
        o.total,
        o.status,
      ],
    });
    console.log(`  ✓ ${o.first_name} ${o.last_name} — ${o.total.toFixed(2)} MAD (${o.status})`);
  }

  console.log(`\nDone — ${sampleOrders.length} orders inserted.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

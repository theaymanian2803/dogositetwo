# PetPals — Buyer Instructions

Thank you for purchasing this premium React e-commerce template. PetPals is a complete
dog & cat supplies store with a built-in admin dashboard (products, categories, orders)
backed by a **Turso** database.

This guide walks you through everything: running it locally, connecting your database,
and deploying it live on **Vercel** using the drag-and-drop **Vercel Drop** method — no
Git or command line required.

---

## 1. What's in the package

```
dogositetwo/
├── src/                       # All source code
│   ├── components/            # Storefront + admin UI (SiteHeader, Hero, ProductGrid, admin/*)
│   ├── pages/                 # Route pages (Index, Shop, Product, Cart, Checkout, Admin, Auth, ...)
│   ├── hooks/                 # Data hooks (useAuth, useUserAuth, useCart, useSettings, ...)
│   ├── integrations/turso/    # Turso (libSQL) client
│   ├── lib/                   # Business logic (setupDatabase, sections, sampleData, i18n, shipping)
│   ├── assets/                # Images
│   ├── App.tsx                # App entry with routing
│   ├── main.tsx               # React bootstrap
│   └── styles.css             # Tailwind v4 theme tokens
├── scripts/                   # Optional seed scripts (need Bun)
├── index.html                 # HTML entry point
├── package.json               # Project manifest & scripts
├── .env.example               # Copy this to create your .env file (see Section 4)
├── .gitignore
├── INSTRUCTIONS.md            # This file
└── config files               # Vite, Tailwind, TypeScript, ESLint, shadcn/ui configs
```

### Tech stack

| Layer      | Technology                                    |
| ---------- | --------------------------------------------- |
| Framework  | React 19 + TypeScript + Vite 7                |
| Styling    | Tailwind CSS v4 + shadcn/ui (Radix UI)        |
| Routing    | React Router 6 (single-page app)              |
| Data       | Turso (libSQL) — browser talks to it directly |
| Charts     | Recharts (admin dashboard)                    |
| Carousels  | Embla                                         |
| Hosting    | Vercel (recommended)                          |

> **No backend server.** The storefront and the admin both read/write Turso directly from
> the browser, so the whole app is a static site — perfect for Vercel's free plan.

---

## 2. Requirements

- **Node.js 18 or newer** — <https://nodejs.org> (the LTS version is best)
- **npm** — comes bundled with Node.js
- A free **Vercel account** — <https://vercel.com/signup>
- A free **Turso account** for the database — <https://turso.tech>

> None of these services require a credit card for the free tiers.

---

## 3. Extract the project locally

1. Unzip the package to any folder on your computer.
2. Open a terminal (**PowerShell** / **CMD**, or macOS/Linux **Terminal**) and enter the folder:

   ```bash
   cd dogositetwo
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the URL printed in the terminal (usually <http://localhost:5173>) — the store is
   now running locally. Edits in `src/` reload instantly.

Other useful commands:

```bash
npm run build     # Production build into dist/
npm run preview   # Serve the production build locally
npm run lint      # ESLint check
```

> Until you connect a Turso database, the site uses a small built-in demo dataset so you
> can preview the design immediately (see the next section).

---

## 4. Configure environment variables (Turso database)

All store content lives in **Turso**. Connect it once and the storefront + admin come alive.

### 4.1 Create your Turso database (~2 minutes)

1. Create a free account at <https://turso.tech>.
2. **Databases → Create database**, pick a name (e.g. `petpals-store`) and a region near
   your visitors, then **Create**.
3. Open the database → **Generate token** → copy the token (looks like `eyJ...`).
4. Copy the database **URL** (looks like `libsql://petpals-store-xxxx.turso.io`).

The tables are created **automatically** the first time the site loads with a valid
database — no SQL and no migrations to run.

### 4.2 Create your `.env` file

1. In the project root, copy the example file:

   ```bash
   # Windows
   copy .env.example .env

   # macOS / Linux
   cp .env.example .env
   ```

2. Open `.env` and fill in your values:

   ```env
   VITE_TURSO_DB_URL=libsql://petpals-store-xxxx.turso.io
   VITE_TURSO_AUTH_TOKEN=eyJ...your-token...
   ```

3. Restart the dev server (`Ctrl + C`, then `npm run dev`) so the values are picked up.

### 4.3 Admin login (change the password!)

The site ships with demo admin credentials:

- **Email:** `admin@gmail.com`
- **Password:** `admin123`

Sign in at `/auth` (or `/admin`). **Change these before going live** — go to
**Admin → Settings → Admin credentials**, enter the current password, then set your own
email and password.

> ⚠️ `.env` holds secrets. Never commit it, share it, or upload it. On Vercel you enter
> the same values in the dashboard instead (Section 6). `.env` is already in `.gitignore`.

### 4.4 Activate your license

The admin dashboard is unlocked with the product key you received when you bought this
template. The key is bound to the domain you deploy on, so activate it **after** your site
is live on its final domain (activating on `localhost` binds it to `localhost`).

1. Open your site's `/admin` (or `/auth`). You'll see an **Activate** screen.
2. Paste your product key (looks like `DOGOSITE-XXXX-XXXX-XXXX`) and click **Activate**.
3. The dashboard unlocks. The key allows a limited number of domains (usually 3); re-entering
   the same key on the same domain is always free.

If you move to a new domain later and the key reports a **domain limit**, contact your
seller to release the old binding. To re-enter a different key, open
**Admin → Settings → License → Change key**.

---

## 5. Deploy on Vercel (recommended — easiest option)

The fastest route is **Option A (Vercel Drop)** — no Git, no CLI, no commands.

### Option A — Vercel Drop (drag & drop, no code)

1. Build once locally as a sanity check (optional but recommended):

   ```bash
   npm run build
   ```

2. Go to <https://vercel.com> and **log in** (create a free account if needed).
3. Open the Drop page: <https://vercel.com/drop>.
4. **Drag the extracted project folder** (the one containing `package.json`) into the drop
   zone. Do **not** drop the zip file — drop the **extracted** folder.
5. Vercel detects **Vite** automatically, installs dependencies, and builds the project.
6. When the build finishes, your site is live at a URL like
   `https://dogositetwo-xxxx.vercel.app`.

> ⚠️ **Add your environment variables** (Section 6) right after the first deploy and
> **Redeploy**, or the live site will have no database.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel          # preview deploy
vercel --prod   # production deploy
```

Accept the defaults when asked (framework: **Vite**, build: `npm run build`, output: `dist`).

### Option C — GitHub import

1. Push the project to a GitHub repo (`.env` is already gitignored).
2. In Vercel: **Add New → Project → Import** your repo.
3. Keep the Vite defaults and click **Deploy**.

---

## 6. Add your environment variables on Vercel

**Required** so the deployed site can reach your database (the `.env` file never leaves
your computer).

1. Vercel project → **Settings → Environment Variables**.
2. Add the same values from your `.env`:

   | Name                     | Value                             |
   | ------------------------ | --------------------------------- |
   | `VITE_TURSO_DB_URL`      | `libsql://your-database.turso.io` |
   | `VITE_TURSO_AUTH_TOKEN`  | your Turso token                  |

3. **Deployments → (latest) → ⋯ → Redeploy** to apply them.
4. Open your live URL — the first load creates the tables and seeds demo content
   automatically.

---

## 7. Customize the site

- **Catalog, categories, orders:** log in at `your-site.vercel.app/admin` and manage
  everything from the dashboard — no code needed.
- **Brand, hero, promo, contact, socials, shipping:** **Admin → Settings** (stored in the
  database and read live by the storefront).
- **Colors, fonts, spacing:** edit the theme tokens in `src/styles.css`.
- **Copy / translations:** edit `src/lib/i18n.tsx` (storefront is multilingual; the admin
  is English-only by design).
- **Info pages (about, shipping, returns, etc.):** edit `src/lib/infoPages.tsx`.
- **UI components:** all shadcn/ui components live in `src/components/ui/`.

> A first-run **guided tour** highlights the admin, and a **demo banner** at the top of the
> site shows the demo login with a "Restart tour" button. The banner disappears
> automatically once you connect your own database.

---

## 8. Troubleshooting

| Problem                                             | Solution                                                                                     |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm install` is slow or fails                      | Retry, or `npm install --legacy-peer-deps`. Ensure Node 18+ is installed.                     |
| Site loads but products/categories are empty        | Turso isn't configured — check `VITE_TURSO_DB_URL` / `VITE_TURSO_AUTH_TOKEN`, then restart.   |
| Can't log in to the admin                           | Use the seeded `admin@gmail.com` / `admin123`, then change it in Admin → Settings.            |
| Vercel build fails                                  | Re-drop the full **extracted** folder (not the zip), confirm env vars, then **Redeploy**.     |
| Changes don't appear after editing env vars         | Env changes require a **Redeploy** (Settings → Environment Variables → redeploy).             |
| Port already in use                                 | `npm run dev -- --port 5174`                                                                  |
| "Delete all data" asks for a guard password         | Demo safeguard only — it does not affect normal use.                                          |

---

## 9. Need help?

If something isn't covered here, contact your seller's support with a screenshot of the
issue and the Vercel build log if relevant.

Happy selling! 🚀

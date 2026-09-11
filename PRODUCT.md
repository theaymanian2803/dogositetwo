# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

PetPals store owner/operator. They manage the pet e-commerce catalog and incoming orders, typically in short daily sessions on desktop, with mobile/tablet used for quickly checking new orders.

## Product Purpose

PetPals is a dog & cat pet supplies e-commerce store. The admin dashboard lets the owner manage products, categories, and customer orders (view, change status, delete).

## Positioning

A lightweight, single-operator back office for a small pet store: catalog + order status management without heavyweight ERP complexity.

## Operating Context

Admin is password-protected (admin email/password stored in the `admins` table). Orders are tracked by customer phone number. The admin signs in at `/auth` or `/admin` and manages three areas: products (CRUD), categories (CRUD), and orders (status update + delete). The site is React + Vite + Tailwind v4, backed by Turso/libSQL.

## Capabilities and Constraints

- Three admin areas: Products, Categories, Orders.
- Product fields: name, description, price, image_url, category, badge, tag. Slug auto-generated.
- Categories: name + slug.
- Orders: customer name, phone, address, items JSON, total, status (new/processing/shipped/delivered/cancelled), created_at. Status can be updated and orders deleted.
- Confirmation modal for destructive actions; product add/edit form modal with image upload (base64, <2MB) or URL.
- Data is fetched directly from Turso via the same client as the storefront; no auth API beyond the `admins` table check.
- Mobile/tablet (<1024px) admin shows orders as stacked cards; the full table only on wide screens.
- Orders tab is the only section available on phone-sized screens; products/categories management is for tablet/desktop.

## Brand Commitments

- Name: PetPals.
- The storefront has an established light visual identity with an accent color (CSS tokens: `accent`, `background`, `foreground`, `secondary`, `muted`, `card`, `border`), rounded-full pill buttons, and Inter-family feel. The admin must match the storefront identity rather than appearing as a separate gray app.

## Evidence on Hand

- Seeded product/category/order data in Turso (25 products, 7 categories).
- Storefront components (SiteHeader, Shop, Product pages) use the established design tokens.

## Product Principles

- Fast daily operations: status updates and product edits should be one or two taps, never buried.
- Brand continuity: the admin is still PetPals, not a foreign gray app.
- Clarity over decoration: dense data (orders/products) must stay scannable with comfortable spacing.
- All devices: the owner can check orders on a phone and fully manage on desktop; behavior must be identical everywhere.

## Accessibility & Inclusion

- Admin is the operator-facing surface; keep contrast sufficient for the light theme, focus states visible, and touch targets comfortable on mobile.

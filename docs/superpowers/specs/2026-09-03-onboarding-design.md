# PetPals Onboarding Workflow — Design

Date: 2026-09-03
Status: Approved by user in chat

## Purpose

PetPals is a template being sold. Buyers need a guided first-run experience that
teaches them the storefront and wires them into the admin panel and their own
database. This ports the proven onboarding system from the reference project
`Desktop/lingo` onto this site, adapted to this site's structure and design tokens.

## Approach

Faithful port of lingo's onboarding system (spotlight tour + settings dialog
context). Rejected alternatives: simplified modal carousel (loses guided feel),
third-party tour library (new dependency, less control).

## Components

1. **`src/lib/onboarding.ts`** — localStorage flag under key `petpals_onboarded`.
   Exports `isOnboardingDone()` / `markOnboardingDone()`. Direct port of lingo's
   `lib/onboarding.ts`.
2. **`src/lib/settingsDialog.ts`** — `SettingsDialogContext` + `useOpenSettingsDialog()`
   hook. Port of lingo's `lib/settingsDialog.ts`.
3. **`src/components/SettingsDialogProvider.tsx`** — renders children plus the
   existing `TursoSettingsDialog`, exposes `openSettings()`. Port of lingo's
   `SettingsDialogProvider.tsx`.
4. **`src/components/OnboardingDialog.tsx`** — spotlight tour ported 1:1 from
   lingo's `OnboardingDialog.tsx`, restyled to this site's tokens (accent orange,
   `rounded-2xl`, warm card surfaces). Auto-opens on first visit; skippable; marks
   done on close; auto-navigates to `/` when opened; re-measures target rects via
   MutationObserver + resize + scroll. Last step's primary button opens the
   database settings dialog.

## Tour steps (7)

All targets are homepage-visible elements, addressed via `data-tour` attributes:

| #   | data-tour        | Target                                  | Copy intent                                                            |
| --- | ---------------- | --------------------------------------- | ---------------------------------------------------------------------- |
| 1   | `home-hero`      | Hero heading (`Hero.tsx`)               | Storefront: hero, categories, promos                                   |
| 2   | `home-shop`      | Hero "Shop Now" button                  | Browse all products                                                    |
| 3   | `nav-shop`       | Header Shop nav link (`SiteHeader.tsx`) | Header navigation                                                      |
| 4   | `nav-search`     | Header search input                     | Search products                                                        |
| 5   | `nav-cart`       | Header cart icon                        | Cart & checkout                                                        |
| 6   | `nav-admin`      | Header admin (lock) icon                | Admin panel; tooltip shows demo credentials admin@gmail.com / admin123 |
| 7   | `connect-button` | DemoBanner Connect button               | Connect own Turso database; button opens settings dialog               |

## Wiring changes

- **`src/App.tsx`** — wrap app in `SettingsDialogProvider`; render
  `<OnboardingDialog open={!isOnboardingDone() ...} />` with local state, mirroring
  lingo's App.tsx.
- **`src/components/DemoBanner.tsx`** — Connect button calls `openSettings()`
  instead of navigating to `/admin?tab=settings`; gets `data-tour="connect-button"`.
- **`src/components/SiteHeader.tsx`** — add `data-tour` attributes: Shop nav link,
  search wrapper, cart link, admin lock link.
- **`src/components/Hero.tsx`** — add `data-tour="home-hero"` on the h1,
  `data-tour="home-shop"` on the Shop Now link.
- **`src/pages/Login.tsx`** — mono hint under the form with the working demo
  credentials (admin@gmail.com / admin123), matching lingo's access-code hint.

## Out of scope

- AccessGate / access code (user chose "show creds on login + tour").
- Changing the admin auth mechanism (stays email/password against `admins` table).
- `/admin?tab=settings` route behavior (kept as a fallback path).

## Verification

- `npm run lint` on changed files (repo-wide CRLF errors are pre-existing).
- `npm run build`.
- Puppeteer walkthrough: fresh localStorage visit → tour opens on `/`, step
  through all 7 steps, last step opens the Turso settings dialog, close marks
  done and never reopens.

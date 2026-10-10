<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./public/images/logo/logo-gold.webp" />
  <img src="./public/images/logo/logo.webp" width="160" alt="Duy and Lan wedding monogram" />
</picture>

# Duy & Lan Wedding Invitation

A one-page digital wedding invitation built with Next.js and deployed to GitHub Pages.

<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" />
<img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111827" />
<img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white" />
<img alt="GitHub Pages" src="https://img.shields.io/badge/GitHub-Pages-222222?logo=github&logoColor=white" />

**[View the invitation →](https://khuongduy-nguyen.github.io/wedding-invitation/)**

[Features](#features) · [Getting Started](#getting-started) · [Editing Content](#editing-content) · [Deployment](#deployment) · [Privacy](#privacy)

</div>

---

## Features

| | |
| --- | --- |
| **Envelope intro** | Animated opening with fireworks and background music |
| **Couple & events** | Profiles, three ceremonies with Google Maps, story timeline, countdown |
| **Gallery** | Photo carousel with fullscreen lightbox |
| **Guestbook** | Wishes stored in Google Sheets via Apps Script |
| **Gift box** | Bank details, QR codes, copy-to-clipboard |
| **Comfort** | Light/dark theme and reduced-motion support |

## Getting Started

Requires **Node.js `>=22.13.0`**.

```bash
npm ci
npm run dev      # http://localhost:3000
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Build the static site into `out/` |
| `npm start` | Serve `out/` locally |
| `npm run lint` | Run ESLint |
| `npm run check` | Lint + build (used by CI) |

## Editing Content

| What | Where |
| --- | --- |
| Text, events, bank accounts, guestbook URL | `app/wedding-data.ts` |
| SEO and Open Graph metadata | `app/layout.tsx` |
| October 2026 calendar section | `app/page.tsx` (hard-coded) |

### Media

Files in `public/` are picked up automatically when you run `dev` or `build`.

| Content | Folder |
| --- | --- |
| Gallery photos | `public/images/wedding/` |
| Portraits | `public/images/portraits/{bride,groom}/` |
| Logo | `public/images/logo/` (`logo.webp` preferred) |
| Music | `public/music/` (first track) |

> [!NOTE]
> `app/generated-wedding-gallery.ts` is generated from these folders. Don't edit it by hand.

### Guestbook

Set `googleSheetScriptUrl` to a Google Apps Script web app shared with **Anyone**. It must accept `POST` with `{ name, relation, message, date }`, and `GET` must return:

```json
{ "status": "success", "wishes": [{ "name": "…", "relation": "…", "message": "…", "date": "dd/mm/yyyy" }] }
```

## Deployment

1. In the repo, set **Settings → Pages → Source** to **GitHub Actions**.
2. Push to `main`. `.github/workflows/deploy-pages.yml` builds the site and publishes `out/`.

The base path is set automatically: `/<repository>` for project sites and `/` for `<username>.github.io`. To override it, set the `PAGES_BASE_PATH` repository variable.

## Privacy

> [!WARNING]
> The published site exposes photos, family names, addresses, bank details, and the guestbook URL. The guestbook endpoint is unauthenticated, so anyone with the URL can post to it.

<p align="center">
  <img src="./public/images/logo/wedding-lockup.webp" width="180" alt="Duy and Lan wedding monogram" />
</p>

<h1 align="center">Duy & Lan Wedding Invitation</h1>

<p align="center">
  An elegant, responsive digital wedding invitation with an animated envelope, event details, story timeline, photo gallery, countdown, maps, and background music.
</p>

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111827" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img alt="GitHub Pages" src="https://img.shields.io/badge/GitHub-Pages-222222?logo=github&logoColor=white" />
</p>

---

## Overview

This repository contains the complete source for Duy and Lan's one-page wedding invitation. The interface uses React and the Next.js App Router, then exports prerendered HTML, CSS, and JavaScript for GitHub Pages.

### Highlights

- Animated envelope opening with optional background music.
- Responsive layouts for desktop, tablet, and mobile.
- Bride and groom profiles, three wedding events, and embedded maps.
- Live countdown calculated in the `Asia/Ho_Chi_Minh` time zone.
- Touch, pointer, mouse-wheel, and keyboard-friendly photo carousel.
- Lazy-loaded media, optimized WebP artwork, and reduced-motion support.
- Automated media discovery for photos, portraits, logos, and music.
- Production build, lint, and rendered-HTML smoke tests.

## Tech Stack

| Area | Technology |
| --- | --- |
| UI | React 19, TypeScript, Next.js App Router API |
| Build | Next.js static export |
| Hosting | GitHub Pages |
| Styling | CSS, Tailwind CSS processing |
| Optional data layer | Drizzle ORM, Cloudflare D1 |
| Validation | ESLint, Node.js test runner |

## Quick Start

### Requirements

- Node.js `>=22.13.0`
- npm and the committed `package-lock.json`

### Install and run

```bash
npm ci
npm run dev
```

Open the local URL printed in the terminal.

### Preview through ngrok

The development server accepts `*.ngrok-free.app` as an additional development origin. Start Next.js, then point ngrok to the printed local port:

```bash
npm run dev
ngrok http 3000
```

Restart the Next.js development server after changing `next.config.ts`; otherwise, the previous origin policy remains active.

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Generate media metadata and create the static export in `out/` |
| `npm run lint` | Run the source-code quality checks |
| `npm test` | Build the project and run the rendered-HTML smoke test |
| `npm run check` | Run the complete lint, build, and test gate before deployment |
| `npm start` | Preview the generated `out/` directory locally |

## Project Structure

```text
app/
├── layout.tsx                       # Root layout and metadata
├── page.tsx                         # Invitation UI and interactions
├── globals.css                      # Responsive styles and motion system
├── wedding-data.ts                  # Editable invitation content
└── generated-wedding-gallery.ts     # Generated media manifest
assets/source-images/                # Original high-resolution artwork
public/                              # Deployable images, fonts, icons, and music
scripts/generate-wedding-gallery.mjs # Media-manifest generator
tests/rendered-html.test.mjs         # Production rendering smoke test
.github/workflows/deploy-pages.yml   # GitHub Pages CI/CD workflow
```

## Content Management

Update invitation copy and structured event data in [`app/wedding-data.ts`](./app/wedding-data.ts).

| Content | Location |
| --- | --- |
| Wedding gallery | `public/images/wedding/` |
| Bride portrait | `public/images/portraits/bride/` |
| Groom portrait | `public/images/portraits/groom/` |
| Display logo | `public/images/logo/logo.webp` |
| Background music | `public/music/` |

The `predev` and `prebuild` hooks run `scripts/generate-wedding-gallery.mjs`. It scans these folders and regenerates `app/generated-wedding-gallery.ts`; do not edit that generated file manually.

Large PNG source files are preserved under `assets/source-images/` and are not served by the website. Export optimized WebP versions into `public/images/` after changing source artwork.


## Deployment

Pushes to `main` are validated and deployed automatically by `.github/workflows/deploy-pages.yml`. In GitHub, enable **Settings → Pages → Source → GitHub Actions** once for the repository.

Create the static production artifact locally with:

```bash
npm run build
```

The deployable output is written to `out/`. The workflow automatically sets the correct repository base path, so a project repository is published at `https://<username>.github.io/<repository>/` without broken image, font, music, or framework asset URLs.

For a custom domain or a root `<username>.github.io` repository, set the optional repository variable `PAGES_BASE_PATH` to `/`. Legacy Cloudflare and Vinext files remain in the repository as a rollback path but are not used by the GitHub Pages build.

## Privacy

Publishing this invitation makes its bundled content—including photographs, event addresses, music metadata, and gift information—accessible to visitors. Review the final repository and generated site before enabling public access.

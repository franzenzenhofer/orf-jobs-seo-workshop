Scope: this folder and subdirectories.

**IMPORTANT: DIRECT HTML EDITING APPROACH**

- **Primary workflow**: Edit `public/index.html` directly for all changes
- **NO build system**: Do not use `npm run build` or modify src/ files
- **Workshop dummy**: This is a static SEO-optimized HTML file for workshop demonstration

Guidelines

- Keep each source file under 75 lines.
- Favor small, single‑purpose modules wired via `src/build.js`.
- Do not add heavy deps; use `cheerio` and `html-minifier-terser` only.
- Output goes into `public/`; fetched raw HTML into `data/`; images in `assets/images/`.
- SEO: include `<title>`, meta description, Open Graph, Twitter cards, JSON‑LD `JobPosting`, and `<link rel="canonical">`.
- Pagination: 10 items/page. Page 1 lists active jobs first; expired jobs continue on subsequent pages. Query pages must canonicalize to `/lp/orfjobs`.
- Keep detail pages under `public/jobs/<id>/index.html`.
- JS: progressive enhancement only; base HTML must be navigable.
- Lint: run `npm run lint` to validate core SEO markers and file size constraints.

Build

- `npm run build` fetches, parses, downloads images, and renders static pages.
- `npm run clean` clears `public/`, `data/`, and `assets/images/`.

Notes

- When selectors change upstream, update `src/parse.js` extraction rules.
- Do not commit `node_modules/`.

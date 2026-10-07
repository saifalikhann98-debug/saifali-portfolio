# Saifali Khan — Portfolio

Personal portfolio for **Saifali Khan**, product designer in Dubai who designs products and then builds them.

Plain static site — hand-written HTML, CSS and JS. No build step, no dependencies.

## Structure

| Path | What it is |
| --- | --- |
| `index.html` | Home — hero, about, selected work, experience, contact |
| `work/*.html` | Case studies, served at `/work/<name>` (`cleanUrls` in `vercel.json`) |
| `orfyx-design-system.html` | ORFYX design system & UI kit, linked from the Orfyx case study |
| `assets/site.css` | The one stylesheet every page shares |
| `assets/site.js` | Shared behaviour: scroll reveal, interactions, view transitions |
| `img/` | Screenshots and portrait — each `NAME.jpg` has `NAME.webp` + a half-size WebP |
| `404.html` | Not-found page (Vercel serves it automatically) |
| `og.png` | 1200×630 social share card |
| `resume.pdf` | Résumé, generated from `cv/cv.html` (see `cv/README.md`) |
| `tools/webp.py` | Makes the WebP copies for new images |

`.vercelignore` keeps repo-only files (`README.md`, `cv/`, `tools/`) and the
unfinished `work/bitdelta.html` draft out of the deployment.

## Local preview

```bash
npx serve .          # honours cleanUrls, so /work/mizan works
# or: python3 -m http.server 8000   (then open /work/mizan.html)
```

## Adding a case study

1. Copy `work/brickbrief.html` to `work/<name>.html` and replace the content.
   Keep the `<head>` links to `/assets/site.css` and `/assets/site.js`.
2. Screenshots: export at 1500px wide as `img/NN-<name>-<what>.jpg`, then
   `python3 tools/webp.py img/NN-*.jpg` and wrap the `<img>` in the same
   `<picture>` markup the other case studies use.
3. Add a row to the work list in `index.html`. Give its `.wrow` a
   `data-peek="/img/...-750.webp"` for the hover preview, and add the
   `.wthumb` picture for touch screens (copy an existing row).
4. Add the URL to `sitemap.xml` and fix the prev/next links in `.case-nav`.

## Deploy

Vercel, Git integration: pushes to `main` deploy to production, other
branches get preview URLs. Framework preset **Other**, no build command,
output directory `./`.

**Analytics:** pages load Vercel Web Analytics (`/_vercel/insights/script.js`).
Turn it on once in the dashboard — Project → Analytics → Enable — or the
script 404s harmlessly.

## Custom domain — how to switch

Absolute URLs (canonical, OG, JSON-LD, sitemap, robots) are hardcoded and
verified consistent. To move to a custom domain, run this from the repo root
and push:

```bash
grep -rl 'saifali-portfolio-sooty.vercel.app' --include='*.html' --include='*.xml' --include='*.txt' . \
  | xargs sed -i '' 's|saifali-portfolio-sooty.vercel.app|YOUR-DOMAIN.com|g'
```

Then, in the Vercel dashboard (project **saifali-portfolio**):

1. Settings → Domains → Add → enter the domain.
2. At your registrar: apex `A` record → `76.76.21.21`; `www` `CNAME` → `cname.vercel-dns.com`.
3. Set the custom domain as **primary** (Vercel then 308-redirects the *.vercel.app URL).
4. Push the URL swap commit (step above) so canonical/OG/sitemap match the new domain.
5. Re-scrape the OG cards (opengraph.xyz or the platform debuggers) — they cache.

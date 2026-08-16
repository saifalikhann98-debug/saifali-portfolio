# Saifali Khan — Portfolio

Personal portfolio for **Saifali Khan**, product designer in Dubai who designs products and then builds them.

Single self-contained static site:

- `index.html` — the whole site (HTML / CSS / JS, all screenshots and the portrait embedded as data URIs). No build step, no dependencies.
- `og.png` — 1200×630 social share card used by Open Graph / Twitter tags.

## Deploy

It's a static site, so any static host works (Vercel, Netlify, GitHub Pages).

**Vercel:** import the repo — framework preset **Other**, no build command, output directory `./`. Or from the CLI: `vercel --prod`.

Keep `index.html` and `og.png` together at the repo root so the share image resolves.

## After first deploy

For link previews to render everywhere, set the social image to an absolute URL once the domain is known. In `index.html`, change the two `content="og.png"` values to `content="https://<your-domain>/og.png"`, and add:

```html
<meta property="og:url" content="https://<your-domain>/" />
```

Then redeploy and test at https://www.opengraph.xyz.

## Local preview

Open `index.html` directly, or:

```bash
python3 -m http.server 8000
# visit http://localhost:8000
```

## Custom domain — how to switch

This is a no-build static site, so there is no env var for the site URL.
Absolute URLs (canonical, OG, sitemap, robots) are hardcoded and verified
consistent. To move to a custom domain, run this from the repo root and push:

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

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

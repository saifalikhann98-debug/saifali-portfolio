# CV source

`resume.pdf` at the repo root is generated from `cv/cv.html`:

```bash
"/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" --headless --disable-gpu \
  --no-pdf-header-footer --print-to-pdf=resume.pdf "file://$PWD/cv/cv.html"
```

One A4 page. Fonts are vendored Carlito (SIL OFL — metric-compatible with the
original PDF's embedded font). Edit the HTML, regenerate, check it is still
`pages: 1`, replace resume.pdf, commit.

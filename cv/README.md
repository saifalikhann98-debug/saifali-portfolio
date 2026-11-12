# CV source

`resume.pdf` at the repo root is generated from `cv/cv.html` with any Chromium-based browser:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --no-pdf-header-footer --print-to-pdf=resume.pdf "file://$PWD/cv/cv.html"
```

One A4 page, styled like the portfolio: same colours as `assets/site.css`, and the same three
fonts (Bricolage Grotesque, Hanken Grotesk, JetBrains Mono, all SIL OFL, licences in `fonts/`).

The fonts in `fonts/` are fixed-weight cuts of the variable fonts, one file per weight the CV
uses. Chrome embeds variable fonts as Type 3 in PDFs; fixed weights embed as normal TrueType.

After editing: regenerate, check it is still `Pages: 1` (`pdfinfo resume.pdf`) and that the
bottom chips aren't clipped (the page has about 6px spare), replace `resume.pdf`, commit.

# CV source

`resume.pdf` at the repo root is generated from `cv/cv.html` with any Chromium-based browser:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --no-pdf-header-footer --print-to-pdf=resume.pdf "file://$PWD/cv/cv.html"
```

One A4 page in a minimal type layout: a white page, Hanken Grotesk for all text (Regular,
Medium, SemiBold), Bricolage Grotesque SemiBold for the name only, black text with one grey,
and thin rules between sections. Both fonts are the portfolio's, SIL OFL, licences in `fonts/`.

The files in `fonts/` are fixed-weight cuts of the variable fonts, one per weight the CV uses.
Chrome embeds variable fonts as Type 3 in PDFs; fixed weights embed as normal TrueType.

After editing: regenerate, check it is still `Pages: 1` (`pdfinfo resume.pdf`) and that the
Education line keeps a bottom margin of about 10mm, replace `resume.pdf`, commit.

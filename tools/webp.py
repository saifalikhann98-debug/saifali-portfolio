"""Make the WebP copies every <picture> on the site expects.

For each img/NAME.jpg this writes img/NAME.webp (same size) and a half-size
img/NAME-750.webp (img/NAME-600.webp for images 900px wide or less). Safe to re-run.

    python3 tools/webp.py            # all images
    python3 tools/webp.py img/16-*.jpg
"""
import glob
import sys

from PIL import Image

for path in sys.argv[1:] or sorted(glob.glob('img/*.jpg')):
    im = Image.open(path).convert('RGB')
    w, h = im.size
    small = 600 if w <= 900 else 750
    base = path[:-4]
    im.save(f'{base}.webp', 'WEBP', quality=80, method=6)
    im.resize((small, round(h * small / w)), Image.LANCZOS).save(f'{base}-{small}.webp', 'WEBP', quality=80, method=6)
    print(f'{path} -> {base}.webp, {base}-{small}.webp')

// Shared behaviour for every page. Loaded with `defer`, so the DOM is parsed.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

// Old single-page links (/#case-mizan) now live at /work/mizan
if (location.pathname === '/' && location.hash.startsWith('#case-')) {
  location.replace('/work/' + location.hash.slice(6));
}

const yr = document.getElementById('yr');
if (yr) yr.textContent = new Date().getFullYear();

// ---- scroll reveal ----
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const sibs = [...e.target.parentElement.querySelectorAll('.reveal')];
      e.target.style.transitionDelay = Math.min(Math.max(sibs.indexOf(e.target), 0), 6) * 55 + 'ms';
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.reveal').forEach(el => {
  if (el.getBoundingClientRect().top < innerHeight * 0.96) el.classList.add('in');
  else io.observe(el);
});

// Skip link moves focus into the content, not just the scroll position
document.querySelector('.skip')?.addEventListener('click', e => {
  const t = document.querySelector(e.currentTarget.hash);
  if (!t) return;
  e.preventDefault();
  t.setAttribute('tabindex', '-1');
  t.focus({ preventScroll: true });
  t.scrollIntoView({ block: 'start' });
});

// ---- expandable chip lists (case-study site maps) ----
document.querySelectorAll('.morebtn').forEach(b => {
  b.addEventListener('click', () => {
    const open = b.closest('.ch').classList.toggle('open');
    b.textContent = open ? '− less' : b.dataset.more;
    b.setAttribute('aria-expanded', open);
  });
});

// ---- nav: a frosted bar once the page scrolls, light or dark to match the section under it ----
const nav = document.querySelector('nav');
if (nav) {
  let queued = false;
  // on the home page, underline the link of the section you're in
  const spots = [...nav.querySelectorAll('a[href^="#"]')]
    .map(a => [a, document.querySelector(a.getAttribute('href'))]).filter(([, sec]) => sec && sec.id !== 'home');
  const markNav = () => {
    const line = innerHeight * .3;
    spots.forEach(([a, sec]) => {
      const r = sec.getBoundingClientRect();
      if (r.top <= line && r.bottom > line) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  };
  const paintNav = () => {
    queued = false;
    const scrolled = scrollY > 8;
    nav.classList.toggle('scrolled', scrolled);
    if (!scrolled) { markNav(); return; }
    // the nav ignores the pointer, so this finds the page under its left edge
    const under = document.elementFromPoint(2, nav.offsetHeight / 2)?.closest('.light, .ink');
    nav.classList.toggle('on-ink', !under || under.classList.contains('ink'));
    markNav();
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(paintNav); } }, { passive: true });
  addEventListener('resize', paintNav);
  paintNav();
}

// ---- live Dubai time in the nav ----
const clock = document.querySelector('.nav-r .m');
if (clock) {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', hour12: false });
  const tick = () => { clock.textContent = `Dubai, ${fmt.format(new Date())} GMT+4`; };
  tick();
  setInterval(tick, 15000);
}

// ---- hero: the outlined line fills in solid under the pointer ----
// A solid copy of the line sits on top, masked to a circle that follows the
// pointer (or a tap on touch screens).
const solid = document.querySelector('.giant .solid');
if (solid) {
  const line = solid.parentElement;
  const cur = { x: 0, y: 0, r: 0 }, tgt = { x: 0, y: 0, r: 0 };
  let running = false;
  const frame = () => {
    for (const p of ['x', 'y', 'r']) cur[p] += (tgt[p] - cur[p]) * .18;
    const settled = ['x', 'y', 'r'].every(p => Math.abs(tgt[p] - cur[p]) < .5);
    if (settled) Object.assign(cur, tgt);
    solid.style.setProperty('--mx', cur.x + 'px');
    solid.style.setProperty('--my', cur.y + 'px');
    solid.style.setProperty('--r', cur.r + 'px');
    if (settled) running = false;
    else requestAnimationFrame(frame);
  };
  const wake = () => { if (!running) { running = true; requestAnimationFrame(frame); } };
  const aim = (e, on) => {
    const b = line.getBoundingClientRect();
    tgt.x = e.clientX - b.left; tgt.y = e.clientY - b.top; tgt.r = on ? line.offsetHeight * .85 : 0;
    if (!cur.r) { cur.x = tgt.x; cur.y = tgt.y; }
    wake();
  };
  const h1 = line.closest('.giant');
  h1.addEventListener('pointermove', e => aim(e, true));
  h1.addEventListener('pointerleave', e => aim(e, false));
  h1.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    aim(e, true);
    setTimeout(() => { tgt.r = 0; wake(); }, 650);
  });
}

// ---- typed last word (intro headline, and "…builds it." in the approach) ----
// Each word holds, backspaces, and the next one types in. Screen readers get
// the static first word (the animated word is aria-hidden). Per element:
// data-words, data-hold (ms each word stays), data-hold-first (ms for the
// first word, default data-hold), data-delay (ms before the first change,
// counted from when it is first on screen; default data-hold-first).
// data-langs (optional) pairs each word with the language codes it greets
// (space-separated); the visitor's first browser language with a match moves
// its word to the front, so an Arabic browser opens on مرحبا. Runs with
// reduced motion too, where that word is simply the one shown.
document.querySelectorAll('.tw[data-langs]').forEach(tw => {
  const words = JSON.parse(tw.dataset.words), langs = JSON.parse(tw.dataset.langs);
  const want = (navigator.languages?.length ? navigator.languages : [navigator.language || ''])
    .map(l => l.toLowerCase().split('-')[0]);
  let k = -1, lang = '';
  for (lang of want) if ((k = langs.findIndex(c => c.split(' ').includes(lang))) >= 0) break;
  if (k <= 0) return;
  words.unshift(...words.splice(k, 1));
  tw.dataset.words = JSON.stringify(words);
  tw.querySelector('.tw-word').textContent = words[0];
  const vh = tw.querySelector('.vh');
  vh.textContent = words[0];
  vh.lang = lang;
});
if (!reduce) document.querySelectorAll('.tw').forEach(tw => {
  const word = tw.querySelector('.tw-word');
  const words = JSON.parse(tw.dataset.words);
  if (words.length < 2) return;   // one word: static, caret just blinks
  const hold = +tw.dataset.hold || 2200, holdFirst = +tw.dataset.holdFirst || hold;
  let i = 0, visible = false, started = false, parked = null;
  // pause while off-screen; pick up where it left off
  const later = (fn, ms) => setTimeout(() => { if (visible) fn(); else parked = fn; }, ms);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!visible) return;
    if (!started) { started = true; later(erase, +tw.dataset.delay || holdFirst); }
    else if (parked) { const fn = parked; parked = null; fn(); }
  }).observe(tw);
  const erase = () => {
    tw.classList.add('typing');
    if (word.textContent) { word.textContent = word.textContent.slice(0, -1); later(erase, 55); }
    else { i = (i + 1) % words.length; later(type, 280); }
  };
  const type = () => {
    const target = words[i], n = word.textContent.length;
    if (n < target.length) { word.textContent = target.slice(0, n + 1); later(type, 80 + Math.random() * 60); }
    else { tw.classList.remove('typing'); later(erase, i === 0 ? holdFirst : hold); }
  };
});

// ---- design canvas: any [data-canvas] section ----
// Hovering a [data-layer] element selects it like a layer in a design tool (box,
// corner handles, W × H); data-layer="text" measures the text itself rather than
// the element's box. data-canvas-auto names one element to select on its own the
// first time it is on screen (after data-canvas-delay ms, for data-canvas-hold ms),
// so touch screens see it too. With a mouse, guides and an x/y readout follow the pointer and the dot
// canvas brightens around it. All of it is decorative and aria-hidden.
const layerBox = (el, asText) => {
  if (!asText && el.dataset.layer !== 'text') return el.getBoundingClientRect();
  // the glyph runs plus inline boxes such as the caret, minus screen-reader-only copies
  let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
  const add = q => {
    if (!q.width) return;
    l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom);
  };
  const range = document.createRange();
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: n => n.nodeType === 1 && n.classList.contains('vh') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
  });
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    if (n.nodeType === 3) { range.selectNodeContents(n); for (const q of range.getClientRects()) add(q); }
    else if (!n.firstChild) add(n.getBoundingClientRect());
  }
  // vertically a text layer is its line boxes, not the font's taller content area
  let blk = el;
  while (blk.parentElement && getComputedStyle(blk).display === 'inline') blk = blk.parentElement;
  const k = blk.getBoundingClientRect();
  if (l > r) return k;
  t = Math.max(t, k.top); b = Math.min(b, k.bottom);
  return { left: l, top: t, width: r - l, height: Math.max(0, b - t) };
};
document.querySelectorAll('[data-canvas]').forEach(sec => {
  const sel = document.createElement('div');
  sel.className = 'sel';
  sel.setAttribute('aria-hidden', 'true');
  sel.innerHTML = '<i></i><i></i><i></i><i></i><b></b>';
  sec.append(sel);
  const size = sel.querySelector('b');
  let hideT = 0, current = null, asText = false;
  const place = () => {
    const a = sec.getBoundingClientRect(), r = layerBox(current, asText), pad = 8;
    sel.style.left = r.left - a.left - pad + 'px';
    sel.style.top = r.top - a.top - pad + 'px';
    sel.style.width = r.width + pad * 2 + 'px';
    sel.style.height = r.height + pad * 2 + 'px';
    const wh = `${Math.round(r.width)} × ${Math.round(r.height)}`;
    if (size.textContent !== wh) size.textContent = wh;
  };
  const select = (el, text = false) => {
    clearTimeout(hideT); current = el; asText = text; place(); sel.classList.add('on');
  };
  const release = (ms = 150) => {
    clearTimeout(hideT);
    hideT = setTimeout(() => { sel.classList.remove('on'); current = null; }, ms);
  };
  sec.querySelectorAll('[data-layer]').forEach(t => {
    t.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') select(t); });
    t.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') release(); });
  });
  addEventListener('resize', () => { if (current) place(); });
  // the box follows text that changes under it (the typed words), like an auto-width text layer
  let follow = false;
  const ours = r => (r.target.nodeType === 1 ? r.target : r.target.parentElement).closest('.sel,.tool');
  new MutationObserver(recs => {
    if (!current || follow || recs.every(ours)) return;
    follow = true;
    requestAnimationFrame(() => { follow = false; if (current) place(); });
  }).observe(sec, { subtree: true, childList: true, characterData: true });
  // and re-measures once a reveal or entrance animation under it settles
  const settle = e => { if (current && !e.target.closest('.sel,.tool')) place(); };
  sec.addEventListener('animationend', settle);
  sec.addEventListener('transitionend', settle);

  const auto = sec.dataset.canvasAuto && sec.querySelector(sec.dataset.canvasAuto);
  if (auto) {
    const watch = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      watch.disconnect();
      setTimeout(() => {
        if (current) return;              // someone is already hovering a layer
        select(auto, true);
        release(+sec.dataset.canvasHold || 1900);
      }, reduce ? 300 : +sec.dataset.canvasDelay || 900);
    }, { threshold: .6 });
    watch.observe(auto);
  }

  if (!finePointer) return;
  const tool = document.createElement('div');
  tool.className = 'tool';
  tool.setAttribute('aria-hidden', 'true');
  tool.innerHTML = '<div class="tool-glow"></div><span class="tool-gx"></span><span class="tool-gy"></span><span class="tool-tag"></span>';
  sec.prepend(tool);
  const tag = tool.lastChild;
  let queued = false, mx = 0, my = 0;
  sec.addEventListener('pointermove', e => {
    const a = sec.getBoundingClientRect();
    mx = e.clientX - a.left; my = e.clientY - a.top;
    tool.classList.add('on');
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      tool.style.setProperty('--mx', mx + 'px');
      tool.style.setProperty('--my', my + 'px');
      tag.textContent = `x ${Math.round(mx)}  y ${Math.round(my)}`;
    });
  });
  sec.addEventListener('pointerleave', () => tool.classList.remove('on'));
});

// ---- the intro portrait drifts slightly against the pointer ----
const heroImg = document.querySelector('.intro-photo img');
if (heroImg && finePointer && !reduce) {
  const hero = heroImg.closest('.intro');
  let queued = false, rx = .5;
  hero.addEventListener('pointermove', e => {
    const a = hero.getBoundingClientRect();
    rx = (e.clientX - a.left) / a.width;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; heroImg.style.translate = `${(rx - .5) * -18}px 0`; });
  });
  hero.addEventListener('pointerleave', () => { heroImg.style.translate = ''; });
}

// ---- marquee: drifts on its own, speeds up and follows scroll direction ----
const mq = document.querySelector('.marquee');
const track = mq?.querySelector('.track');
if (track && !reduce) {
  mq.classList.add('js');
  let x = 0, dir = -1, boost = 0, speed = 1, lastY = scrollY, half = 0, prev = 0, hover = false, visible = false, running = false;
  const measure = () => { half = track.scrollWidth / 2; };
  measure();
  new ResizeObserver(measure).observe(track);
  addEventListener('scroll', () => {
    const dy = scrollY - lastY; lastY = scrollY;
    if (dy) { dir = dy > 0 ? -1 : 1; boost = Math.min(boost + Math.abs(dy) * .12, 12); }
  }, { passive: true });
  mq.addEventListener('pointerenter', () => { hover = true; });
  mq.addEventListener('pointerleave', () => { hover = false; });
  const frame = t => {
    const dt = prev ? Math.min(t - prev, 50) : 16; prev = t;
    boost *= .93;
    speed += ((hover ? 0 : 1 + boost) - speed) * .08;
    x += dir * speed * (half / 26000) * dt;     // 26s per loop at rest, like the CSS version
    if (x <= -half) x += half;
    if (x > 0) x -= half;
    track.style.transform = `translate3d(${x}px,0,0)`;
    if (visible) requestAnimationFrame(frame);
    else { running = false; prev = 0; }
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !running) { running = true; requestAnimationFrame(frame); }
  }).observe(mq);
}

// ---- work rows: a screenshot follows the pointer over case-study rows ----
const peekRows = document.querySelectorAll('.wrow[data-peek]');
if (peekRows.length && finePointer) {
  const peek = document.createElement('div');
  peek.className = 'peek';
  peek.setAttribute('aria-hidden', 'true');
  peek.innerHTML = '<img alt="" width="750" height="386">';
  document.body.append(peek);
  const img = peek.firstChild;
  peekRows.forEach(r => { new Image().src = r.dataset.peek; });   // ~13 KB each, so no blank first frame
  let px = 0, py = 0, tx = 0, ty = 0, active = null, running = false;
  const frame = () => {
    px += (tx - px) * .2; py += (ty - py) * .2;
    const w = peek.offsetWidth, h = peek.offsetHeight;
    let x = px + 28;
    if (x + w > innerWidth - 16) x = px - w - 28;
    peek.style.translate = `${x}px ${Math.min(Math.max(py - h / 2, 16), innerHeight - h - 16)}px`;
    peek.style.rotate = Math.max(-6, Math.min(6, (tx - px) * .05)) + 'deg';
    if (active || Math.abs(tx - px) > .5 || Math.abs(ty - py) > .5) requestAnimationFrame(frame);
    else running = false;
  };
  // Re-check on scroll too: the row under a still mouse changes as the page moves
  const sync = () => {
    const row = document.elementFromPoint(tx, ty)?.closest('.wrow[data-peek]') || null;
    if (row === active) return;
    if (row) {
      if (!active) { px = tx; py = ty; }
      img.src = row.dataset.peek;
    }
    active = row;
    peek.classList.toggle('on', !!row);
    if (!running) { running = true; requestAnimationFrame(frame); }
  };
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; sync(); }, { passive: true });
  addEventListener('scroll', sync, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { tx = -999; sync(); });
}

// ---- buttons lean toward the pointer ----
if (finePointer && !reduce) {
  document.querySelectorAll('.btn, .clink, .livelink').forEach(el => {
    el.addEventListener('pointermove', e => {
      const b = el.getBoundingClientRect();
      el.style.translate = `${(e.clientX - b.left - b.width / 2) * .22}px ${(e.clientY - b.top - b.height / 2) * .3}px`;
    });
    el.addEventListener('pointerleave', () => { el.style.translate = ''; });
  });
}

// ---- copy email ----
document.querySelectorAll('[data-copy]').forEach(b => {
  const label = b.textContent;
  b.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      b.textContent = 'Copied ✓';
    } catch {
      b.textContent = b.dataset.copy;       // clipboard blocked: show it so it can be selected
    }
    setTimeout(() => { b.textContent = label; }, 2000);
  });
});

// ---- case pages: reading progress + current section in the nav ----
const caseEl = document.querySelector('.case');
if (caseEl) {
  const bar = document.createElement('div');
  bar.className = 'progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.append(bar);
  const heads = [...caseEl.querySelectorAll('.case-body h2')];
  const navR = document.querySelector('.nav-r');
  const chap = document.createElement('span');
  chap.className = 'chap';
  chap.setAttribute('aria-hidden', 'true');
  navR?.prepend(chap);
  const pad = n => String(n).padStart(2, '0');
  let queued = false;
  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
    let at = -1;
    heads.forEach((h, i) => { if (h.getBoundingClientRect().top < innerHeight * .35) at = i; });
    navR?.classList.toggle('has-chap', at >= 0);
    if (at >= 0) chap.textContent = `${pad(at + 1)}/${pad(heads.length)}  ${heads[at].textContent}`;
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
}

// ---- screenshot lightbox: click any case-study screenshot to see it full size ----
const shots = [...document.querySelectorAll('.shot')];
if (shots.length) {
  const dlg = document.createElement('dialog');
  dlg.className = 'lb';
  dlg.setAttribute('aria-label', 'Screenshot viewer');
  dlg.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure>' +
    '<div class="lb-bar"><span class="lb-n"></span><span>' +
    '<button type="button" class="lb-prev" aria-label="Previous screenshot">←</button>' +
    '<button type="button" class="lb-next" aria-label="Next screenshot">→</button>' +
    '<button type="button" class="lb-x">Close</button></span></div>';
  document.body.append(dlg);
  const big = dlg.querySelector('img'), cap = dlg.querySelector('figcaption'), count = dlg.querySelector('.lb-n');
  let at = 0;
  // largest source available: the full-size WebP if there is one, else the JPG
  const fullSrc = fig => fig.querySelector('source')?.srcset.split(',').pop().trim().split(' ')[0] || fig.querySelector('img').src;
  const show = i => {
    at = (i + shots.length) % shots.length;
    const f = shots[at];
    big.src = fullSrc(f);
    big.alt = f.querySelector('img').alt;
    cap.textContent = f.querySelector('figcaption')?.textContent || '';
    count.textContent = `${at + 1} / ${shots.length}`;
  };
  shots.forEach((f, i) => {
    const media = f.querySelector('picture') || f.querySelector('img');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'zoom';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-label', 'Enlarge: ' + f.querySelector('img').alt);
    media.replaceWith(btn);
    btn.append(media);
    btn.addEventListener('click', () => {
      show(i);
      dlg.showModal();
      document.documentElement.classList.add('lb-open');
    });
  });
  dlg.querySelector('.lb-prev').addEventListener('click', () => show(at - 1));
  dlg.querySelector('.lb-next').addEventListener('click', () => show(at + 1));
  dlg.querySelector('.lb-x').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.tagName === 'FIGURE') dlg.close(); });
  dlg.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') show(at - 1);
    if (e.key === 'ArrowRight') show(at + 1);
  });
  dlg.addEventListener('close', () => document.documentElement.classList.remove('lb-open'));
}

// ---- at a glance: the design process, as a timeline you can play and scrub ----
// While on screen it plays: the fill runs toward the next step like a playhead and
// each step replays its scene. Click a step, drag along the track or use the arrow
// keys to move; hovering or focusing the card holds it, the button pauses for good.
// Reduced motion: it starts paused and the scenes are still pictures.
document.querySelectorAll('.bx-process').forEach(card => {
  const track = card.querySelector('.steps'), tabs = [...track.querySelectorAll('[role=tab]')];
  const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));
  const btn = card.querySelector('.ps-play'), n = tabs.length, dwell = 3800;
  let at = 0, t = 0, last = 0, raf = 0, seen = false, held = false, paused = reduce, drag = false;
  const paint = p => track.style.setProperty('--p', p);
  const show = (i, focus) => {
    if (i !== at || !panels[i].classList.contains('play')) {
      panels.forEach((pn, j) => { pn.hidden = j !== i; pn.classList.remove('play'); });
      void panels[i].offsetWidth;            // restart the scene's animations
      panels[i].classList.add('play');
    }
    at = i; t = 0;
    tabs.forEach((tab, j) => {
      tab.setAttribute('aria-selected', j === i);
      tab.tabIndex = j === i ? 0 : -1;
      tab.classList.toggle('done', j < i);
    });
    if (focus) tabs[i].focus();
    paint(i / (n - 1));
  };
  const playing = () => seen && !held && !paused && !drag;
  const tick = now => {
    raf = 0;
    if (!playing()) return;
    t += Math.min(now - last, 100) / dwell; last = now;
    if (t >= 1) show((at + 1) % n);
    else if (at < n - 1) paint((at + t) / (n - 1));
    raf = requestAnimationFrame(tick);
  };
  const run = () => { if (playing() && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  const label = () => {
    btn.classList.toggle('paused', paused);
    btn.lastChild.textContent = paused ? 'Play' : 'Pause';
    btn.setAttribute('aria-label', paused ? 'Play the walkthrough' : 'Pause the walkthrough');
  };
  show(0); label();

  btn.addEventListener('click', () => { paused = !paused; label(); run(); });
  tabs.forEach((tab, i) => tab.addEventListener('click', () => show(i)));
  track.addEventListener('keydown', e => {
    const k = { ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: n - 1 }[e.key];
    if (k === undefined) return;
    e.preventDefault();
    show((k + n) % n, true);
  });
  // drag anywhere on the track to scrub; it snaps to the nearest step on release
  const ratio = e => {
    const r = track.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - r.left - r.width * .1) / (r.width * .8)));
  };
  const scrub = e => {
    const p = ratio(e), i = Math.round(p * (n - 1));
    if (i !== at) show(i);
    paint(p);
  };
  track.addEventListener('pointerdown', e => {
    if (e.button) return;
    drag = true; card.classList.add('dragging');
    track.setPointerCapture(e.pointerId);
    scrub(e);
  });
  track.addEventListener('pointermove', e => { if (drag) scrub(e); });
  const drop = () => {
    if (!drag) return;
    drag = false; card.classList.remove('dragging');
    show(at); run();
  };
  track.addEventListener('pointerup', drop);
  track.addEventListener('pointercancel', drop);
  // hold while someone is reading it
  card.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') held = true; });
  card.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { held = false; run(); } });
  card.addEventListener('focusin', () => { held = true; });
  card.addEventListener('focusout', e => { if (!card.contains(e.relatedTarget)) { held = false; run(); } });
  let first = true;   // the opening scene plays when the card is first seen, not on load
  new IntersectionObserver(([e]) => {
    seen = e.isIntersecting;
    if (seen && first) { first = false; panels[at].classList.remove('play'); show(at); }
    run();
  }, { threshold: .35 }).observe(card);
});

// ---- custom pointer (mouse only) ----
// The multiplayer arrow from the cards, following the mouse exactly (no easing, so it
// never feels laggy). Over something clickable it grows, and a pill says what a click
// does; data-cursor="…" on any element sets that text (the collaboration card says "You").
// The system cursor stays until the first mouse move, so a freshly loaded page is
// never left without a visible pointer.
if (finePointer) {
  const make = (cls, html) => {
    const el = document.createElement('div');
    el.className = cls;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = html;
    document.body.append(el);
    return el;
  };
  // two layers: the arrow inverts over what's under it, the pill stays solid
  const cur = make('cursor', '<svg viewBox="0 0 16 16"><path d="M2 1.5l11 5.2-4.6 1.5-2 4.6z"/></svg>');
  const tag = make('cursor-pill', '<b></b>');
  const pill = tag.firstChild, root = document.documentElement;
  const say = el => {
    const t = el.closest?.('[data-cursor], a, button, .steps');
    if (!t) return null;
    if (t.dataset.cursor) return t.dataset.cursor;
    if (t.closest('.steps')) return 'Drag';
    if (t.matches('.zoom')) return 'Zoom';
    if (t.matches('.ccopy')) return 'Copy';
    const h = t.getAttribute('href') || '';
    if (t.hasAttribute('download')) return 'Download';
    if (h.startsWith('mailto:')) return 'Email';
    if (h.startsWith('tel:')) return 'Call';
    if (t.target === '_blank') return 'Visit ↗';
    if (h.startsWith('/work/')) return 'View case';
    return '';                                  // any other link or button: the arrow just grows
  };
  let over = null;
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    cur.style.translate = tag.style.translate = `${e.clientX}px ${e.clientY}px`;
    if (!cur.classList.contains('on')) { cur.classList.add('on'); tag.classList.add('on'); root.classList.add('cur-on'); }
    if (e.target === over) return;
    over = e.target;
    const text = say(over);
    if (text) pill.textContent = text;
    tag.classList.toggle('label', !!text);
    cur.classList.toggle('hot', text !== null);
  }, { passive: true });
  const hide = () => { cur.classList.remove('on'); tag.classList.remove('on'); };
  root.addEventListener('mouseleave', hide);
  addEventListener('blur', hide);
  addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') cur.classList.add('press'); });
  addEventListener('pointerup', () => cur.classList.remove('press'));
}

// ---- page transitions (cross-document View Transitions, where supported) ----
// Every case title is named `case-title` in CSS. Going home → case, the clicked
// row's title takes the name too, so it morphs into the big case title.
addEventListener('pageswap', e => {
  if (!e.viewTransition || !e.activation?.entry) return;
  const to = new URL(e.activation.entry.url);
  const title = document.querySelector('.case-title');
  // leaving a case page from far down: don't fly the title in from off-screen
  if (title && title.getBoundingClientRect().bottom < 0) title.style.viewTransitionName = 'none';
  const row = document.querySelector(`.rowlink[href="${to.pathname}"]`)?.closest('.wrow');
  if (row) row.querySelector('h3').style.viewTransitionName = 'case-title';
});
// back/forward cache restores the page as we left it — clear the temporary names
addEventListener('pageshow', e => {
  if (e.persisted) document.querySelectorAll('.wrow h3, .case-title').forEach(el => { el.style.viewTransitionName = ''; });
});

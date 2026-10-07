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

// ---- intro: the last word of the headline types through a few endings ----
// Each word holds, backspaces, and the next one types in. Screen readers get
// the static first word (the animated word is aria-hidden).
const tw = document.querySelector('.tw');
if (tw && !reduce) {
  const word = tw.querySelector('.tw-word');
  const words = JSON.parse(tw.dataset.words);
  let i = 0, visible = true, parked = null;
  // pause while the hero is off-screen; pick up where it left off
  const later = (fn, ms) => setTimeout(() => { if (visible) fn(); else parked = fn; }, ms);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && parked) { const fn = parked; parked = null; fn(); }
  }).observe(tw);
  const erase = () => {
    tw.classList.add('typing');
    if (word.textContent) { word.textContent = word.textContent.slice(0, -1); later(erase, 55); }
    else { i = (i + 1) % words.length; later(type, 280); }
  };
  const type = () => {
    const target = words[i], n = word.textContent.length;
    if (n < target.length) { word.textContent = target.slice(0, n + 1); later(type, 80 + Math.random() * 60); }
    else { tw.classList.remove('typing'); later(erase, 2200); }
  };
  later(erase, 2600);
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

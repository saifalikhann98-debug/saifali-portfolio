// Shared behaviour for every page. Loaded with `defer`, so the DOM is parsed.

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

// Résumé button appears only if /resume.pdf actually exists
const rdl = document.querySelector('.rdl');
if (rdl) fetch('/resume.pdf', { method: 'HEAD' }).then(r => { if (r.ok) rdl.hidden = false; }).catch(() => {});

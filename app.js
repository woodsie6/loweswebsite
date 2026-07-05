/* ════════════════════════════════════════════
   Lowes Building Services — interaction engine
   Vanilla JS · rAF-driven scroll scrub · no deps
   ════════════════════════════════════════════ */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─── Load-in (kinetic hero) ─── */
window.addEventListener('load', () => {
  requestAnimationFrame(() => document.body.classList.add('is-loaded'));
});
// Fallback in case load stalls on a slow asset
setTimeout(() => document.body.classList.add('is-loaded'), 2500);

/* ─── Blueprint line art: prep shapes for draw-in animation ─── */
if (!prefersReducedMotion) {
  document.querySelectorAll('.blueprint').forEach((svg) => {
    svg.querySelectorAll('path, rect, circle, line').forEach((shape, i) => {
      if (shape.classList.contains('f-amber')) return;
      shape.setAttribute('pathLength', '1');
      shape.style.strokeDasharray = '1';
      shape.style.strokeDashoffset = '1';
      shape.style.setProperty('--n', i);
    });
  });
}

/* ─── Reveal on scroll ─── */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -5% 0px' }
);

document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

/* ─── Animated counters ─── */
const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      const target = Number(el.dataset.count);
      const start = Number(el.dataset.start) || 0;
      const duration = 1800;
      const startTime = performance.now();

      const animate = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        el.textContent = Math.round(start + (target - start) * eased);
        if (progress < 1) requestAnimationFrame(animate);
      };

      if (prefersReducedMotion) {
        el.textContent = target;
      } else {
        requestAnimationFrame(animate);
      }
      counterObserver.unobserve(el);
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll('[data-count]').forEach((el) => counterObserver.observe(el));

/* ─── Scroll engine (single rAF loop for all scrub effects) ─── */
const header = document.getElementById('site-header');
const progressBar = document.getElementById('scroll-progress-bar');
const hero = document.getElementById('hero');
const heroSticky = hero ? hero.querySelector('.hero-sticky') : null;
const timeline = document.getElementById('timeline');
const timelineLine = document.getElementById('timeline-line');
const stackItems = document.querySelectorAll('.stack-item');

const clamp01 = (v) => Math.min(1, Math.max(0, v));

let lastY = window.scrollY;
let ticking = false;

function update() {
  ticking = false;
  const y = window.scrollY;
  const vh = window.innerHeight;
  const doc = document.documentElement;

  /* Progress bar */
  if (progressBar) {
    const max = doc.scrollHeight - vh;
    progressBar.style.transform = `scaleX(${max > 0 ? clamp01(y / max) : 0})`;
  }

  /* Header: solid after leaving hero, hide on scroll down */
  if (header) {
    const heroBottom = hero ? hero.offsetTop + (heroSticky ? heroSticky.offsetHeight : vh) * 0.85 : 80;
    header.classList.toggle('is-solid', y > heroBottom - header.offsetHeight);

    const goingDown = y > lastY;
    const pastTop = y > 200;
    const menuOpen = document.body.classList.contains('menu-open');
    header.classList.toggle('is-hidden', goingDown && pastTop && !menuOpen);
  }

  if (!prefersReducedMotion) {
    /* Hero scrub: 0 at top, 1 when the pin has fully scrolled */
    if (hero) {
      const range = hero.offsetHeight - vh;
      const p = range > 0 ? clamp01((y - hero.offsetTop) / range) : 0;
      hero.style.setProperty('--p', p.toFixed(4));
    }

    /* Timeline draw */
    if (timeline && timelineLine) {
      const rect = timeline.getBoundingClientRect();
      const p = clamp01((vh * 0.72 - rect.top) / rect.height);
      timelineLine.style.transform = `scaleY(${p.toFixed(4)})`;
    }

    /* Sticky-stack: scale a card down as the next one covers it */
    stackItems.forEach((item, i) => {
      const next = stackItems[i + 1];
      const card = item.querySelector('.stack-card');
      if (!card) return;
      if (!next) {
        card.style.setProperty('--sp', 0);
        return;
      }
      const nextTop = next.getBoundingClientRect().top;
      const sp = clamp01(1 - (nextTop - header.offsetHeight) / (vh * 0.7));
      card.style.setProperty('--sp', sp.toFixed(4));
    });
  }

  lastY = y;
}

function onScroll() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(update);
  }
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });
update();

/* ─── Mobile menu ─── */
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

if (menuToggle && mobileMenu) {
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileMenu.setAttribute('aria-hidden', String(!open));
    if (open) header.classList.remove('is-hidden');
  };

  menuToggle.addEventListener('click', () => {
    setMenu(!document.body.classList.contains('menu-open'));
  });

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });
}

/* ─── Magnetic buttons (fine pointers only) ─── */
if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const strength = 0.25;

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * strength;
      const yOff = (e.clientY - rect.top - rect.height / 2) * strength;
      el.style.transform = `translate(${x.toFixed(1)}px, ${yOff.toFixed(1)}px)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
}

/* ─── Email obfuscation ─── */
const emailLink = document.getElementById('email-link');
const emailText = document.getElementById('email-text');
if (emailLink && emailText) {
  const user = 'enquiries';
  const domain = 'lowesbuildingservices.co.uk';
  const addr = user + '@' + domain;
  emailLink.href = 'mailto:' + addr;
  emailText.textContent = addr;
}

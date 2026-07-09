/* ════════════════════════════════════════════
   Lowes Building Services — interaction engine
   Vanilla JS · rAF-driven scroll scrub · no deps
   ════════════════════════════════════════════ */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const currentYear = new Date().getFullYear();

/* ─── Durable date-derived copy ─── */
document.querySelectorAll('[data-current-year]').forEach((el) => {
  el.textContent = currentYear;
});

document.querySelectorAll('[data-business-age]').forEach((el) => {
  const founded = Number(el.dataset.founded);
  if (Number.isFinite(founded)) el.textContent = `for ${currentYear - founded} years`;
});

document.querySelectorAll('[data-business-age-short]').forEach((el) => {
  const founded = Number(el.dataset.founded);
  if (Number.isFinite(founded)) el.textContent = `${currentYear - founded}+ years of delivery`;
});

/* ─── Load-in (kinetic hero) ───
   Reveal as soon as the DOM is ready. We deliberately do NOT wait for the
   window 'load' event: it blocks on every asset (web fonts, images), so a
   slow font could leave the hero hidden for seconds and cause a flash.
   The double rAF lets the hidden initial state paint once so the transition
   plays smoothly. */
requestAnimationFrame(() =>
  requestAnimationFrame(() => document.body.classList.add('is-loaded'))
);

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
const revealElements = document.querySelectorAll('[data-reveal]');

if ('IntersectionObserver' in window && !prefersReducedMotion) {
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

  document.documentElement.classList.add('reveal-ready');
  revealElements.forEach((el) => revealObserver.observe(el));
} else {
  revealElements.forEach((el) => el.classList.add('is-visible'));
}

/* ─── Animated counters ─── */
const counterElements = document.querySelectorAll('[data-count], [data-count-from-year]');
const getCounterTarget = (el) => {
  if (el.dataset.countFromYear) return currentYear - Number(el.dataset.countFromYear);
  return Number(el.dataset.count);
};

const setCounterFinalValue = (el) => {
  const target = getCounterTarget(el);
  if (Number.isFinite(target)) el.textContent = target;
};

if ('IntersectionObserver' in window) {
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const target = getCounterTarget(el);
        const start = Number(el.dataset.start) || 0;
        const duration = 1800;
        const startTime = performance.now();

        if (!Number.isFinite(target)) {
          counterObserver.unobserve(el);
          return;
        }

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

  counterElements.forEach((el) => counterObserver.observe(el));
} else {
  counterElements.forEach(setCounterFinalValue);
}

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
const mobileMenuClose = document.getElementById('mobile-menu-close');
const mobileBreakpoint = window.matchMedia('(max-width: 640px)');

if (menuToggle && mobileMenu && mobileMenuClose) {
  const pageRegions = [header, document.querySelector('main'), document.querySelector('footer')].filter(Boolean);
  let menuWasOpened = false;

  const getMenuFocusables = () => Array.from(
    mobileMenu.querySelectorAll('a[href], button:not([disabled])')
  ).filter((el) => !el.hidden && el.getClientRects().length > 0);

  const setMenu = (open, { restoreFocus = true } = {}) => {
    document.body.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
    if (open) {
      mobileMenu.setAttribute('role', 'dialog');
      mobileMenu.setAttribute('aria-modal', 'true');
    } else {
      mobileMenu.removeAttribute('role');
      mobileMenu.removeAttribute('aria-modal');
    }
    pageRegions.forEach((region) => { region.inert = open; });

    if (open) {
      menuWasOpened = true;
      header.classList.remove('is-hidden');
      requestAnimationFrame(() => mobileMenuClose.focus());
    } else if (restoreFocus && menuWasOpened) {
      menuWasOpened = false;
      menuToggle.focus({ preventScroll: true });
    }
  };

  menuToggle.addEventListener('click', () => {
    setMenu(true);
  });

  mobileMenuClose.addEventListener('click', () => setMenu(false));

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  mobileMenu.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      const focusables = getMenuFocusables();
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    if (e.key === 'Escape') setMenu(false);
  });

  mobileBreakpoint.addEventListener('change', (event) => {
    if (!event.matches) setMenu(false, { restoreFocus: false });
  });

  setMenu(false, { restoreFocus: false });
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

/* Mark the enhanced mobile navigation ready only after all setup succeeds. */
document.documentElement.classList.add('app-ready');

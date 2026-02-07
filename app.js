/* ─── Scroll Reveal ─── */
const revealItems = document.querySelectorAll('.section-reveal');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

revealItems.forEach((item) => observer.observe(item));

/* ─── Animated Counters ─── */
const counterEls = document.querySelectorAll('[data-count]');

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      const target = Number(el.dataset.count);
      const start = Number(el.dataset.start) || 0;
      const suffix = el.dataset.suffix || '';
      const duration = 1600;
      const startTime = performance.now();

      el.textContent = start + suffix;

      const animate = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(start + (target - start) * eased);
        el.textContent = current + suffix;

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
      counterObserver.unobserve(el);
    });
  },
  { threshold: 0.5 }
);

counterEls.forEach((el) => counterObserver.observe(el));

/* ─── Email Obfuscation ─── */
const emailLink = document.getElementById('email-link');
const emailText = document.getElementById('email-text');
if (emailLink && emailText) {
  const user = 'enquiries';
  const domain = 'lowesbuildingservices.co.uk';
  const addr = user + '@' + domain;
  emailLink.href = 'mailto:' + addr;
  emailText.textContent = addr;
}

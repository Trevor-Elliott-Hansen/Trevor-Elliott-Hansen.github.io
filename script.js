// ========================================
// SCROLL REVEAL — direction-aware parallax
// ========================================
let lastScrollY = window.scrollY;
let scrollDirection = 'down';

window.addEventListener('scroll', () => {
  scrollDirection = window.scrollY > lastScrollY ? 'down' : 'up';
  lastScrollY = window.scrollY;
}, { passive: true });

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const parent = entry.target.parentElement;
        const siblings = parent ? Array.from(parent.querySelectorAll('.reveal')) : [];
        const siblingIndex = siblings.indexOf(entry.target);
        const delay = siblingIndex > 0 ? siblingIndex * 100 : 0;

        // Set entry direction so CSS knows which way to animate in
        entry.target.classList.remove('from-above', 'from-below');
        entry.target.classList.add(scrollDirection === 'up' ? 'from-above' : 'from-below');

        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
      } else {
        entry.target.classList.remove('visible');
      }
    });
  },
  { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
);

document.querySelectorAll('.reveal').forEach((el) => {
  el.classList.add('from-below'); // default hidden state: below
  revealObserver.observe(el);
});

// ========================================
// METRIC COUNT-UP
// ========================================
let metricsCounted = false;

const metricsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !metricsCounted) {
        metricsCounted = true;
        animateMetrics();
        metricsObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.3 }
);

const metricsEl = document.querySelector('.metrics');
if (metricsEl) {
  metricsObserver.observe(metricsEl);
}

function animateMetrics() {
  document.querySelectorAll('.metric-number').forEach((el) => {
    const target = parseInt(el.dataset.target, 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 1200;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      // Format with commas for numbers >= 1000
      const formatted = current >= 1000
        ? current.toLocaleString()
        : current.toString();

      el.textContent = prefix + formatted + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  });
}

// ========================================
// NAV SCROLL SPY
// ========================================
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

const spyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach((link) => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') === `#${id}`
          );
        });
      }
    });
  },
  { threshold: 0.2, rootMargin: '-72px 0px -50% 0px' }
);

sections.forEach((section) => {
  spyObserver.observe(section);
});

// (Timeline expand/collapse removed — details always visible)

// ========================================
// MOBILE NAV TOGGLE
// ========================================
const navToggle = document.querySelector('.nav-toggle');
const navLinksContainer = document.querySelector('.nav-links');

if (navToggle && navLinksContainer) {
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    navLinksContainer.classList.toggle('open');
  });

  // Close menu when a link is clicked
  navLinksContainer.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('open');
      navLinksContainer.classList.remove('open');
    });
  });
}

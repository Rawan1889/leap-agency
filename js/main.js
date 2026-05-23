/* ========================================================
   LEAP DESIGN — MAIN ORCHESTRATOR
   Bootstraps all systems
   ======================================================== */

window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('loading');

  // Init loader, then fire everything
  new LoaderController(() => {
    // Init Three.js particles (after loader)
    if (window.THREE) {
      new HeroParticles('hero-canvas');
      new ContactParticles('contact-canvas');
    }

    // Init scroll flow particles — 2D canvas river through all sections
    new ScrollFlowParticles();

    // GSAP animations
    if (window.gsap && window.ScrollTrigger) {
      new AnimationController();
    }

    // Custom cursor (desktop only)
    if (window.matchMedia('(pointer: fine)').matches) {
      new MagneticCursor();
    }

    // Intersection observer for generic reveals
    initRevealObserver();

    // Re-register hover targets for cursor (dynamic)
    setTimeout(() => {
      document.querySelectorAll('a, button, .service-card, .project-card, .team-card, .filter-btn, .pillar')
        .forEach(el => {
          el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
          el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
        });
    }, 300);
  });

  // Filter buttons
  setupFilterButtons();

  // Contact form
  setupContactForm();

  // Mobile menu
  setupMobileMenu();
});

function setupMobileMenu() {
  const hamburger = document.getElementById('nav-hamburger');
  const menu      = document.getElementById('mobile-menu');
  const closeBtn  = document.getElementById('mobile-menu-close');
  const links     = document.querySelectorAll('.mobile-link');
  if (!hamburger || !menu) return;

  function openMenu() {
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    hamburger.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', 'Close menu');
    document.body.style.overflow = 'hidden'; // prevent scroll behind
  }

  function closeMenu() {
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open menu');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    menu.classList.contains('is-open') ? closeMenu() : openMenu();
  });

  closeBtn && closeBtn.addEventListener('click', closeMenu);

  // Close on any link click (navigates to section)
  links.forEach(link => link.addEventListener('click', closeMenu));

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) closeMenu();
  });
}

function setupFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function setupContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    const span = btn.querySelector('span');
    const orig = span.textContent;
    span.textContent = 'Message Sent ✓';
    btn.style.borderColor = '#c8a96e';
    btn.style.color = '#c8a96e';
    setTimeout(() => {
      span.textContent = orig;
      form.reset();
    }, 3000);
  });
}

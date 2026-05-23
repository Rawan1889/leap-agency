/* ========================================================
   LEAP DESIGN — GSAP ANIMATIONS & SCROLL TRIGGERS
   All entrance animations, parallax, text reveals
   ======================================================== */

class AnimationController {
  constructor() {
    this.gsap = window.gsap;
    this.ST   = window.ScrollTrigger;
    if (!this.gsap || !this.ST) return;

    this.gsap.registerPlugin(this.ST);
    this.init();
  }

  init() {
    this.setupNav();
    this.setupHeroAnimations();
    this.setupRevealAnimations();
    this.setupParallax();
    this.setupCounters();
    this.setupMarquee();
    this.setupProjectCards();
  }

  /* NAV SCROLL BEHAVIOUR */
  setupNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 80) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });

    // Smooth nav link scrolling
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* HERO ENTRANCE */
  setupHeroAnimations() {
    const tl = this.gsap.timeline({ delay: 2.2 });

    // Eyebrow
    tl.to('.hero-eyebrow', {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out'
    });

    // Title lines stagger
    tl.to('.hero-title .line-inner', {
      y: 0,
      duration: 1.1,
      ease: 'power4.out',
      stagger: 0.12
    }, '-=0.3');

    // Description
    tl.to('.hero-desc', {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out'
    }, '-=0.5');

    // CTA
    tl.to('.hero-actions', {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out'
    }, '-=0.4');

    // Stats
    tl.to('.hero-stats', {
      opacity: 1,
      x: 0,
      duration: 1,
      ease: 'power3.out'
    }, '-=0.6');

    // Scroll hint
    tl.to('.hero-scroll-hint', {
      opacity: 1,
      duration: 0.8,
      ease: 'power2.out'
    }, '-=0.3');
  }

  /* GENERIC REVEAL ON SCROLL */
  setupRevealAnimations() {
    // Section labels
    this.gsap.utils.toArray('.section-label').forEach(el => {
      this.gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
        opacity: 0,
        x: -20,
        duration: 0.7,
        ease: 'power3.out'
      });
    });

    // Section headlines — split lines
    this.gsap.utils.toArray('.section-headline').forEach(el => {
      this.gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
        opacity: 0,
        y: 50,
        duration: 1,
        ease: 'power4.out'
      });
    });

    // Body text
    this.gsap.utils.toArray('.section-body').forEach(el => {
      this.gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
        opacity: 0,
        y: 30,
        duration: 0.9,
        ease: 'power3.out',
        delay: 0.2
      });
    });

    // Service cards stagger
    this.gsap.utils.toArray('.service-card').forEach((card, i) => {
      this.gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none none' },
        opacity: 0,
        y: 60,
        duration: 0.9,
        delay: i * 0.08,
        ease: 'power3.out'
      });
    });

    // Process steps
    this.gsap.utils.toArray('.process-step').forEach((step, i) => {
      this.gsap.from(step, {
        scrollTrigger: { trigger: step, start: 'top 85%', toggleActions: 'play none none none' },
        opacity: 0,
        x: 40,
        duration: 0.9,
        delay: i * 0.1,
        ease: 'power3.out'
      });
    });

    // Team cards
    this.gsap.utils.toArray('.team-card').forEach((card, i) => {
      this.gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none none' },
        opacity: 0,
        y: 40,
        scale: 0.97,
        duration: 0.8,
        delay: i * 0.08,
        ease: 'power3.out'
      });
    });

    // Pillar cards
    this.gsap.utils.toArray('.pillar').forEach((p, i) => {
      this.gsap.from(p, {
        scrollTrigger: { trigger: p, start: 'top 88%', toggleActions: 'play none none none' },
        opacity: 0,
        y: 30,
        duration: 0.7,
        delay: i * 0.1,
        ease: 'power3.out'
      });
    });

    // Project cards
    this.gsap.utils.toArray('.project-card').forEach((card, i) => {
      this.gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none none' },
        opacity: 0,
        y: 50,
        duration: 1,
        delay: i * 0.15,
        ease: 'power4.out'
      });
    });

    // Contact form
    this.gsap.from('.contact-form', {
      scrollTrigger: { trigger: '.contact-form', start: 'top 85%', toggleActions: 'play none none none' },
      opacity: 0,
      x: 40,
      duration: 1,
      ease: 'power3.out'
    });
  }

  /* PARALLAX */
  setupParallax() {
    // About section — text parallax
    this.gsap.to('.about-left', {
      scrollTrigger: {
        trigger: '#about',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5
      },
      y: -50
    });

    // Stats band number strip
    this.gsap.from('.stats-band-inner', {
      scrollTrigger: {
        trigger: '#stats-band',
        start: 'top bottom',
        toggleActions: 'play none none none'
      },
      opacity: 0,
      y: 40,
      duration: 1,
      ease: 'power3.out'
    });
  }

  /* COUNTER ANIMATIONS */
  setupCounters() {
    const counters = [
      { el: '.hero-stat-num[data-val]' }
    ];

    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      this.gsap.from({ val: 0 }, {
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
        val: target,
        duration: 2,
        ease: 'power2.out',
        onUpdate: function() {
          el.textContent = Math.round(this.targets()[0].val) + (el.dataset.suffix || '');
        }
      });
    });

    // Hero static counters — just animate in
    this.gsap.utils.toArray('.hero-stat-num').forEach((el, i) => {
      this.gsap.from(el, {
        textContent: 0,
        duration: 2,
        delay: 2.5 + i * 0.2,
        ease: 'power2.out',
        snap: { textContent: 1 },
        onUpdate: function() {
          const raw = Math.round(parseFloat(el.dataset.val || el.textContent));
          el.textContent = raw + (el.dataset.suffix || '');
        }
      });
    });
  }

  /* MARQUEE HOVER PAUSE */
  setupMarquee() {
    const track = document.querySelector('.marquee-track');
    if (!track) return;
    track.addEventListener('mouseenter', () => {
      track.style.animationPlayState = 'paused';
    });
    track.addEventListener('mouseleave', () => {
      track.style.animationPlayState = 'running';
    });
  }

  /* PROJECT CARD 3D TILT */
  setupProjectCards() {
    document.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = (e.clientX - cx) / rect.width;
        const dy = (e.clientY - cy) / rect.height;
        const rotX = -dy * 6;
        const rotY =  dx * 6;
        card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
        card.style.transition = 'transform 0.1s linear';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
        card.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
      });
    });
  }
}

/* ========================================================
   LOADER CONTROLLER
   ======================================================== */
class LoaderController {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.loader     = document.getElementById('loader');
    this.countEl    = document.querySelector('.loader-count');
    this.count      = 0;
    this.start();
  }

  start() {
    const interval = setInterval(() => {
      this.count += Math.floor(Math.random() * 12) + 3;
      if (this.count >= 100) {
        this.count = 100;
        clearInterval(interval);
        setTimeout(() => this.hide(), 400);
      }
      if (this.countEl) this.countEl.textContent = this.count + '%';
    }, 60);
  }

  hide() {
    if (this.loader) {
      this.loader.classList.add('hidden');
      document.body.classList.remove('loading');
    }
    if (this.onComplete) this.onComplete();
  }
}

/* ========================================================
   INTERSECTION OBSERVER for .reveal elements
   ======================================================== */
function initRevealObserver() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

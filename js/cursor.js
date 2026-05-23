/* ========================================================
   LEAP DESIGN — CUSTOM MAGNETIC CURSOR
   Gold dot + ring with magnetic hover effect
   ======================================================== */

class MagneticCursor {
  constructor() {
    this.dot  = document.getElementById('cursor-dot');
    this.ring = document.getElementById('cursor-ring');
    if (!this.dot || !this.ring) return;

    this.pos  = { x: -100, y: -100 };
    this.ring_pos = { x: -100, y: -100 };
    this.active   = false;

    this.bindEvents();
    this.animate();
  }

  bindEvents() {
    document.addEventListener('mousemove', (e) => {
      this.pos.x = e.clientX;
      this.pos.y = e.clientY;
      this.active = true;
    });

    document.addEventListener('mouseleave', () => {
      this.active = false;
    });

    // Magnetic hover on interactive elements
    const targets = document.querySelectorAll('a, button, .service-card, .project-card, .team-card, .filter-btn');
    targets.forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Snap dot to cursor
    if (this.dot) {
      this.dot.style.left = this.pos.x + 'px';
      this.dot.style.top  = this.pos.y + 'px';
    }

    // Lag ring behind dot
    this.ring_pos.x += (this.pos.x - this.ring_pos.x) * 0.12;
    this.ring_pos.y += (this.pos.y - this.ring_pos.y) * 0.12;

    if (this.ring) {
      this.ring.style.left = this.ring_pos.x + 'px';
      this.ring.style.top  = this.ring_pos.y + 'px';
    }

    if (!this.active && this.dot) {
      this.dot.style.opacity  = '0';
      this.ring.style.opacity = '0';
    } else {
      if (this.dot)  this.dot.style.opacity  = '1';
      if (this.ring) this.ring.style.opacity  = '1';
    }
  }
}

/* ================================================================
   LEAP DESIGN — SCROLL FLOW PARTICLES
   
   A river of particles flows from the hero section, winding
   organically through every section, color-shifting with depth,
   and finally blending into the contact section's ambient field.
   
   Uses a fixed full-screen 2D canvas overlay (no Three.js —
   lets us draw smooth radial-gradient glows efficiently).
   ================================================================ */

class ScrollFlowParticles {
  constructor() {
    this.canvas = document.getElementById('flow-canvas');
    if (!this.canvas) return;

    this.ctx       = this.canvas.getContext('2d');
    this.particles = [];
    this.trails    = [];           // faint lingering trail dots
    this.time      = 0;
    this.scrollY   = window.scrollY;
    this.lastScrollY  = window.scrollY;
    this.scrollVel    = 0;
    this.scrollDir    = 1;         // 1=down, -1=up
    this.MAX_P        = 180;
    this.MAX_TRAILS   = 300;

    /* Colour palette stops keyed to scroll progress 0..1
       hero gold → warm cream → dusty rose → lavender → contact teal-purple */
    this.PALETTE = [
      { p: 0.00, r: 200, g: 169, b: 110 },  // gold
      { p: 0.15, r: 240, g: 215, b: 155 },  // light gold
      { p: 0.30, r: 255, g: 235, b: 195 },  // cream
      { p: 0.50, r: 245, g: 210, b: 175 },  // warm sand
      { p: 0.65, r: 220, g: 175, b: 160 },  // dusty rose
      { p: 0.80, r: 185, g: 145, b: 195 },  // soft lavender
      { p: 0.92, r: 140, g: 115, b: 210 },  // purple
      { p: 1.00, r: 105,  g: 95, b: 195 },  // contact purple-blue
    ];

    this.resize();
    window.addEventListener('resize',  () => this.resize(),  { passive: true });
    window.addEventListener('scroll',  () => this.onScroll(), { passive: true });

    this.animate();
  }

  /* ── RESIZE ──────────────────────────────────── */
  resize() {
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width  = this.W;
    this.canvas.height = this.H;
  }

  /* ── SCROLL HANDLER ──────────────────── */
  onScroll() {
    const now   = window.scrollY;
    const delta = now - this.lastScrollY;
    this.scrollDir   = delta >= 0 ? 1 : -1;
    this.scrollVel   = Math.abs(delta);
    this.lastScrollY = now;
    this.scrollY     = now;

    const sp = this.scrollProgress();

    /* Density taper: quadratic falloff so river narrows as you scroll deeper.
       sp=0 (hero) → full burst | sp=1 (contact) → 0 new particles */
    const densityFactor = Math.pow(Math.max(0, 1 - sp), 1.8);

    /* Dynamic ceiling that shrinks with depth:
       hero → ~180 max | midway → ~40 max | contact → ~2 max */
    const dynamicMax = Math.max(2, Math.floor(this.MAX_P * densityFactor));

    const rawCount = Math.ceil(this.scrollVel / 6);
    const count    = Math.round(rawCount * densityFactor);

    for (let i = 0; i < count; i++) {
      if (this.particles.length < dynamicMax) this.spawnParticle();
    }
  }

  /* ── SCROLL PROGRESS (0=hero, 1=contact) ─────── */
  scrollProgress() {
    const max = Math.max(1, document.documentElement.scrollHeight - this.H);
    return Math.min(1, this.scrollY / max);
  }

  /* ── COLOUR FROM PROGRESS ────────────────────── */
  getColor(prog) {
    const p   = Math.max(0, Math.min(1, prog));
    const pal = this.PALETTE;
    let lo = pal[0], hi = pal[pal.length - 1];
    for (let i = 0; i < pal.length - 1; i++) {
      if (p >= pal[i].p && p <= pal[i + 1].p) { lo = pal[i]; hi = pal[i + 1]; break; }
    }
    const t = lo.p === hi.p ? 0 : (p - lo.p) / (hi.p - lo.p);
    return {
      r: Math.round(lo.r + (hi.r - lo.r) * t),
      g: Math.round(lo.g + (hi.g - lo.g) * t),
      b: Math.round(lo.b + (hi.b - lo.b) * t),
    };
  }

  /* ── SPAWN ONE PARTICLE ──────────────────────── */
  spawnParticle() {
    const sp = this.scrollProgress();

    /* Spawn zone: top 30% of viewport, biased to the right (hero canvas side)
       As user scrolls deeper, spawn zone shifts inward toward center */
    const xMin = this.W * (0.42 + sp * 0.06);
    const xMax = this.W * 0.97;
    const x    = xMin + Math.random() * (xMax - xMin);
    const y    = this.H * (Math.random() * 0.30); // top 30% of screen

    /* Two overlapping sine waves create organic S-curves */
    const freq1 = 0.008 + Math.random() * 0.012;
    const freq2 = 0.003 + Math.random() * 0.005;
    const amp1  = 12   + Math.random() * 28;
    const amp2  = 8    + Math.random() * 16;

    /* Contact section: slow dramatically and fan outward */
    const contactZone = sp > 0.82;

    this.particles.push({
      x, y,
      prevX: x, prevY: y,
      phase1: Math.random() * Math.PI * 2,
      phase2: Math.random() * Math.PI * 2,
      freq1, freq2,
      amp1,  amp2,
      /* Gentle wind bias: slight horizontal drift gives each particle
         its own personality — some lean left, others right */
      wind:  (Math.random() - 0.5) * 0.18,
      /* Speed: slower near contact section */
      speed: (0.9 + Math.random() * 1.2) * (contactZone ? 0.45 : 1),
      /* Spawn colour locked to scroll progress so it matches section */
      spawnProg: sp,
      size:  0.8 + Math.random() * 1.6,
      life:  0,
      maxLife: 220 + Math.random() * 180,
      contactZone,
    });
  }

  /* ── DRAW ONE PARTICLE WITH GLOW ─────────────── */
  drawParticle(p, alpha, col) {
    const { ctx } = this;
    const { x, y, size } = p;

    /* Outer glow */
    const r  = size * 4;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0,   `rgba(${col.r},${col.g},${col.b},${alpha * 0.55})`);
    grd.addColorStop(0.45,`rgba(${col.r},${col.g},${col.b},${alpha * 0.18})`);
    grd.addColorStop(1,   `rgba(${col.r},${col.g},${col.b},0)`);

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    /* Core dot */
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${col.r},${col.g},${col.b},${alpha})`;
    ctx.fill();
  }

  /* ── MAIN LOOP ───────────────────────────────── */
  animate() {
    requestAnimationFrame(() => this.animate());
    this.time++;

    const { ctx, W, H } = this;

    /* Semi-transparent clear for motion blur / trail effect */
    ctx.clearRect(0, 0, W, H);

    /* Passive drizzle — only active in upper sections (sp < 0.60)
       stops entirely once we reach the deeper sections */
    const sp = this.scrollProgress();
    const densityFactor = Math.pow(Math.max(0, 1 - sp), 1.8);
    const dynamicMax    = Math.max(2, Math.floor(this.MAX_P * densityFactor));
    const drizzleChance = 0.12 * densityFactor;

    if (sp > 0.04 && sp < 0.60 && this.particles.length < Math.min(dynamicMax, 18) && Math.random() < drizzleChance) {
      this.spawnParticle();
    }

    /* Update + draw particles */
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.prevX = p.x;
      p.prevY = p.y;
      p.life++;

      /* ── Path: two sine waves + wind bias ──
         Creates natural S-curves and spiralling wander */
      const wave1 = Math.sin(this.time * p.freq1 + p.phase1) * p.amp1;
      const wave2 = Math.cos(this.time * p.freq2 + p.phase2) * p.amp2;

      /* Near contact section: particles fan out slowly and settle */
      const inContact = sp > 0.82;
      const settle    = inContact ? Math.max(0, (sp - 0.82) / 0.18) : 0;
      const speedMult = 1 - settle * 0.80;

      p.x += (wave1 + wave2) * 0.04 + p.wind;
      p.y += p.speed * speedMult;

      /* Wrap horizontally so particles don't leave the right panel */
      if (p.x < W * 0.38) p.x = W * 0.38 + Math.random() * 10;
      if (p.x > W * 0.99) p.x = W * 0.99 - Math.random() * 10;

      /* Kill condition */
      if (p.y > H + 30 || p.life > p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      /* Alpha envelope: ease-in (first 8%) → full → ease-out (last 18%) */
      const lr = p.life / p.maxLife;
      let alpha = lr < 0.08 ? lr / 0.08 : lr > 0.82 ? (1 - lr) / 0.18 : 1;
      alpha = Math.min(1, alpha) * 0.82;

      /* ── Colour: blend between spawn colour and current scroll colour
             so particles "inherit" their section's hue gradually ── */
      const colProg  = p.spawnProg + (sp - p.spawnProg) * Math.min(1, p.life / 60);
      const col      = this.getColor(colProg);

      this.drawParticle(p, alpha, col);

      /* Leave a trail dot every 4 frames */
      if (p.life % 4 === 0 && this.trails.length < this.MAX_TRAILS) {
        this.trails.push({
          x: p.prevX, y: p.prevY,
          col, size: p.size * 0.45,
          alpha: alpha * 0.25,
          life: 0, maxLife: 40,
        });
      }
    }

    /* Draw + age trails */
    for (let i = this.trails.length - 1; i >= 0; i--) {
      const tr = this.trails[i];
      tr.life++;
      const a = tr.alpha * (1 - tr.life / tr.maxLife);
      if (a < 0.005 || tr.life > tr.maxLife) { this.trails.splice(i, 1); continue; }

      ctx.beginPath();
      ctx.arc(tr.x, tr.y, tr.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${tr.col.r},${tr.col.g},${tr.col.b},${a})`;
      ctx.fill();
    }
  }
}

/* =====================================================
   LEAP DESIGN — GRADIENT PARTICLE LOGO SYSTEM v3

   ① IDLE   → particles scattered across canvas, gently drifting
   ② EXPAND → each particle smoothly flies from its scatter
               position to its logo target (staggered launch)
   ③ HOLD   → logo fully formed, particles breathe in place
   ④ COLLAPSE → particles drift back to scattered home positions
   ===================================================== */

class HeroParticles {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.time      = 0;
    this.N         = 3600;
    this.state     = 'idle';    // idle | expanding | hold | collapsing
    this.progress  = 0;         // 0 = idle, 1 = logo fully formed
    this.idleTimer = null;

    /* spring constants */
    this.SPRING  = 0.055;
    this.DAMPING = 0.80;

    this.init();
    this.sampleLogoPositions();
    this.buildParticles();
    this.buildAccents();
    this.bindEvents();
    this.animate();
  }

  /* ── RENDERER ────────────────────────────────── */
  init() {
    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      55,
      this.canvas.clientWidth / this.canvas.clientHeight,
      0.1, 1000
    );
    this.camera.position.set(0, 0, 200);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas, antialias: true, alpha: true
    });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    /* Responsive logo scale — use window.innerWidth (always reliable at init,
       unlike canvas.clientWidth which may be 0 before layout completes)
       ≥1200px → 1.0  |  900-1199 → 0.80  |  600-899 → 0.62  |  <600 → 0.42 */
    this.logoScale = this._computeLogoScale();
  }

  _computeLogoScale() {
    const w = window.innerWidth;
    if (w >= 1200) return 1.0;
    if (w >= 900)  return 0.80;
    if (w >= 600)  return 0.62;
    return 0.42; // mobile
  }

  /* ── LOGO PIXEL SAMPLING ─────────────────────── */
  sampleLogoPositions() {
    const W = 520, H = 400;
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const ctx = off.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    /* "Leap" script */
    ctx.font = 'italic bold 88px Georgia, serif';
    ctx.fillStyle = '#000000';
    ctx.fillText('Leap', 78, 218);

    /* Underline */
    ctx.beginPath();
    ctx.moveTo(74, 230); ctx.lineTo(292, 230);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.stroke();

    /* Jumping figure */
    ctx.save();
    ctx.translate(306, 116);
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(0, -40, 11, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0,-29); ctx.lineTo(-7,0); ctx.lineTo(7,0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-7,-16); ctx.lineTo(-38,-3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(7,-16);  ctx.lineTo(34,-28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-7,0);  ctx.lineTo(-26,28);  ctx.stroke();
    ctx.beginPath(); ctx.moveTo(7,0);   ctx.lineTo(30,20);   ctx.stroke();
    ctx.restore();

    /* Arc text */
    ctx.save();
    ctx.translate(306, 153);
    const arcText = 'CREATIVE DESIGN AGENCY';
    const R = 96, start = -Math.PI * 0.85, step = (Math.PI * 1.7) / (arcText.length - 1);
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#000';
    for (let i = 0; i < arcText.length; i++) {
      const a = start + i * step;
      ctx.save();
      ctx.translate(Math.cos(a) * R, Math.sin(a) * R);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillText(arcText[i], -3, 0);
      ctx.restore();
    }
    ctx.restore();

    /* LEAP AGENCY */
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText('LEAP  AGENCY', 86, 296);

    /* Tagline */
    ctx.font = '14px Georgia';
    ctx.fillStyle = '#222';
    ctx.fillText('Your First Step Toward Your Future Life', 70, 324);

    /* Sample dark pixels → collect (x,y) in logo space */
    const data = ctx.getImageData(0, 0, W, H).data;
    const raw  = [];
    for (let y = 0; y < H; y += 3) {
      for (let x = 0; x < W; x += 3) {
        const idx = (y * W + x) * 4;
        const lum = data[idx]*0.299 + data[idx+1]*0.587 + data[idx+2]*0.114;
        if (lum < 110) {
          raw.push(
            ((x / W) - 0.5) * 192,   // world X: ~-96..+96 at scale 1
            -((y / H) - 0.5) * 152,  // world Y: ~-76..+76 at scale 1
            0
          );
        }
      }
    }

    /* Shuffle for organic spawn order */
    for (let i = Math.floor(raw.length / 3) - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const a = i*3, b = j*3;
      [raw[a],raw[b]]         = [raw[b],raw[a]];
      [raw[a+1],raw[b+1]]     = [raw[b+1],raw[a+1]];
      [raw[a+2],raw[b+2]]     = [raw[b+2],raw[a+2]];
    }

    this.logoPool = raw;
  }

  /* ── BUILD PARTICLES ─────────────────────────── */
  buildParticles() {
    const N    = this.N;
    const pool = this.logoPool;
    const pLen = Math.floor(pool.length / 3);

    /* Per-particle flat arrays */
    this.pos      = new Float32Array(N * 3); // live positions
    this.vel      = new Float32Array(N * 3); // velocity (spring)
    this.logoTgt  = new Float32Array(N * 3); // logo shape target
    this.homeTgt  = new Float32Array(N * 3); // scatter idle target
    this.phase    = new Float32Array(N);     // float phase
    this.delay    = new Float32Array(N);     // stagger delay 0..1

    /* Colour arrays */
    const colors  = new Float32Array(N * 3);
    const sizes   = new Float32Array(N);

    /* Gradient palette — colour by Y in logo space */
    const palette = [
      new THREE.Color('#e8f7ff'), // 0.0 — bright ice white
      new THREE.Color('#f0e6d2'), // 0.2 — warm cream
      new THREE.Color('#e2c990'), // 0.4 — light gold
      new THREE.Color('#c8a96e'), // 0.6 — gold
      new THREE.Color('#a07845'), // 0.8 — amber
      new THREE.Color('#7a5530'), // 1.0 — deep amber
    ];

    for (let i = 0; i < N; i++) {
      const i3 = i * 3;

      /* ─ Logo target (sampled pixel) — apply responsive scale ─ */
      const li = (i % pLen) * 3;
      const lx = (pool[li]     + (Math.random() - 0.5) * 1.2) * this.logoScale;
      const ly = (pool[li + 1] + (Math.random() - 0.5) * 1.2) * this.logoScale;
      const lz = (pool[li + 2] + (Math.random() - 0.5) * 2)   * this.logoScale;
      this.logoTgt[i3]     = lx;
      this.logoTgt[i3 + 1] = ly;
      this.logoTgt[i3 + 2] = lz;

      /* ─ Home: scatter uses original desktop range (220×170) scaled down
         for smaller screens — preserves the full idle cloud on laptop ─ */
      const scatterX = 220 * this.logoScale;
      const scatterY = 170 * this.logoScale;
      const scatterZ =  60 * this.logoScale;
      const hx = (Math.random() - 0.5) * scatterX;
      const hy = (Math.random() - 0.5) * scatterY;
      const hz = (Math.random() - 0.5) * scatterZ;
      this.homeTgt[i3]     = hx;
      this.homeTgt[i3 + 1] = hy;
      this.homeTgt[i3 + 2] = hz;

      /* ─ Start at home ─ */
      this.pos[i3]     = hx + (Math.random() - 0.5) * 3;
      this.pos[i3 + 1] = hy + (Math.random() - 0.5) * 3;
      this.pos[i3 + 2] = hz;

      this.phase[i] = Math.random() * Math.PI * 2;
      /* Stagger delay: particles from far away delay slightly */
      const dist = Math.sqrt(hx*hx + hy*hy);
      this.delay[i] = Math.random() * 0.4; // pure random 0..0.4 for organic feel

      /* ─ Gradient colour by Y position in logo ─ */
      const yNorm = Math.max(0, Math.min(1, 1 - (ly + 76) / 152)); // 0=bottom, 1=top
      const seg   = yNorm * (palette.length - 1);
      const ci    = Math.min(Math.floor(seg), palette.length - 2);
      const cf    = seg - ci;
      const col   = palette[ci].clone().lerp(palette[ci + 1], cf);

      colors[i3]     = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;

      sizes[i] = 0.6 + Math.random() * 1.6;
    }

    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos,    3));
    this.geo.setAttribute('color',    new THREE.BufferAttribute(colors,      3));
    this.geo.setAttribute('size',     new THREE.BufferAttribute(sizes,       1));

    this.mat = new THREE.PointsMaterial({
      size: 1.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.points = new THREE.Points(this.geo, this.mat);
    this.scene.add(this.points);
  }

  /* ── WIRE ACCENTS ────────────────────────────── */
  buildAccents() {
    const mkWire = (geo, col, op, x, y, z) => {
      const l = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending })
      );
      l.position.set(x, y, z);
      this.scene.add(l);
      return l;
    };
    this.w1 = mkWire(new THREE.IcosahedronGeometry(22, 0), 0xc8a96e, 0.05, 50, 28, -90);
    this.w2 = mkWire(new THREE.OctahedronGeometry(13, 0),  0xe2c990, 0.07, -55,-30, -65);
  }

  /* ── EVENTS ──────────────────────────────────── */
  bindEvents() {
    this.originEl = document.getElementById('particle-origin');
    this.hintEl   = document.getElementById('particle-hint');
    this._hinted  = false;

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      if (e.clientX < rect.left - 10 || e.clientX > rect.right + 10) return;

      if (!this._hinted) {
        this._hinted = true;
        if (this.originEl) this.originEl.classList.add('hidden');
        if (this.hintEl)   this.hintEl.classList.add('hidden');
      }

      if (this.state === 'idle' || this.state === 'collapsing') {
        this.state    = 'expanding';
      }

      clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => {
        if (this.state === 'expanding' || this.state === 'hold') {
          this.state = 'collapsing';
        }
        setTimeout(() => {
          if (this.progress < 0.05) {
            this._hinted = false;
            if (this.originEl) this.originEl.classList.remove('hidden');
            if (this.hintEl)   this.hintEl.classList.remove('hidden');
          }
        }, 2500);
      }, 1600);
    });

    window.addEventListener('mouseleave', () => {
      clearTimeout(this.idleTimer);
      if (this.state !== 'idle') this.state = 'collapsing';
    });

    window.addEventListener('resize', () => {
      const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);

      /* Recompute logo scale and rebuild particle targets on resize */
      const newScale = this._computeLogoScale();
      if (Math.abs(newScale - this.logoScale) > 0.05) {
        this.logoScale = newScale;
        this._rescaleTargets();
      }
    });
  }

  /* ── Rescale logo + home targets after resize ── */
  _rescaleTargets() {
    const pool = this.logoPool;
    const pLen = Math.floor(pool.length / 3);
    const N    = this.N;
    const s    = this.logoScale;
    const scatterX = 220 * s;  // original desktop range
    const scatterY = 170 * s;
    const scatterZ =  60 * s;

    for (let i = 0; i < N; i++) {
      const i3 = i * 3;
      const li = (i % pLen) * 3;

      // Rescale logo targets
      this.logoTgt[i3]     = pool[li]     * s;
      this.logoTgt[i3 + 1] = pool[li + 1] * s;
      this.logoTgt[i3 + 2] = pool[li + 2] * s;

      // Rescale home targets
      this.homeTgt[i3]     = (Math.random() - 0.5) * scatterX;
      this.homeTgt[i3 + 1] = (Math.random() - 0.5) * scatterY;
      this.homeTgt[i3 + 2] = (Math.random() - 0.5) * scatterZ;
    }
  }

  /* ── ANIMATE ─────────────────────────────────── */
  animate() {
    requestAnimationFrame(() => this.animate());
    this.time += 0.012;
    const t   = this.time;
    const pos = this.pos;
    const vel = this.vel;
    const N   = this.N;

    /* ── Advance global progress ── */
    const SPEED = 0.018; // slower = smoother logo formation
    if (this.state === 'expanding') {
      this.progress = Math.min(1, this.progress + SPEED);
      if (this.progress >= 1) this.state = 'hold';
    } else if (this.state === 'collapsing') {
      this.progress = Math.max(0, this.progress - SPEED * 0.7);
      if (this.progress <= 0) this.state = 'idle';
    }

    const p = this.progress;

    /* ── Per-particle spring update ── */
    for (let i = 0; i < N; i++) {
      const i3 = i * 3;
      const ph = this.phase[i];
      const dl = this.delay[i];

      /* Each particle activates when global progress > its personal delay */
      const localP = Math.max(0, Math.min(1, (p - dl) / (1 - dl + 0.001)));

      /* Smooth easing: easeInOutCubic */
      const ep = localP < 0.5
        ? 4 * localP * localP * localP
        : 1 - Math.pow(-2 * localP + 2, 3) / 2;

      /* Floating offset — smaller when logo is formed (particles gently breathe) */
      const floatScale = 1.0 - ep * 0.6; // full float idle → gentle float in logo
      const fx = Math.sin(t * 0.8 + ph)          * 1.6 * floatScale;
      const fy = Math.cos(t * 0.65 + ph * 1.3)   * 1.2 * floatScale;
      const fz = Math.sin(t * 0.5  + ph * 0.8)   * 0.8 * floatScale;

      /* Interpolated target: home → logo */
      const tx = this.homeTgt[i3]     * (1 - ep) + this.logoTgt[i3]     * ep + fx;
      const ty = this.homeTgt[i3 + 1] * (1 - ep) + this.logoTgt[i3 + 1] * ep + fy;
      const tz = this.homeTgt[i3 + 2] * (1 - ep) + this.logoTgt[i3 + 2] * ep + fz;

      /* Spring physics */
      vel[i3]     += (tx - pos[i3])     * this.SPRING;
      vel[i3 + 1] += (ty - pos[i3 + 1]) * this.SPRING;
      vel[i3 + 2] += (tz - pos[i3 + 2]) * this.SPRING;

      vel[i3]     *= this.DAMPING;
      vel[i3 + 1] *= this.DAMPING;
      vel[i3 + 2] *= this.DAMPING;

      pos[i3]     += vel[i3];
      pos[i3 + 1] += vel[i3 + 1];
      pos[i3 + 2] += vel[i3 + 2];
    }

    this.geo.attributes.position.needsUpdate = true;

    /* Opacity: slightly brighter when logo is fully formed */
    this.mat.opacity = 0.55 + p * 0.38;

    /* Gentle slow rotation of whole cloud */
    this.points.rotation.y += 0.00018;
    this.points.rotation.x  = Math.sin(t * 0.08) * 0.012;

    /* Spin wire accents */
    this.w1.rotation.x += 0.0007; this.w1.rotation.y += 0.0010;
    this.w2.rotation.x -= 0.0012; this.w2.rotation.z += 0.0008;

    this.renderer.render(this.scene, this.camera);
  }
}


/* ======================================================
   CONTACT SECTION — AMBIENT PARTICLE NEBULA
   ====================================================== */
class ContactParticles {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.time = 0;
    this.init();
    this.animate();
    window.addEventListener('resize', () => this.onResize());
  }

  init() {
    this.scene    = new THREE.Scene();
    this.camera   = new THREE.PerspectiveCamera(70, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 500);
    this.camera.position.z = 120;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: false });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setClearColor(0x000000, 0);

    const count = 1800;
    const positions = new Float32Array(count * 3);
    const colors    = new Float32Array(count * 3);
    const c1 = new THREE.Color('#c8a96e');
    const c2 = new THREE.Color('#4a2c6e');

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3]     = (Math.random() - 0.5) * 200;
      positions[i3 + 1] = (Math.random() - 0.5) * 120;
      positions[i3 + 2] = (Math.random() - 0.5) * 60;
      const mix = Math.random();
      const col = c1.clone().lerp(c2, mix);
      colors[i3]     = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    this.pts = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 1.2, vertexColors: true, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    this.scene.add(this.pts);
  }

  onResize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.time += 0.003;
    this.pts.rotation.y += 0.0006;
    this.pts.rotation.x  = Math.sin(this.time * 0.4) * 0.08;
    this.renderer.render(this.scene, this.camera);
  }
}

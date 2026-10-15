/* LA PLAGE · 3D product turntable
   A cut-out garment floats and slowly turns. Drag (or swipe) to spin it 360°;
   it keeps turning with inertia, eases back to the slow auto-rotate after a
   moment, and pauses while it is off screen. Front and back faces plus a few
   thin layers in between give the piece some body when seen from the side.
   No libraries. */
(() => {
  'use strict';

  const AUTO = 0.014;          // deg per ms: one slow turn every ~26 s
  const DRAG = 0.42;           // deg per px dragged
  const FRICTION = 0.955;      // per 16 ms
  const IDLE = 1400;           // ms after release before auto-rotate takes over again
  const LAYERS = 7;            // thickness slices between front and back
  const DEPTH = 1.3;           // px between slices

  const all = new Set();
  let raf = 0, last = 0;

  const loop = (now) => {
    const dt = last ? Math.min(48, now - last) : 16;
    last = now;
    let any = false;
    all.forEach((s) => { if (s.visible) { s.step(dt, now); any = true; } });
    raf = any ? requestAnimationFrame(loop) : 0;
    if (!raf) last = 0;
  };
  const wake = () => { if (!raf) raf = requestAnimationFrame(loop); };

  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const s = e.target.__spin;
      if (s) s.visible = e.isIntersecting;
    });
    wake();
  }, { rootMargin: '120px' }) : null;

  class Spin {
    constructor(host, { front, back, alt = '', delay = 0, start = 0 }) {
      this.host = host;
      this.angle = start;
      this.vel = AUTO;
      this.target = null;
      this.dragging = false;
      this.lastTouch = -1e9;
      this.visible = !io;

      const layer = (cls, src, extra = '') =>
        `<img class="spin__img ${cls}" src="${src}" alt="" draggable="false" decoding="async" ${extra}>`;
      let slices = '';
      for (let i = 1; i <= LAYERS; i++) slices += layer('spin__slice', front, `style="--z:${(-i * DEPTH).toFixed(1)}px"`);

      host.classList.add('spin');
      host.setAttribute('role', 'img');
      host.setAttribute('aria-label', `${alt}. Drag to rotate.`);
      host.tabIndex = 0;
      host.style.setProperty('--float-delay', `${delay}s`);
      host.innerHTML = `
        <div class="spin__float" data-motion>
          <div class="spin__obj" data-motion>
            ${layer('spin__face spin__face--front', front)}
            ${slices}
            ${layer('spin__face spin__face--back', back || front, `style="--z:${(-(LAYERS + 1) * DEPTH).toFixed(1)}px"`)}
          </div>
        </div>
        <div class="spin__shadow" data-motion aria-hidden="true"></div>`;
      this.obj = host.querySelector('.spin__obj');

      host.addEventListener('pointerdown', this.down.bind(this));
      host.addEventListener('pointermove', this.move.bind(this));
      host.addEventListener('pointerup', this.up.bind(this));
      host.addEventListener('pointercancel', this.up.bind(this));
      host.addEventListener('lostpointercapture', this.up.bind(this));
      host.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          this.goTo(this.angle + (e.key === 'ArrowRight' ? 30 : -30));
        }
      });
      host.__spin = this;
      all.add(this);
      if (io) io.observe(host);
      this.render();
      wake();
    }

    down(e) {
      if (this.pointer != null || (e.pointerType === 'mouse' && e.button !== 0)) return;
      this.pointer = e.pointerId;
      this.dragging = true;
      this.target = null;
      this.x = e.clientX; this.t = e.timeStamp; this.vel = 0;
      this.host.setPointerCapture(e.pointerId);
      this.host.classList.add('is-dragging');
    }
    move(e) {
      if (e.pointerId !== this.pointer) return;
      const dx = e.clientX - this.x;
      const dt = Math.max(1, e.timeStamp - this.t);
      this.angle += dx * DRAG;
      this.vel = this.vel * 0.5 + (dx * DRAG / dt) * 0.5;   // smoothed deg/ms
      this.x = e.clientX; this.t = e.timeStamp;
      this.render();
    }
    up(e) {
      if (e.pointerId !== this.pointer) return;
      this.pointer = null;
      this.dragging = false;
      if (e.timeStamp - this.t > 70) this.vel = 0;            // held still before letting go
      this.vel = Math.max(-1.2, Math.min(1.2, this.vel));
      this.lastTouch = performance.now();
      this.host.classList.remove('is-dragging');
      if (this.host.hasPointerCapture(e.pointerId)) this.host.releasePointerCapture(e.pointerId);
      wake();
    }

    /** Ease to an angle (e.g. 0 = front, 180 = back) along the shortest way round. */
    goTo(deg) {
      const d = ((deg - this.angle) % 360 + 540) % 360 - 180;
      this.target = this.angle + d;
      this.lastTouch = performance.now();
      wake();
    }

    step(dt, now) {
      if (this.dragging) return;
      const k = dt / 16.7;
      if (this.target !== null) {
        const d = this.target - this.angle;
        this.angle += d * (1 - Math.pow(0.88, k));
        if (Math.abs(d) < 0.05) { this.angle = this.target; this.target = null; this.vel = 0; }
      } else {
        const idle = now - this.lastTouch > IDLE;
        // inertia decays; once idle, glide smoothly back to the slow auto-rotate
        const goal = idle ? AUTO : 0;
        if (Math.abs(this.vel) > AUTO * 1.5 && !idle) this.vel *= Math.pow(FRICTION, k);
        else this.vel += (goal - this.vel) * (1 - Math.pow(0.97, k));
        this.angle += this.vel * dt;
      }
      this.render();
    }

    render() {
      this.obj.style.transform = `rotateY(${this.angle.toFixed(2)}deg)`;
    }

    destroy() {
      all.delete(this);
      if (io) io.unobserve(this.host);
      this.host.innerHTML = '';
    }
  }

  window.LaPlageSpin = Spin;
})();

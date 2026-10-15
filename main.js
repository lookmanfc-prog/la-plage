/* LA PLAGE — home interactions. No dependencies. */
(() => {
  'use strict';

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const formatVND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

  /* ---------------- Sticky nav: follows the announcement bar, turns to glass on scroll ---------------- */
  const nav = document.querySelector('[data-nav]');
  const bar = document.querySelector('.announce');
  let navTicking = false;
  const updateNav = () => {
    navTicking = false;
    const y = window.scrollY;
    const barH = bar ? bar.offsetHeight : 0;
    nav.style.setProperty('--nav-y', `${Math.max(0, barH - y)}px`);
    nav.classList.toggle('is-glass', y > barH + 12);
  };
  const queueNav = () => { if (!navTicking) { navTicking = true; requestAnimationFrame(updateNav); } };

  /* ---------------- Scroll spy: highlight the section in view ---------------- */
  const initScrollSpy = () => {
    const links = [...document.querySelectorAll('[data-spy]')];
    if (!links.length || !('IntersectionObserver' in window)) return;
    const byId = new Map(links.map((a) => [a.dataset.spy, a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.removeAttribute('aria-current'));
        const link = byId.get(entry.target.id);
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('#top, #drop, #collections, #story, #lookbook, #access').forEach((sec) => io.observe(sec));
  };

  /* ---------------- Scroll animation system ----------------
     data-animate="fade-up | fade | words | clip | line"  (+ data-delay="ms")
     data-stagger="fade-up" on a parent reveals its children in sequence (+ data-stagger-step="ms")
     Everything reveals once, when it enters the viewport. */
  const splitWords = (el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            inner.className = 'w__i';
            inner.style.setProperty('--wi', i++);
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === Node.ELEMENT_NODE && n.tagName !== 'BR') {
          walk(n);
        }
      });
    };
    walk(el);
  };

  const animIO = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      reveal(entry.target);
      animIO.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 }) : null;

  // Hero elements wait until the welcome wave has uncovered them
  let introDone = !window.laPlageIntro;
  if (window.laPlageIntro) window.laPlageIntro.then(() => { introDone = true; });
  const reveal = (el) => {
    if (!introDone && el.closest('.hero')) { window.laPlageIntro.then(() => reveal(el)); return; }
    el.classList.add('is-visible');
    if (el.hasAttribute('data-stagger')) {
      el.querySelectorAll(':scope > [data-animate]').forEach((child) => child.classList.add('is-visible'));
    }
  };

  const prepare = (el) => {
    if (el.dataset.animPrepared) return;
    el.dataset.animPrepared = '1';
    if (el.dataset.delay) el.style.setProperty('--delay', `${parseInt(el.dataset.delay, 10)}ms`);
    if (el.dataset.animate === 'words') splitWords(el);
  };

  const initAnimations = (root = document) => {
    // Stagger groups: children inherit the animation with increasing delays
    root.querySelectorAll('[data-stagger]').forEach((group) => {
      const type = group.dataset.stagger || 'fade-up';
      const step = parseInt(group.dataset.staggerStep || '80', 10);
      [...group.children].forEach((child, i) => {
        if (!child.dataset.animate) child.dataset.animate = type;
        child.style.setProperty('--delay', `${i * step}ms`);
        child.dataset.animPrepared = '1';
      });
      if (animIO) animIO.observe(group); else reveal(group);
    });
    root.querySelectorAll('[data-animate]').forEach((el) => {
      if (el.parentElement && el.parentElement.hasAttribute('data-stagger')) return; // driven by the group
      prepare(el);
      if (animIO) animIO.observe(el); else reveal(el);
    });
  };

  /* ---------------- Products: render from JSON ---------------- */
  const track = document.querySelector('[data-strip-track]');

  const productCard = (p, i) => {
    const li = document.createElement('li');
    li.className = 'strip__item';
    li.innerHTML = `
      <a class="card" data-motion href="#product/${p.handle}" data-index="${i}" aria-label="${p.title}, ${p.color.name}, ${formatVND.format(p.price)}. View details">
        <div class="card__media" data-motion>
          <div class="card__shadow" data-motion aria-hidden="true"></div>
          <div class="card__lift" data-motion>
            <img src="${p.image.src}" alt="${p.image.alt}" width="${p.image.width}" height="${p.image.height}" loading="lazy" decoding="async" draggable="false">
            ${p.imageHover ? `<img class="card__hover" data-motion src="${p.imageHover.src}" alt="" width="${p.imageHover.width}" height="${p.imageHover.height}" loading="lazy" decoding="async" draggable="false">` : ''}
          </div>
        </div>
        <div class="card__meta" aria-hidden="true">
          <h3 class="card__name">${p.title}</h3>
          <p class="card__price">${formatVND.format(p.price)}</p>
          <p class="card__color">${p.color.name}</p>
        </div>
        <div class="card__quick" data-motion aria-hidden="true">
          <span class="card__sizes">${(p.sizes || []).map((s) => `<span>${s}</span>`).join('')}</span>
          <span class="card__view">View</span>
        </div>
      </a>`;
    return li;
  };

  const loadProducts = async () => {
    try {
      const res = await fetch('data/products.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      const frag = document.createDocumentFragment();
      data.products.forEach((p, i) => frag.appendChild(productCard(p, i)));
      track.appendChild(frag);
      return data.products;
    } catch (err) {
      track.innerHTML = '<li class="strip__item"><p class="eyebrow">The collection could not be loaded. Serve the site over http to read data/products.json.</p></li>';
      console.error('[LA PLAGE] products', err);
      return [];
    }
  };

  /* ---------------- Product pop: the hovered garment lifts and tilts toward the cursor ---------------- */
  const initCardPop = () => {
    const strip = document.querySelector('[data-strip]');
    const cursorLabel = document.querySelector('[data-drag-cursor] span');
    track.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const card = e.target.closest('.card');
      if (cursorLabel) cursorLabel.textContent = card && !strip.classList.contains('is-dragging') ? 'View' : 'Drag';
      if (!card) return;
      const r = card.querySelector('.card__media').getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      const lift = card.querySelector('.card__lift');
      lift.style.setProperty('--ry', `${(x * 14).toFixed(2)}deg`);
      lift.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`);
    });
    track.addEventListener('pointerout', (e) => {
      const card = e.target.closest('.card');
      if (card && !card.contains(e.relatedTarget)) {
        const lift = card.querySelector('.card__lift');
        lift.style.removeProperty('--rx'); lift.style.removeProperty('--ry');
      }
    });
  };

  /* ---------------- Spotlight: one product, floating, with details and sizes ---------------- */
  const initSpotlight = (products) => {
    const spot = document.querySelector('[data-spotlight]');
    if (!spot || !products.length) return;
    const $ = (sel) => spot.querySelector(sel);
    const stage = $('[data-spot-stage]');
    const img = $('[data-spot-img]');
    const views = $('[data-spot-views]');
    const sizes = $('[data-spot-sizes]');
    let index = 0, view = 'front', opener = null, closeTimer = 0;

    const render = (dir = 0) => {
      const p = products[index];
      $('[data-spot-index]').textContent = `${String(index + 1).padStart(2, '0')} / ${String(products.length).padStart(2, '0')}`;
      $('[data-spot-title]').textContent = p.title;
      $('[data-spot-desc]').textContent = p.description || '';
      $('[data-spot-color]').textContent = p.color.name;
      $('[data-spot-price]').textContent = formatVND.format(p.price);
      const src = view === 'back' && p.imageHover ? p.imageHover : p.image;
      img.src = src.src; img.alt = view === 'back' && p.imageHover ? p.imageHover.alt : p.image.alt;
      sizes.innerHTML = (p.sizes || []).map((s, i) => `<button type="button" class="size" role="radio" aria-checked="${i === 1}" data-size="${s}">${s}</button>`).join('');
      views.innerHTML = p.imageHover
        ? ['front', 'back'].map((v) => `<button type="button" class="view-btn" aria-pressed="${v === view}" data-view="${v}">${v === 'front' ? 'Front' : 'Back'}</button>`).join('')
        : '';
      // pop the garment in again, entering from the direction of travel
      spot.style.setProperty('--enter-x', `${dir * 60}px`);
      spot.classList.remove('is-switching');
      void stage.offsetWidth;
      spot.classList.add('is-switching');
    };

    const open = (i, from) => {
      clearTimeout(closeTimer);
      index = i; view = 'front'; opener = from || null;
      spot.hidden = false;
      document.documentElement.classList.add('spot-on');
      render(0);
      requestAnimationFrame(() => spot.classList.add('is-open'));
      $('[data-spot-close]').focus({ preventScroll: true });
    };
    const close = () => {
      spot.classList.remove('is-open');
      document.documentElement.classList.remove('spot-on');
      closeTimer = setTimeout(() => { spot.hidden = true; }, 450);
      if (opener) opener.focus({ preventScroll: true });
    };
    const go = (d) => { index = (index + d + products.length) % products.length; view = 'front'; render(d); };

    // The strip captures the pointer while dragging, so the click lands on the viewport:
    // remember which card the press started on.
    const viewport = document.querySelector('[data-strip-viewport]');
    let downCard = null;
    viewport.addEventListener('pointerdown', (e) => { downCard = e.target.closest('.card'); }, true);
    viewport.addEventListener('click', (e) => {
      const card = e.target.closest('.card') || downCard;
      downCard = null;
      if (!card) return;
      e.preventDefault();
      open(parseInt(card.dataset.index, 10) || 0, card);
    });
    $('[data-spot-close]').addEventListener('click', close);
    $('[data-spot-prev]').addEventListener('click', () => go(-1));
    $('[data-spot-next]').addEventListener('click', () => go(1));
    $('[data-spot-access]').addEventListener('click', close);
    sizes.addEventListener('click', (e) => {
      const b = e.target.closest('.size'); if (!b) return;
      sizes.querySelectorAll('.size').forEach((o) => o.setAttribute('aria-checked', String(o === b)));
    });
    views.addEventListener('click', (e) => {
      const b = e.target.closest('.view-btn'); if (!b) return;
      view = b.dataset.view; render(0);
    });
    spot.addEventListener('click', (e) => { if (e.target === spot) close(); });
    spot.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowRight') { go(1); return; }
      if (e.key === 'ArrowLeft') { go(-1); return; }
      if (e.key !== 'Tab') return;
      const f = [...spot.querySelectorAll('button, a[href]')].filter((el) => el.offsetParent !== null);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    // The garment leans toward the cursor
    stage.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = stage.getBoundingClientRect();
      stage.style.setProperty('--ry', `${(((e.clientX - r.left) / r.width - .5) * 16).toFixed(2)}deg`);
      stage.style.setProperty('--rx', `${(-((e.clientY - r.top) / r.height - .5) * 10).toFixed(2)}deg`);
    });
    stage.addEventListener('pointerleave', () => { stage.style.removeProperty('--rx'); stage.style.removeProperty('--ry'); });
    // Swipe between products on touch
    let sx = null;
    stage.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    });
  };

  /* ---------------- Strip: drag with inertia (fine pointers) / native swipe (touch) ---------------- */
  const initStrip = () => {
    const strip = document.querySelector('[data-strip]');
    const viewport = strip.querySelector('[data-strip-viewport]');
    const progress = strip.querySelector('[data-strip-progress]');
    const prevBtn = document.querySelector('[data-strip-prev]');
    const nextBtn = document.querySelector('[data-strip-next]');
    const cursor = document.querySelector('[data-drag-cursor]');

    const state = { x: 0, v: 0, min: 0, dragging: false, moved: 0, lastX: 0, lastT: 0, raf: 0, target: null };
    let mode = null; // 'drag' | 'native'

    const step = () => {
      const item = track.querySelector('.strip__item');
      if (!item) return 300;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return item.offsetWidth + gap;
    };

    const measure = () => {
      state.min = Math.min(0, viewport.clientWidth - track.scrollWidth);
      state.x = clamp(state.x, state.min, 0);
    };

    const updateUI = (ratio) => {
      progress.style.transform = `translate3d(${ratio * (progress.parentElement.clientWidth - progress.offsetWidth - parseFloat(getComputedStyle(progress.parentElement).paddingLeft) * 2)}px,0,0)`;
      prevBtn.disabled = ratio <= 0.001;
      nextBtn.disabled = ratio >= 0.999;
    };

    const render = () => {
      const skew = reduceMotion.matches ? 0 : clamp(-state.v * 1.4, -3, 3);
      track.style.transform = `translate3d(${state.x}px,0,0) skewX(${skew}deg)`;
      updateUI(state.min ? state.x / state.min : 0);
    };

    // Rubber band past the edges while dragging
    const rubber = (x) => {
      if (x > 0) return x * 0.35;
      if (x < state.min) return state.min + (x - state.min) * 0.35;
      return x;
    };

    const tick = () => {
      if (state.dragging) { state.raf = 0; return; }
      if (state.target !== null) {
        // eased glide to a target (buttons, keyboard focus)
        const d = state.target - state.x;
        state.v = d * 0.08 / 16;
        state.x += d * 0.08;
        if (Math.abs(d) < 0.5) { state.x = state.target; state.target = null; state.v = 0; }
      } else {
        state.x += state.v * 16;
        state.v *= 0.94; // friction
        // spring back inside bounds
        if (state.x > 0) { state.x += (0 - state.x) * 0.16; state.v *= 0.6; }
        if (state.x < state.min) { state.x += (state.min - state.x) * 0.16; state.v *= 0.6; }
        if (Math.abs(state.v) < 0.005 && state.x <= 0.5 && state.x >= state.min - 0.5) {
          state.v = 0; state.x = clamp(state.x, state.min, 0);
          render(); state.raf = 0; return;
        }
      }
      render();
      state.raf = requestAnimationFrame(tick);
    };
    const run = () => { if (!state.raf) state.raf = requestAnimationFrame(tick); };

    const glideTo = (x) => {
      measure();
      state.target = clamp(x, state.min, 0);
      if (reduceMotion.matches) { state.x = state.target; state.target = null; render(); return; }
      run();
    };

    /* pointer drag */
    const onDown = (e) => {
      if (mode !== 'drag' || e.button !== 0) return;
      measure();
      state.dragging = true; state.moved = 0; state.target = null; state.v = 0;
      state.lastX = e.clientX; state.lastT = performance.now();
      viewport.setPointerCapture(e.pointerId);
      cursor.classList.add('is-pressed');
    };
    const onMove = (e) => {
      if (mode === 'drag') moveCursor(e);
      if (!state.dragging) return;
      const now = performance.now();
      const dx = e.clientX - state.lastX;
      const dt = Math.max(1, now - state.lastT);
      state.moved += Math.abs(dx);
      if (state.moved > 6) strip.classList.add('is-dragging');
      state.x = rubber(state.x + (state.x > 0 || state.x < state.min ? dx * 0.5 : dx));
      state.v = state.v * 0.6 + (dx / dt) * 0.4; // smoothed px/ms
      state.lastX = e.clientX; state.lastT = now;
      render();
    };
    const onUp = (e) => {
      if (!state.dragging) return;
      state.dragging = false;
      cursor.classList.remove('is-pressed');
      if (viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);
      if (performance.now() - state.lastT > 80) state.v = 0; // paused before release
      if (reduceMotion.matches) { state.v = 0; state.x = clamp(state.x, state.min, 0); render(); }
      requestAnimationFrame(() => strip.classList.remove('is-dragging'));
      run();
    };
    // swallow the click that ends a drag
    viewport.addEventListener('click', (e) => { if (state.moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);

    /* custom cursor */
    let cx = -200, cy = -200, tx = -200, ty = -200, cursorRaf = 0;
    const cursorLoop = () => {
      cx += (tx - cx) * (reduceMotion.matches ? 1 : 0.22);
      cy += (ty - cy) * (reduceMotion.matches ? 1 : 0.22);
      cursor.style.transform = `translate3d(${cx}px,${cy}px,0) scale(${state.dragging ? 0.82 : 1})`;
      cursorRaf = (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.3) ? requestAnimationFrame(cursorLoop) : 0;
    };
    const moveCursor = (e) => {
      tx = e.clientX; ty = e.clientY;
      if (cx === -200) { cx = tx; cy = ty; }
      if (!cursorRaf) cursorRaf = requestAnimationFrame(cursorLoop);
    };
    viewport.addEventListener('pointerenter', (e) => { if (mode === 'drag' && e.pointerType === 'mouse') { moveCursor(e); cursor.classList.add('is-visible'); } });
    viewport.addEventListener('pointerleave', () => { if (!state.dragging) cursor.classList.remove('is-visible'); });

    viewport.addEventListener('pointerdown', onDown);
    viewport.addEventListener('pointermove', onMove);
    viewport.addEventListener('pointerup', onUp);
    viewport.addEventListener('pointercancel', onUp);

    /* wheel / trackpad horizontal scroll in drag mode */
    viewport.addEventListener('wheel', (e) => {
      if (mode !== 'drag' || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      state.target = null;
      state.x = clamp(state.x - e.deltaX, state.min, 0);
      state.v = 0; render();
    }, { passive: false });

    /* keep focused cards in view (keyboard) */
    track.addEventListener('focusin', (e) => {
      const item = e.target.closest('.strip__item');
      if (!item) return;
      if (mode === 'drag') {
        viewport.scrollLeft = 0;
        const left = item.offsetLeft, right = left + item.offsetWidth;
        const pad = parseFloat(getComputedStyle(track).paddingLeft);
        if (left + state.x < pad) glideTo(-(left - pad));
        else if (right + state.x > viewport.clientWidth - pad) glideTo(-(right - viewport.clientWidth + pad));
      }
    });
    viewport.addEventListener('scroll', () => {
      if (mode === 'drag') { viewport.scrollLeft = 0; return; }
      const max = viewport.scrollWidth - viewport.clientWidth;
      updateUI(max > 0 ? viewport.scrollLeft / max : 0);
    }, { passive: true });

    /* prev / next */
    const page = (dir) => {
      if (mode === 'drag') glideTo(Math.round((state.x - dir * step()) / step()) * step());
      else viewport.scrollBy({ left: dir * step(), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    };
    prevBtn.addEventListener('click', () => page(-1));
    nextBtn.addEventListener('click', () => page(1));

    /* switch modes with input type */
    const setMode = () => {
      const next = finePointer.matches ? 'drag' : 'native';
      if (next === mode) { measure(); render(); return; }
      mode = next;
      strip.classList.toggle('is-draggable', mode === 'drag');
      state.x = 0; state.v = 0;
      if (mode === 'native') { track.style.transform = ''; cursor.classList.remove('is-visible'); updateUI(0); }
      else { viewport.scrollLeft = 0; measure(); render(); }
    };
    finePointer.addEventListener?.('change', setMode);
    window.addEventListener('resize', setMode);
    if ('ResizeObserver' in window) new ResizeObserver(() => setMode()).observe(track);
    setMode();
  };

  /* ---------------- Lookbook parallax ---------------- */
  const initParallax = () => {
    const imgs = [...document.querySelectorAll('[data-parallax]')];
    if (!imgs.length) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      if (reduceMotion.matches) { imgs.forEach((img) => { img.style.transform = ''; }); return; }
      const vh = window.innerHeight;
      imgs.forEach((img) => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const offset = (r.top + r.height / 2 - vh / 2) * parseFloat(img.dataset.parallax);
        img.style.transform = `translate3d(0, ${clamp(-offset, -r.height * 0.08, r.height * 0.08)}px, 0)`;
      });
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  };

  /* ---------------- Private access form (no backend yet) ---------------- */
  const initAccess = () => {
    const form = document.querySelector('[data-access-form]');
    const input = form.querySelector('input');
    const status = document.getElementById('access-status');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = input.value.trim() && input.checkValidity();
      input.setAttribute('aria-invalid', String(!ok));
      status.classList.toggle('is-error', !ok);
      if (!ok) { status.textContent = 'Please enter a valid email address.'; input.focus(); return; }
      // TODO: connect to the mailing platform (e.g. Shopify customer marketing / Klaviyo)
      status.textContent = 'Thank you. We will write before the next drop.';
      form.reset();
    });
    input.addEventListener('input', () => { input.removeAttribute('aria-invalid'); status.classList.remove('is-error'); status.textContent = ''; });
  };

  /* ---------------- Footer language toggle (visual only for now) ---------------- */
  const initLocale = () => {
    const btns = document.querySelectorAll('[data-lang]');
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    }));
    const y = document.querySelector('[data-year]');
    if (y) y.textContent = new Date().getFullYear();
  };

  /* ---------------- Hero palms: depth parallax with the mouse and on scroll ---------------- */
  const initHeroScene = () => {
    const hero = document.querySelector('[data-hero]');
    const layers = [...document.querySelectorAll('[data-hero-scene] [data-depth]')];
    if (!hero || !layers.length) return;
    let mx = 0, my = 0, tx = 0, ty = 0, sy = 0, raf = 0;
    const loop = () => {
      tx += (mx - tx) * .06; ty += (my - ty) * .06;
      layers.forEach((l) => {
        const d = parseFloat(l.dataset.depth);
        l.style.setProperty('--lx', `${(tx * d * 30).toFixed(2)}px`);
        l.style.setProperty('--ly', `${(ty * d * 14 + sy * d * .35).toFixed(2)}px`);
      });
      raf = Math.abs(mx - tx) + Math.abs(my - ty) > .001 ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    hero.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX / window.innerWidth - .5;
      my = e.clientY / window.innerHeight - .5;
      kick();
    });
    hero.addEventListener('pointerleave', () => { mx = 0; my = 0; kick(); });
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > window.innerHeight * 1.2) return;
      sy = y; kick();
      // keep the loop alive for one frame even when the mouse is still
      layers.forEach((l) => l.style.setProperty('--ly', `${(ty * parseFloat(l.dataset.depth) * 14 + sy * parseFloat(l.dataset.depth) * .35).toFixed(2)}px`));
    }, { passive: true });
  };

  /* ---------------- Boot ---------------- */
  updateNav();
  window.addEventListener('scroll', queueNav, { passive: true });
  window.addEventListener('resize', queueNav);
  initScrollSpy();
  initHeroScene();
  initParallax();
  initAccess();
  initLocale();
  loadProducts().then((products) => { initAnimations(); initStrip(); initCardPop(); initSpotlight(products); });
})();

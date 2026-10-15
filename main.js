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

  /* ---------------- Products: a clean grid of floating, rotatable pieces ---------------- */
  const grid = document.querySelector('[data-grid]');
  let PRODUCTS = [];

  const productItem = (p, i) => {
    const li = document.createElement('li');
    li.className = 'product';
    li.innerHTML = `
      <div class="product__stage" data-spin-host="${i}"></div>
      <div class="product__info">
        <h3 class="product__name"><button type="button" class="product__view" data-view="${i}">${p.title}</button></h3>
        <p class="product__color">${p.color.name}</p>
        <p class="product__price">${formatVND.format(p.price)}</p>
      </div>
      <button type="button" class="btn-outline product__add" data-add="${i}">Add to cart</button>`;
    return li;
  };

  const loadProducts = async () => {
    try {
      const res = await fetch('data/products.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      PRODUCTS = data.products;
      const frag = document.createDocumentFragment();
      PRODUCTS.forEach((p, i) => frag.appendChild(productItem(p, i)));
      grid.appendChild(frag);
      grid.querySelectorAll('[data-spin-host]').forEach((host) => {
        const p = PRODUCTS[+host.dataset.spinHost];
        new window.LaPlageSpin(host, {
          front: p.cutout.front, back: p.cutout.back, alt: `${p.title} in ${p.color.name}`,
          delay: -(+host.dataset.spinHost * 0.7), start: (+host.dataset.spinHost * 37) % 360 - 20,
        });
      });
      return PRODUCTS;
    } catch (err) {
      grid.innerHTML = '<li class="product"><p class="label">The collection could not be loaded. Serve the site over http to read data/products.json.</p></li>';
      console.error('[LA PLAGE] products', err);
      return [];
    }
  };

  /* ---------------- Bag: add to cart, kept in this browser ---------------- */
  const bag = (() => {
    const KEY = 'laplage-bag';
    let items = [];
    try { items = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { items = []; }
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* private mode */ } };
    const drawer = document.querySelector('[data-bag]');
    const list = document.querySelector('[data-bag-list]');
    const total = document.querySelector('[data-bag-total]');
    const counts = document.querySelectorAll('[data-bag-count]');
    const toast = document.querySelector('[data-toast]');
    let toastTimer = 0, opener = null;

    const find = (id) => PRODUCTS.find((p) => p.id === id);
    const render = () => {
      items = items.filter((it) => find(it.id));
      const n = items.reduce((s, it) => s + it.qty, 0);
      counts.forEach((c) => { c.textContent = n; });
      if (!list) return;
      list.innerHTML = items.length ? items.map((it, k) => {
        const p = find(it.id);
        return `<li class="bag__line">
          <img src="${p.cutout.front}" alt="" width="64" height="64">
          <div class="bag__meta">
            <p class="bag__name">${p.title}</p>
            <label class="bag__size">Size
              <select data-line-size="${k}">${(p.sizes || ['One size']).map((s) => `<option${s === it.size ? ' selected' : ''}>${s}</option>`).join('')}</select>
            </label>
            <div class="bag__qty">
              <button type="button" aria-label="One less" data-line-dec="${k}">&minus;</button>
              <span>${it.qty}</span>
              <button type="button" aria-label="One more" data-line-inc="${k}">+</button>
            </div>
          </div>
          <div class="bag__right">
            <p>${formatVND.format(p.price * it.qty)}</p>
            <button type="button" class="link bag__remove" data-line-remove="${k}">Remove</button>
          </div>
        </li>`;
      }).join('') : '<li class="bag__empty">Your bag is empty.</li>';
      total.textContent = formatVND.format(items.reduce((s, it) => s + find(it.id).price * it.qty, 0));
    };
    const add = (p, size) => {
      const s = size || (p.sizes && (p.sizes.includes('M') ? 'M' : p.sizes[0])) || 'One size';
      const hit = items.find((it) => it.id === p.id && it.size === s);
      if (hit) hit.qty += 1; else items.push({ id: p.id, size: s, qty: 1 });
      save(); render();
      document.querySelectorAll('[data-bag-open]').forEach((b) => { b.classList.remove('is-bumped'); void b.offsetWidth; b.classList.add('is-bumped'); });
      if (toast) {
        toast.textContent = `Added to bag · ${p.title} · ${s}`;
        toast.classList.add('is-on');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2600);
      }
    };
    const open = (from) => {
      opener = from || null;
      drawer.hidden = false;
      document.documentElement.classList.add('bag-on');
      requestAnimationFrame(() => drawer.classList.add('is-open'));
      drawer.querySelector('[data-bag-close]').focus({ preventScroll: true });
    };
    const close = () => {
      drawer.classList.remove('is-open');
      document.documentElement.classList.remove('bag-on');
      setTimeout(() => { drawer.hidden = true; }, 400);
      if (opener) opener.focus({ preventScroll: true });
    };
    if (drawer) {
      document.querySelectorAll('[data-bag-open]').forEach((b) => b.addEventListener('click', () => open(b)));
      drawer.querySelector('[data-bag-close]').addEventListener('click', close);
      drawer.querySelector('[data-bag-access]').addEventListener('click', close);
      drawer.addEventListener('click', (e) => { if (e.target === drawer) close(); });
      drawer.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
      list.addEventListener('click', (e) => {
        const t = e.target.closest('button'); if (!t) return;
        const k = +(t.dataset.lineInc ?? t.dataset.lineDec ?? t.dataset.lineRemove);
        if (t.dataset.lineInc !== undefined) items[k].qty += 1;
        else if (t.dataset.lineDec !== undefined) { items[k].qty -= 1; if (items[k].qty < 1) items.splice(k, 1); }
        else if (t.dataset.lineRemove !== undefined) items.splice(k, 1);
        save(); render();
      });
      list.addEventListener('change', (e) => {
        const sel = e.target.closest('[data-line-size]'); if (!sel) return;
        items[+sel.dataset.lineSize].size = sel.value; save(); render();
      });
    }
    return { add, render };
  })();

  /* ---------------- Spotlight: one piece, large, rotatable, with details and sizes ---------------- */
  const initSpotlight = (products) => {
    const spot = document.querySelector('[data-spotlight]');
    if (!spot || !products.length) return;
    const $ = (sel) => spot.querySelector(sel);
    const stage = $('[data-spot-stage]');
    const views = $('[data-spot-views]');
    const sizes = $('[data-spot-sizes]');
    let index = 0, opener = null, closeTimer = 0, spin = null;

    const render = () => {
      const p = products[index];
      $('[data-spot-index]').textContent = `${String(index + 1).padStart(2, '0')} / ${String(products.length).padStart(2, '0')}`;
      $('[data-spot-title]').textContent = p.title;
      $('[data-spot-desc]').textContent = p.description || '';
      $('[data-spot-color]').textContent = p.color.name;
      $('[data-spot-price]').textContent = formatVND.format(p.price);
      sizes.innerHTML = (p.sizes || []).map((s) => `<button type="button" class="size" role="radio" aria-checked="${s === 'M'}" data-size="${s}">${s}</button>`).join('');
      views.innerHTML = ['Front', 'Back'].map((v, k) => `<button type="button" class="view-btn" data-view-angle="${k * 180}">${v}</button>`).join('');
      if (spin) spin.destroy();
      spin = new window.LaPlageSpin(stage, { front: p.cutout.front, back: p.cutout.back, alt: `${p.title} in ${p.color.name}`, start: -25 });
      spot.classList.remove('is-switching'); void stage.offsetWidth; spot.classList.add('is-switching');
    };
    const open = (i, from) => {
      clearTimeout(closeTimer);
      index = i; opener = from || null;
      spot.hidden = false;
      document.documentElement.classList.add('spot-on');
      render();
      requestAnimationFrame(() => spot.classList.add('is-open'));
      $('[data-spot-close]').focus({ preventScroll: true });
    };
    const close = () => {
      spot.classList.remove('is-open');
      document.documentElement.classList.remove('spot-on');
      closeTimer = setTimeout(() => { spot.hidden = true; if (spin) { spin.destroy(); spin = null; } }, 450);
      if (opener) opener.focus({ preventScroll: true });
    };
    const go = (d) => { index = (index + d + products.length) % products.length; render(); };

    grid.addEventListener('click', (e) => {
      const v = e.target.closest('[data-view]');
      if (v) { open(+v.dataset.view, v); return; }
      const a = e.target.closest('[data-add]');
      if (a) bag.add(products[+a.dataset.add]);
    });
    $('[data-spot-close]').addEventListener('click', close);
    $('[data-spot-prev]').addEventListener('click', () => go(-1));
    $('[data-spot-next]').addEventListener('click', () => go(1));
    $('[data-spot-add]').addEventListener('click', () => {
      const chosen = sizes.querySelector('[aria-checked="true"]');
      bag.add(products[index], chosen ? chosen.dataset.size : undefined);
    });
    sizes.addEventListener('click', (e) => {
      const b = e.target.closest('.size'); if (!b) return;
      sizes.querySelectorAll('.size').forEach((o) => o.setAttribute('aria-checked', String(o === b)));
    });
    views.addEventListener('click', (e) => {
      const b = e.target.closest('[data-view-angle]'); if (b && spin) spin.goTo(+b.dataset.viewAngle);
    });
    spot.addEventListener('click', (e) => { if (e.target === spot) close(); });
    spot.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { close(); return; }
      if (e.target.closest('.spin')) return;           // arrow keys rotate the piece when it has focus
      if (e.key === 'ArrowRight') { go(1); return; }
      if (e.key === 'ArrowLeft') { go(-1); return; }
      if (e.key !== 'Tab') return;
      const f = [...spot.querySelectorAll('button, a[href], [tabindex="0"]')].filter((el) => el.offsetParent !== null);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
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
  loadProducts().then((products) => { initAnimations(); bag.render(); initSpotlight(products); });
})();

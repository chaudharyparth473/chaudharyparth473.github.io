(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ── Evidence locker: certificates ── */
  const CERTS = window.CERTS || [];
  const CATS = [
    ['all', 'All'],
    ['edu', 'Education'],
    ['sports', 'Sports'],
    ['physical', 'Physical'],
    ['college', 'Represented my college'],
  ];
  const catName = Object.fromEntries(CATS);
  const countOf = (k) => k === 'all' ? CERTS.length : CERTS.filter((c) => c.cats.includes(k)).length;
  const grid = $('#certGrid'), filtersEl = $('#filters');
  let activeFilter = 'all';
  let toastTimer;
  const toast = (msg) => {
    $$('.toast').forEach((t) => t.remove());
    const t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), 2200);
  };
  const closeMenus = (except) => {
    $$('.menu:not([hidden])').forEach((m) => {
      if (m === except) return;
      m.hidden = true;
      const b = m.previousElementSibling;
      if (b && b.hasAttribute('aria-expanded')) b.setAttribute('aria-expanded', 'false');
    });
  };
  const toggleMenu = (btn, menu) => {
    const open = menu.hidden;
    closeMenus(open ? menu : null);
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) { const f = $('a, button', menu); if (f && !btn.dataset.mouse) f.focus(); }
  };
  document.addEventListener('click', (e) => { if (!e.target.closest('.dots, .kebab')) closeMenus(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const openMenu = $('.menu:not([hidden])');
    if (openMenu) { const b = openMenu.previousElementSibling; closeMenus(); if (b) b.focus(); }
  });

  function applyFilter(key, { scroll = false } = {}) {
    activeFilter = key;
    $$('.chip', filtersEl).forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.key === key)));
    $$('.cert', grid).forEach((li) => {
      li.hidden = !(key === 'all' || li.dataset.cats.split(' ').includes(key));
    });
    if (scroll) $('#certs').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }

  if (grid && filtersEl && CERTS.length) {
    CATS.forEach(([key, label]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.dataset.key = key;
      b.setAttribute('aria-pressed', String(key === 'all'));
      b.innerHTML = `${label}<i>${countOf(key)}</i>`;
      b.addEventListener('click', () => applyFilter(key));
      filtersEl.appendChild(b);
    });

    CERTS.forEach((c) => {
      const li = document.createElement('li');
      li.className = 'cert reveal';
      li.dataset.cats = c.cats.join(' ');
      const short = c.sha.slice(0, 8) + '…' + c.sha.slice(-6);
      li.innerHTML = `
        <a class="thumb" href="${c.file}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">
          <img src="${c.thumb}" alt="" loading="lazy" width="520" height="390">
        </a>
        <div class="cert-body">
          <p class="mono small cert-cat">${c.cats.map((k) => catName[k]).join(' · ')}</p>
          <h3><a href="${c.file}" target="_blank" rel="noopener">${c.title}</a></h3>
          <p class="meta">${c.issuer} · ${c.date}</p>
          <code class="mono hash" title="SHA-256 ${c.sha}">sha256 ${short}</code>
        </div>
        <div class="kebab">
          <button class="kebab-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Options for ${c.title.replace(/"/g, '&quot;')}">
            <span></span><span></span><span></span>
          </button>
          <div class="menu" role="menu" hidden>
            <a role="menuitem" href="${c.file}" target="_blank" rel="noopener">Open certificate <b>↗</b></a>
            <a role="menuitem" href="${c.file}" download>Download PDF <b>↓</b></a>
            <button role="menuitem" type="button" data-copy="${c.sha}">Copy SHA-256 <b>⧉</b></button>
          </div>
        </div>`;
      const btn = $('.kebab-btn', li), menu = $('.menu', li);
      btn.addEventListener('pointerdown', () => { btn.dataset.mouse = '1'; });
      btn.addEventListener('click', () => { toggleMenu(btn, menu); delete btn.dataset.mouse; });
      $('[data-copy]', li).addEventListener('click', async (e) => {
        const sha = e.currentTarget.dataset.copy;
        try { await navigator.clipboard.writeText(sha); toast('SHA-256 copied'); }
        catch { toast('Copy blocked, hash is in the card tooltip'); }
        closeMenus();
      });
      grid.appendChild(li);
    });

    /* three-dot quick access in the header */
    const dBtn = $('#dotsBtn'), dMenu = $('#dotsMenu');
    $$('[data-count]').forEach((n) => { n.textContent = countOf(n.dataset.count); });
    dBtn.addEventListener('pointerdown', () => { dBtn.dataset.mouse = '1'; });
    dBtn.addEventListener('click', () => { toggleMenu(dBtn, dMenu); delete dBtn.dataset.mouse; });
    $$('[data-filter]', dMenu).forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      applyFilter(a.dataset.filter, { scroll: true });
      closeMenus();
    }));
  }

  /* terminal count + typing */
  const countEl = $('#termCount'); if (countEl && CERTS.length) countEl.textContent = CERTS.length;
  const term = $('#term');
  if (term && !reduce) {
    const nodes = $$('.cmd, .out', term);
    const texts = nodes.map((n) => n.textContent);
    nodes.forEach((n) => { n.textContent = ''; n.style.visibility = 'hidden'; });
    let i = 0;
    const typeNext = () => {
      if (i >= nodes.length) return;
      const n = nodes[i], txt = texts[i], isCmd = n.classList.contains('cmd');
      n.style.visibility = 'visible';
      let k = 0;
      const step = () => {
        k += isCmd ? 1 : 4;
        n.textContent = txt.slice(0, k);
        if (k < txt.length) setTimeout(step, isCmd ? 45 : 12);
        else { i++; setTimeout(typeNext, isCmd ? 260 : 120); }
      };
      step();
    };
    setTimeout(typeNext, 900);
  }

  /* ── Scroll reveal ── */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el, i) => {
      el.style.transitionDelay = (el.closest('.hero') ? i * 90 : 0) + 'ms';
      io.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ── Footer year ── */
  const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  /* ── Altimeter: climbs from 0 to 17,350 ft as you scroll ── */
  const fill = $('#altFill'), ft = $('#altFt'), nameEl = $('#altName');
  const SUMMIT = 17350;
  const marks = [
    [0, 'Gandhinagar'],
    [5000, 'Kedarkantha country'],
    [13850, 'Sar Pass'],
    [17350, 'Friendship Peak'],
  ];
  function updateAlt() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    const alt = Math.round(p * SUMMIT);
    if (fill) fill.style.height = (p * 100) + '%';
    if (ft) ft.textContent = alt.toLocaleString('en-IN');
    if (nameEl) {
      let label = marks[0][1];
      for (const [h, n] of marks) if (alt >= h) label = n;
      nameEl.textContent = label;
    }
  }
  addEventListener('scroll', updateAlt, { passive: true });
  addEventListener('resize', updateAlt);
  updateAlt();

  /* ── Contour map background (drifts slowly, leans toward the cursor) ── */
  const svg = $('#contours');
  if (svg) {
    const NS = 'http://www.w3.org/2000/svg';
    const W = 1600, H = 1000;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const peaks = [
      { x: 1180, y: 300, rings: 15, step: 36, seed: 1.3 },
      { x: 260, y: 780, rings: 11, step: 34, seed: 4.1 },
    ];
    const rings = [];
    peaks.forEach((pk) => {
      for (let i = 1; i <= pk.rings; i++) {
        const path = document.createElementNS(NS, 'path');
        svg.appendChild(path);
        rings.push({ path, pk, r: i * pk.step, i });
      }
    });
    const N = 90;
    let t = 0, mx = 0, my = 0;
    function draw() {
      rings.forEach(({ path, pk, r, i }) => {
        let d = '';
        for (let k = 0; k <= N; k++) {
          const a = (k / N) * Math.PI * 2;
          const wob = 1
            + 0.11 * Math.sin(a * 3 + pk.seed + t * 0.4 + i * 0.12)
            + 0.07 * Math.sin(a * 5 - pk.seed * 2 + t * 0.3)
            + 0.04 * Math.sin(a * 8 + i * 0.3 - t * 0.2);
          const x = pk.x + mx * (i * 0.6) + Math.cos(a) * r * wob * 1.25;
          const y = pk.y + my * (i * 0.6) + Math.sin(a) * r * wob * 0.85;
          d += (k ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
        }
        path.setAttribute('d', d + 'Z');
      });
    }
    draw();
    if (!reduce) {
      addEventListener('pointermove', (e) => {
        mx = (e.clientX / innerWidth - 0.5) * 18;
        my = (e.clientY / innerHeight - 0.5) * 18;
      }, { passive: true });
      let last = 0;
      (function loop(now) {
        if (now - last > 40 && !document.hidden) { t += 0.02; draw(); last = now; }
        requestAnimationFrame(loop);
      })(0);
    }
  }

  /* ── Custom cursor + magnetic buttons ── */
  if (fine && !reduce) {
    const cur = $('#cursor');
    let cx = 0, cy = 0, tx = 0, ty = 0;
    document.body.classList.add('has-cursor');
    addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY; cur.classList.add('on');
    }, { passive: true });
    document.addEventListener('mouseleave', () => cur.classList.remove('on'));
    (function follow() {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cur.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(follow);
    })();
    $$('a, button, [data-tilt]').forEach((el) => {
      el.addEventListener('mouseenter', () => cur.classList.add('big'));
      el.addEventListener('mouseleave', () => cur.classList.remove('big'));
    });

    $$('[data-magnetic]').forEach((el) => {
      const inner = el.firstElementChild;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * 0.22}px, ${dy * 0.32}px)`;
        if (inner) inner.style.transform = `translate(${dx * 0.1}px, ${dy * 0.14}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transform = '';
        if (inner) inner.style.transform = '';
      });
    });

    /* ── Gentle card tilt ── */
    $$('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        if (!card.classList.contains('in')) return;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.classList.add('tilting');
        card.style.setProperty('--ry', (px * 4).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (-py * 4).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('tilting');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }
})();

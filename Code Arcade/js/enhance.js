/**
 * Code Arcade - progressive motion enhancements.
 * Purely additive: the site is fully usable if this file never runs.
 * Disabled automatically for reduced-motion users; heavy effects are skipped
 * on touch devices and small screens.
 */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* --- Trigger hero entrance once the preloader is out of the way --- */
  const ready = () => root.classList.add('is-ready');
  if (document.readyState === 'complete') setTimeout(ready, 150);
  else { window.addEventListener('load', () => setTimeout(ready, 150), { once: true }); setTimeout(ready, 3200); }

  if (reduce) return;

  const hero = document.getElementById('home');

  /* --- Hero particle network --- */
  function initParticles() {
    if (!hero || window.innerWidth < 700) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'hero-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    hero.insertBefore(canvas, hero.querySelector('.container'));
    const ctx = canvas.getContext('2d');
    let w, h, dpr, pts = [], raf, visible = true;
    const mouse = { x: -999, y: -999 };

    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(70, Math.round((w * h) / 22000));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.4 + 0.6
      }));
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fillStyle = 'rgba(125, 211, 252, 0.7)'; ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = dx * dx + dy * dy;
          if (d < 14000) {
            ctx.strokeStyle = `rgba(129, 140, 248, ${0.22 * (1 - d / 14000)})`;
            ctx.lineWidth = 1; ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
          }
        }
        const mx = pts[i].x - mouse.x, my = pts[i].y - mouse.y, md = mx * mx + my * my;
        if (md < 20000) {
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 * (1 - md / 20000)})`;
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    size(); start();
    let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(size, 200); });
    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
    // Pause when off-screen or tab hidden (saves battery)
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(hero);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  }

  /* --- Hero background parallax --- */
  function initParallax() {
    const bg = document.querySelector('.hero-bg');
    if (!bg || !hero) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const y = Math.min(window.scrollY * 0.25, hero.offsetHeight * 0.09);
        bg.style.translate = `0 ${y}px`; ticking = false;
      });
    }, { passive: true });
  }

  /* --- 3D tilt + glare on cards, magnetic CTA buttons (mouse only) --- */
  function initInteractive() {
    if (!finePointer) return;

    document.querySelectorAll('.service-card, .project-card, .why-card, .feature-box').forEach(card => {
      card.classList.add('tilt');
      const glare = document.createElement('span');
      glare.className = 'tilt-glare'; glare.setAttribute('aria-hidden', 'true');
      card.appendChild(glare);
      let settle;

      card.addEventListener('pointerenter', () => {
        clearTimeout(settle);
        card.style.transition = 'transform 0.12s ease-out'; card.style.transitionDelay = '0s';
      });
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 7}deg) rotateY(${(px - 0.5) * 9}deg) translateY(-6px)`;
        card.style.setProperty('--mx', `${px * 100}%`); card.style.setProperty('--my', `${py * 100}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        card.style.transform = '';
        settle = setTimeout(() => { card.style.transition = ''; card.style.transitionDelay = ''; }, 650);
      });
    });

    document.querySelectorAll('.btn-primary, .btn-secondary, .btn-submit').forEach(btn => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.12}px ${(e.clientY - r.top - r.height / 2) * 0.2}px`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.translate = ''; });
    });
  }

  initParticles();
  initParallax();
  initInteractive();
})();

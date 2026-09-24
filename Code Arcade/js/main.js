/**
 * Code Arcade — Production JavaScript
 * ─────────────────────────────────────────────────────────────────────────────
 * Covers: Preloader, ScrollSpy, Scroll Progress, Ambient Glow, Counter
 *         Animation, Project Filter, Modals (with Focus Trap), Contact &
 *         Quote Forms, Toast System, Scroll-To-Top, Reduced-Motion Support,
 *         Mobile Menu, Keyboard Navigation, Analytics-Ready events.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

/* ──────────────────────────────────────────────
   Utility Helpers
   ────────────────────────────────────────────── */

/** Throttle fn to run at most once per `limit` ms */
function throttle(fn, limit = 100) {
  let lastRun = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastRun >= limit) { lastRun = now; fn.apply(this, args); }
  };
}

/** Debounce fn — waits `delay` ms after last call */
function debounce(fn, delay = 150) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/** Sanitise a string to prevent XSS in innerHTML */
function sanitise(str) {
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

/** Detect reduced-motion preference */
const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ──────────────────────────────────────────────
   1. Preloader
   ────────────────────────────────────────────── */
function initPreloader() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  const dismiss = () => {
    preloader.classList.add('preloader--hidden');
    setTimeout(() => preloader.remove(), 600);
  };

  // Dismiss once all resources load, or after 3 s max (whichever first)
  if (document.readyState === 'complete') {
    dismiss();
  } else {
    window.addEventListener('load', dismiss, { once: true });
    setTimeout(dismiss, 3000);
  }
}

/* ──────────────────────────────────────────────
   2. Scroll Progress Bar
   ────────────────────────────────────────────── */
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress-bar');
  if (!bar || prefersReducedMotion) return;

  const update = () => {
    const scrolled = window.scrollY || document.documentElement.scrollTop;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = total > 0 ? `${Math.min((scrolled / total) * 100, 100)}%` : '0%';
  };

  window.addEventListener('scroll', throttle(update, 16), { passive: true });
  update();
}

/* ──────────────────────────────────────────────
   3. Ambient Cursor Glow (RAF-based, throttled)
   ────────────────────────────────────────────── */
function initAmbientGlow() {
  const el = document.getElementById('ambient-glow-follower');
  if (!el || prefersReducedMotion) {
    if (el) el.style.display = 'none';
    return;
  }

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;
  let rafId;

  const onMove = throttle((e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  }, 30);

  window.addEventListener('mousemove', onMove, { passive: true });

  const animate = () => {
    currentX += (targetX - currentX) * 0.07;
    currentY += (targetY - currentY) * 0.07;
    el.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
    rafId = requestAnimationFrame(animate);
  };
  rafId = requestAnimationFrame(animate);

  // Pause animation when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      rafId = requestAnimationFrame(animate);
    }
  });
}

/* ──────────────────────────────────────────────
   4. Navbar — Scroll Effect + ScrollSpy
   ────────────────────────────────────────────── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = Array.from(document.querySelectorAll('section[id]'));
  if (!navbar) return;

  const onScroll = throttle(() => {
    // Sticky glass effect
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // ScrollSpy — highlight active nav link
    const scrollMid = window.scrollY + window.innerHeight / 2;
    let active = sections[0];

    for (const sec of sections) {
      if (sec.offsetTop <= scrollMid) active = sec;
    }

    if (active) {
      navLinks.forEach(link => {
        const isActive = link.getAttribute('href') === `#${active.id}`;
        link.classList.toggle('active', isActive);
        link.setAttribute('aria-current', isActive ? 'true' : 'false');
      });
    }
  }, 80);

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ──────────────────────────────────────────────
   5. Mobile Menu Toggle
   ────────────────────────────────────────────── */
function initMobileMenu() {
  const toggle = document.getElementById('mobile-toggle');
  const nav = document.getElementById('nav-links');
  if (!toggle || !nav) return;

  const open = () => {
    nav.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.querySelector('i')?.classList.replace('fa-bars', 'fa-xmark');
  };

  const close = () => {
    nav.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.querySelector('i')?.classList.replace('fa-xmark', 'fa-bars');
  };

  toggle.addEventListener('click', () => {
    nav.classList.contains('active') ? close() : open();
  });

  // Close on any nav link click
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', close));

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !toggle.contains(e.target)) close();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('active')) {
      close();
      toggle.focus();
    }
  });
}

/* ──────────────────────────────────────────────
   6. Stat Counter Animation
   ────────────────────────────────────────────── */
function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (!counters.length) return;

  if (prefersReducedMotion) {
    counters.forEach(c => {
      c.textContent = `${c.dataset.target}${c.dataset.suffix || ''}`;
    });
    return;
  }

  let done = false;
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !done) {
      done = true;
      counters.forEach(counter => {
        const target = +counter.dataset.target;
        const suffix = counter.dataset.suffix || '';
        const duration = 1200; // ms
        const start = performance.now();

        const tick = (now) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          counter.textContent = `${Math.round(eased * target)}${suffix}`;
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }
  }, { threshold: 0.5 });

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) observer.observe(heroStats);
}

/* ──────────────────────────────────────────────
   7. Scroll Reveal — IntersectionObserver
   ────────────────────────────────────────────── */
function initScrollReveal() {
  const els = document.querySelectorAll(
    '.reveal, .reveal-left, .reveal-right, .reveal-zoom'
  );
  if (!els.length) return;

  if (prefersReducedMotion) {
    els.forEach(el => el.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target); // fire once only
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  els.forEach(el => observer.observe(el));
}

/* ──────────────────────────────────────────────
   8. Project Filter
   ────────────────────────────────────────────── */
function initProjectFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.project-card');
  if (!filterBtns.length || !cards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');

      const filter = btn.dataset.filter;

      cards.forEach(card => {
        const cat = card.dataset.category || '';
        const show = filter === 'all' || cat.includes(filter);
        card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';

        if (show) {
          card.style.removeProperty('display');
          // Force reflow so transition fires
          void card.offsetWidth;
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(12px)';
          setTimeout(() => {
            if (card.style.opacity === '0') card.style.display = 'none';
          }, 260);
        }
      });
    });
  });
}

/* ──────────────────────────────────────────────
   9. Focus Trap Utility (for Modals)
   ────────────────────────────────────────────── */
function trapFocus(modalEl) {
  const focusable = modalEl.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function onKeyDown(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  modalEl.addEventListener('keydown', onKeyDown);
  first?.focus();

  return () => modalEl.removeEventListener('keydown', onKeyDown);
}

/* ──────────────────────────────────────────────
   10. Modal Manager
   ────────────────────────────────────────────── */
function createModal(modalId, openBtnId, closeBtnId) {
  const modal = document.getElementById(modalId);
  const openBtn = document.getElementById(openBtnId);
  const closeBtn = document.getElementById(closeBtnId);
  if (!modal || !openBtn) return;

  let releaseFocusTrap;
  let triggerEl;

  const openModal = () => {
    triggerEl = document.activeElement;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    releaseFocusTrap = trapFocus(modal);
  };

  const closeModal = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    releaseFocusTrap?.();
    triggerEl?.focus();
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
  });

  openBtn.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  return { openModal, closeModal };
}

/* ----------------------------------------------
   11-13. Lead Forms (contact, quote, portal access)
   One shared pipeline: validate -> honeypot -> submit -> feedback.
   Sends JSON to CA_CONFIG.formEndpoint; falls back to mailto: if unset.
   ---------------------------------------------- */
const EMAIL_RE = /^\S+@\S+\.\S+$/;

async function submitLead(kind, fields) {
  const cfg = window.CA_CONFIG || {};
  if (cfg.formEndpoint) {
    const body = { ...fields, form: kind, subject: `Code Arcade - ${kind}`, from_name: 'Code Arcade website' };
    if (cfg.accessKey) body.access_key = cfg.accessKey;
    const res = await fetch(cfg.formEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    });
    let data = {};
    try { data = await res.json(); } catch (_) { /* non-JSON response */ }
    if (!res.ok || data.success === false) throw new Error(data.message || 'Request failed');
    return 'sent';
  }
  const lines = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n');
  window.location.href = `mailto:${cfg.contactEmail || ''}?subject=${encodeURIComponent('Code Arcade - ' + kind)}&body=${encodeURIComponent(lines)}`;
  return 'mailto';
}

function setupLeadForm(form, kind, { onDone, sentMsg, mailtoMsg } = {}) {
  if (!form) return;

  // Honeypot: invisible to people, tempting to bots
  const trap = document.createElement('input');
  trap.type = 'text'; trap.name = 'botcheck'; trap.tabIndex = -1;
  trap.autocomplete = 'off'; trap.setAttribute('aria-hidden', 'true');
  trap.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;';
  form.appendChild(trap);

  const fieldsToCheck = form.querySelectorAll('[required]');

  const clearError = (input) => {
    input.setAttribute('aria-invalid', 'false');
    input.removeAttribute('aria-describedby');
    input.parentElement.querySelector('.field-error')?.remove();
  };
  const showError = (input, message) => {
    clearError(input);
    input.setAttribute('aria-invalid', 'true');
    const err = document.createElement('span');
    err.className = 'field-error';
    err.id = `err-${input.id}`;
    err.textContent = message;
    err.setAttribute('role', 'alert');
    input.setAttribute('aria-describedby', err.id);
    input.insertAdjacentElement('afterend', err);
  };
  const check = (input) => {
    const label = input.dataset.label || 'This field';
    if (!input.value.trim()) { showError(input, `${label} is required.`); return false; }
    if (input.type === 'email' && !EMAIL_RE.test(input.value.trim())) {
      showError(input, 'Please enter a valid email address.'); return false;
    }
    clearError(input); return true;
  };

  fieldsToCheck.forEach(input => {
    input.addEventListener('blur', () => check(input));
    input.addEventListener('input', () => { if (input.value.trim()) clearError(input); });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;
    fieldsToCheck.forEach(input => { if (!check(input)) valid = false; });
    if (!valid) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }

    const btn = form.querySelector('[type="submit"]');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = '<svg class="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg><span>Sending\u2026</span>';

    try {
      const data = Object.fromEntries(new FormData(form).entries());
      const isBot = !!data.botcheck;
      delete data.botcheck;
      const mode = isBot ? 'sent' : await submitLead(kind, data);
      showToast(mode === 'mailto'
        ? (mailtoMsg || 'Opening your email app with the details filled in\u2026')
        : (sentMsg || 'Message sent! We\u2019ll get back to you shortly.'), 'success');
      form.reset();
      fieldsToCheck.forEach(clearError);
      onDone?.();
    } catch (err) {
      showToast('Could not send right now. Please retry or email us directly.', 'error');
    } finally {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.innerHTML = original;
    }
  });
}

function initLoginModal() {
  const m = createModal('login-modal', 'btn-client-login', 'close-login-modal');
  setupLeadForm(document.getElementById('client-login-form'), 'Client portal access request', {
    onDone: () => m?.closeModal(),
    sentMsg: 'Request received. We\u2019ll email your secure portal link shortly.',
    mailtoMsg: 'Opening your email app to request portal access\u2026'
  });
}

function initQuoteModal() {
  const m = createModal('quote-modal', 'btn-get-quote', 'close-quote-modal');
  setupLeadForm(document.getElementById('quote-form'), 'Project quote request', {
    onDone: () => m?.closeModal(),
    sentMsg: 'Quote request sent! We\u2019ll reply within 24 hours.'
  });
}

function initContactForm() {
  setupLeadForm(document.getElementById('contact-form'), 'Contact enquiry');
}

/* ──────────────────────────────────────────────
   14. Toast Notification System
   ────────────────────────────────────────────── */
function showToast(message, type = 'success') {
  let region = document.getElementById('toast-region');
  if (!region) {
    region = document.createElement('div');
    region.id = 'toast-region';
    region.className = 'toast-container';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'false');
    region.setAttribute('role', 'region');
    region.setAttribute('aria-label', 'Notifications');
    document.body.appendChild(region);
  }

  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    info: 'fa-circle-info',
    warning: 'fa-triangle-exclamation'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <div class="toast-icon" aria-hidden="true"><i class="fa-solid ${icons[type] || icons.success}"></i></div>
    <div class="toast-message">${sanitise(message)}</div>
    <button class="toast-close" aria-label="Dismiss notification">×</button>
  `;

  region.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));

  const dismiss = () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  };

  toast.querySelector('.toast-close')?.addEventListener('click', dismiss);
  setTimeout(dismiss, 4000);
}

/* ──────────────────────────────────────────────
   15. Scroll-To-Top Button
   ────────────────────────────────────────────── */
function initScrollToTop() {
  const btn = document.getElementById('scroll-to-top');
  if (!btn) return;

  const toggle = throttle(() => {
    const visible = window.scrollY > 600;
    btn.classList.toggle('visible', visible);
    btn.setAttribute('aria-hidden', !visible);
  }, 100);

  window.addEventListener('scroll', toggle, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    // Return focus to top of page for accessibility
    document.getElementById('home')?.focus({ preventScroll: true });
  });
}

/* ──────────────────────────────────────────────
   17. Smooth Anchor Links (override default jump)
   ────────────────────────────────────────────── */
function initSmoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (!id || id.length < 2) return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start'
        });
        history.pushState(null, '', id);
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  });
}

/* ──────────────────────────────────────────────
   Bootstrap
   ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  window.__caReady = true;
  const fy = document.getElementById('footer-year');
  if (fy) fy.textContent = new Date().getFullYear();
  initPreloader();
  initScrollProgress();
  initAmbientGlow();
  initNavbar();
  initMobileMenu();
  initCounters();
  initScrollReveal();
  initProjectFilter();
  initLoginModal();
  initQuoteModal();
  initContactForm();
  initScrollToTop();
  initSmoothAnchors();
});

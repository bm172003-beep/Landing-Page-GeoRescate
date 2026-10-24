/* ═══════════════════════════════════════════════════════════════
   CONFIGURACIÓN — edita solo este bloque
   ═══════════════════════════════════════════════════════════════ */
const CONFIG = {
  // URL de tu Apps Script (Implementar > Aplicación web). Debe ser la que termina en /exec
  scriptURL: 'https://script.google.com/macros/s/AKfycbyW4DUzhaOvr_ilESbr8heSaNchOAYMvvNdUpmtS0QRRRhqg763vMe3xTee-Rq0Tn_w/exec',

  // Enlaces de descarga de la app móvil (pega aquí los links reales)
  appLinks: {
    android: '',  // ej: 'https://play.google.com/store/apps/details?id=cl.georescate.app'
    ios: ''       // ej: 'https://apps.apple.com/cl/app/georescate/id1234567890'
  },

  // Número que se muestra si no se puede leer el Excel (se reemplaza apenas carga)
  fallbackCount: 46
};

/* ═══════════════════════════════════════════════════════════════
   GeoRescate Landing — JavaScript
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Navbar Scroll Blur ───────────────────────────────────────
  const navbar = document.getElementById('navbar');
  const handleNavScroll = () => {
    if (window.scrollY > 40) {
      navbar.classList.add('navbar--scrolled');
    } else {
      navbar.classList.remove('navbar--scrolled');
    }
  };
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  // ── Scroll Reveal (Intersection Observer) ────────────────────
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  const registerReveals = () => {
    const selectors = [
      '.trust',
      '.how__title',
      '.reveal-step',
      '.features__title',
      '.features__grid',
      '.cta-bottom__inner'
    ];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
      });
    });
  };
  registerReveals();

  // ── Card Hover Mouse Glow ────────────────────────────────────
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const glow = card.querySelector('.feature-card__glow');
      if (glow) {
        glow.style.left = `${x - rect.width}px`;
        glow.style.top  = `${y - rect.height}px`;
      }
    });
  });


  // ── Contador de inscritos (lee la cantidad real desde Google Sheets) ──
  const countEl = document.getElementById('waitlist-count');
  const badgeEl = document.getElementById('waitlist-badge');
  const renderCount = (n) => {
    const txt = new Intl.NumberFormat('es-CL').format(n);
    if (countEl) countEl.textContent = txt;
    if (badgeEl) badgeEl.textContent = '+' + (n >= 1000 ? Math.floor(n / 1000) + 'k' : n);
  };
  let currentCount = CONFIG.fallbackCount;
  renderCount(currentCount);

  fetch(CONFIG.scriptURL + '?action=count&t=' + Date.now(), { cache: 'no-store' })
    .then(r => r.json())
    .then(d => {
      if (d && Number.isFinite(d.count)) { currentCount = d.count; renderCount(currentCount); }
    })
    .catch(() => { /* si falla, se queda el número de respaldo */ });

  // ── Formularios → Google Sheets ──────────────────────────────
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  const handleForm = (formId, msgId) => {
    const f = document.getElementById(formId);
    if (!f) return;
    const msg = document.getElementById(msgId);
    const btn = f.querySelector('button[type="submit"]');

    f.addEventListener('submit', async (e) => {
      e.preventDefault();

      const honeypot = f.querySelector('.honeypot-field');
      if (honeypot && honeypot.value !== '') return; // bot

      const nombre = f.nombre.value.trim();
      const email = f.email.value.trim();
      if (nombre.length < 2 || !emailOk(email)) {
        msg.textContent = 'Revisa tu nombre y correo electrónico.';
        msg.classList.remove('hidden', 'beta-msg--ok');
        msg.classList.add('beta-msg--err');
        return;
      }

      const original = btn.textContent;
      btn.textContent = 'Enviando...';
      btn.disabled = true;

      try {
        const fd = new FormData();
        fd.set('nombre', nombre);
        fd.set('email', email);
        const res = await fetch(CONFIG.scriptURL, { method: 'POST', body: fd });
        let data = null;
        try { data = await res.json(); } catch (_) {}

        if (data && Number.isFinite(data.count)) {
          currentCount = data.count;
        } else if (!(data && data.duplicate)) {
          currentCount += 1; // respuesta ilegible: sumamos 1 de forma optimista
        }
        renderCount(currentCount);

        f.reset();
        msg.textContent = (data && data.duplicate)
          ? 'Este correo ya estaba inscrito. ¡Gracias!'
          : '¡Gracias! Te hemos añadido a la lista de espera del Panel Web.';
        msg.classList.remove('hidden', 'beta-msg--err');
        msg.classList.add('beta-msg--ok');
        setTimeout(() => msg.classList.add('hidden'), 5000);
      } catch (err) {
        msg.textContent = 'No pudimos enviar tus datos. Inténtalo de nuevo.';
        msg.classList.remove('hidden', 'beta-msg--ok');
        msg.classList.add('beta-msg--err');
      } finally {
        btn.textContent = original;
        btn.disabled = false;
      }
    });
  };
  handleForm('beta-form', 'mensaje-exito');
  handleForm('beta-form-bottom', 'mensaje-exito-bottom');

  // ── Botón "Obtener app móvil" ────────────────────────────────
  const modal = document.getElementById('app-modal');
  const storeAndroid = document.getElementById('store-android');
  const storeIos = document.getElementById('store-ios');
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);

  const setStore = (el, url) => {
    if (url) { el.href = url; el.classList.remove('store-btn--off'); }
    else { el.removeAttribute('href'); el.classList.add('store-btn--off'); el.querySelector('small').textContent = 'Próximamente'; }
  };
  setStore(storeAndroid, CONFIG.appLinks.android);
  setStore(storeIos, CONFIG.appLinks.ios);

  const openModal = () => { modal.classList.remove('hidden'); document.body.classList.add('no-scroll'); };
  const closeModal = () => { modal.classList.add('hidden'); document.body.classList.remove('no-scroll'); };
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  document.querySelectorAll('.js-open-app').forEach(b => {
    b.addEventListener('click', () => {
      // En el celular: va directo a la tienda que corresponde. En PC: muestra las dos opciones.
      if (isIOS && CONFIG.appLinks.ios) { window.location.href = CONFIG.appLinks.ios; return; }
      if (isAndroid && CONFIG.appLinks.android) { window.location.href = CONFIG.appLinks.android; return; }
      openModal();
    });
  });

  // ── Smooth Scroll for Anchors with Highlight Animation ────────
  const customSmoothScroll = (targetEl, duration = 1400) => {
    const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - 70; // 70px offset for navbar
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    let startTime = null;

    // Cubic-bezier easeInOutCubic formula
    const easeInOutCubic = (t) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      window.scrollTo(0, startPosition + distance * ease);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        // Scroll finished, add visual feedback pulse to the target section
        targetEl.classList.add('section-highlight-pulse');
        setTimeout(() => {
          targetEl.classList.remove('section-highlight-pulse');
        }, 1200);
      }
    };

    requestAnimationFrame(animation);
  };

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        customSmoothScroll(target, 1400);
      }
    });
  });

  // ── Particles Canvas Animation ───────────────────────────────
  const canvas = document.getElementById('particles-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    const particles = [];
    const particleCount = 45;

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 1.5 + 0.5;
        this.alpha = Math.random() * 0.5 + 0.2;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${this.alpha})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw lines between close particles
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();
        p1.draw();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    };

    animate();

    // Handle Resize
    window.addEventListener('resize', () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    });
  }

});

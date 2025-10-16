// animasi gambar home
  (function(){
    const el = document.querySelector('.home-img-cont');
    if(!el) return;

    const wrap = el.querySelector('.home-img-cont-2');

    function handleMove(e){
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const mouseX = (e.clientX || (e.touches && e.touches[0].clientX)) - cx;
      const mouseY = (e.clientY || (e.touches && e.touches[0].clientY)) - cy;
      const px = (mouseX / (r.width/2));
      const py = (mouseY / (r.height/2));
      const tiltX = (py * -6).toFixed(2);
      const tiltY = (px * 8).toFixed(2);

      el.style.transform = `translateY(-6px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.03)`;
      wrap.style.transform = `translateZ(28px)`;
      wrap.querySelector('img').style.transform = `scale(1.08) translateZ(40px)`;
    }

    function reset(){
      el.style.transform = '';
      wrap.style.transform = '';
      wrap.querySelector('img').style.transform = '';
    }

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('touchmove', handleMove, {passive:true});
    el.addEventListener('mouseleave', reset);
    el.addEventListener('touchend', reset);
  })();

(function(){
  const canvas = document.querySelector('.home-bg');
  if(!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  let w = 0, h = 0, dpr = Math.max(1, window.devicePixelRatio || 1);
  let particles = [];
  let animationId = null;
  let mouse = { x: null, y: null, active: false };

  // konfigurasi mudah diubah
  const CONFIG = {
    baseColorA: getComputedStyle(document.documentElement).getPropertyValue('--ring-1').trim() || '#7c3aed',
    baseColorB: getComputedStyle(document.documentElement).getPropertyValue('--ring-2').trim() || '#ffe600',
    bgColor: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0f1724',
    minParticles: 30,
    maxParticles: 120,
    linkDistance: 140,
    maxRadius: 6,
    minRadius: 1.6,
    speedFactor: 0.25,
    // --- tambahan untuk memastikan gerak terus ---
    jitterStrength: 0.03,  // kekuatan getaran acak tiap frame
    minSpeed: 0.18,        // minimal kecepatan total (px/frame)
  };

  function resize(){
    const rect = canvas.getBoundingClientRect();
    w = Math.max(100, Math.floor(rect.width));
    h = Math.max(100, Math.floor(rect.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);

    const area = w * h;
    const approx = Math.floor(area / 80000);
    const count = Math.max(CONFIG.minParticles, Math.min(CONFIG.maxParticles, approx));
    initParticles(count);
  }

  function rand(min, max){ return Math.random() * (max - min) + min; }

  function initParticles(count){
    particles = [];
    for(let i=0;i<count;i++){
      const r = rand(CONFIG.minRadius, CONFIG.maxRadius);
      const p = {
        x: rand(r, w - r),
        y: rand(r, h - r),
        vx: rand(-1, 1) * (1 + Math.random()) * CONFIG.speedFactor,
        vy: rand(-1, 1) * (1 + Math.random()) * CONFIG.speedFactor,
        r,
        hue: Math.random(),
        alpha: rand(0.35, 0.95)
      };
      // beri sedikit kecepatan awal jika terlalu kecil
      ensureMinSpeed(p);
      particles.push(p);
    }
  }

  function ensureMinSpeed(p){
    const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
    if(speed < CONFIG.minSpeed){
      const ang = Math.random() * Math.PI * 2;
      p.vx += Math.cos(ang) * (CONFIG.minSpeed + Math.random() * 0.2);
      p.vy += Math.sin(ang) * (CONFIG.minSpeed + Math.random() * 0.2);
    }
  }

  function draw(){
    ctx.clearRect(0,0,w,h);
    const linkDist2 = CONFIG.linkDistance * CONFIG.linkDistance;

    for(let i=0;i<particles.length;i++){
      const a = particles[i];
      for(let j=i+1;j<particles.length;j++){
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx*dx + dy*dy;
        if(d2 <= linkDist2){
          const t = 1 - (d2 / linkDist2);
          const lineAlpha = t * 0.18 * Math.min(a.alpha, b.alpha);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          g.addColorStop(0, hexWithAlpha(CONFIG.baseColorA, lineAlpha));
          g.addColorStop(1, hexWithAlpha(CONFIG.baseColorB, lineAlpha));
          ctx.strokeStyle = g;
          ctx.lineWidth = Math.max(0.35, 1.2 * t);
          ctx.stroke();
        }
      }
    }

    for(const p of particles){
      const gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
      const color = interpolateColor(CONFIG.baseColorA, CONFIG.baseColorB, p.hue);
      gg.addColorStop(0, hexWithAlpha(color, p.alpha));
      gg.addColorStop(0.45, hexWithAlpha(color, p.alpha * 0.35));
      gg.addColorStop(1, hexWithAlpha(CONFIG.bgColor, 0));
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function step(){
    // update physics
    for(const p of particles){
      // small random jitter so they never fully stop
      p.vx += rand(-CONFIG.jitterStrength, CONFIG.jitterStrength);
      p.vy += rand(-CONFIG.jitterStrength, CONFIG.jitterStrength);

      p.x += p.vx;
      p.y += p.vy;

      // bounce on edges
      if(p.x < p.r){ p.x = p.r; p.vx = Math.abs(p.vx); }
      if(p.x > w - p.r){ p.x = w - p.r; p.vx = -Math.abs(p.vx); }
      if(p.y < p.r){ p.y = p.r; p.vy = Math.abs(p.vy); }
      if(p.y > h - p.r){ p.y = h - p.r; p.vy = -Math.abs(p.vy); }

      // gentle repel from mouse
      if(mouse.active){
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx*dx + dy*dy;
        const minDist = 80;
        if(d2 < (minDist * minDist)){
          const d = Math.sqrt(d2) || 0.0001;
          const push = (1 - (d / minDist)) * 0.9;
          p.vx += (dx / d) * push * 0.6;
          p.vy += (dy / d) * push * 0.6;
        }
      }

      // damping but very slight (prevents runaway while still allowing continuous motion)
      p.vx *= 0.997;
      p.vy *= 0.997;

      // clamp and ensure minimum speed
      const maxV = 2.4;
      if(p.vx > maxV) p.vx = maxV;
      if(p.vx < -maxV) p.vx = -maxV;
      if(p.vy > maxV) p.vy = maxV;
      if(p.vy < -maxV) p.vy = -maxV;

      // ensure minimum movement so they don't stall
      const sp = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
      if(sp < CONFIG.minSpeed){
        // give small random push to restore movement
        const ang = Math.random() * Math.PI * 2;
        p.vx += Math.cos(ang) * (CONFIG.minSpeed * 0.6);
        p.vy += Math.sin(ang) * (CONFIG.minSpeed * 0.6);
      }
    }

    draw();
    animationId = window.requestAnimationFrame(step);
  }

  // helpers
  function hexWithAlpha(hex, alpha){
    const h = hex.replace('#','').trim();
    if(h.length === 3){
      const r = parseInt(h[0]+h[0],16);
      const g = parseInt(h[1]+h[1],16);
      const b = parseInt(h[2]+h[2],16);
      return `rgba(${r},${g},${b},${alpha})`;
    } else if(h.length === 6){
      const r = parseInt(h.substring(0,2),16);
      const g = parseInt(h.substring(2,4),16);
      const b = parseInt(h.substring(4,6),16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    return `rgba(124,58,237,${alpha})`;
  }
  function interpolateColor(hexA, hexB, t){
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    const r = Math.round(a.r + (b.r - a.r) * t);
    const g = Math.round(a.g + (b.g - a.g) * t);
    const bl = Math.round(a.b + (b.b - a.b) * t);
    return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
  }
  function hexToRgb(hex){
    const h = hex.replace('#','').trim();
    if(h.length === 3){
      return {
        r: parseInt(h[0]+h[0],16),
        g: parseInt(h[1]+h[1],16),
        b: parseInt(h[2]+h[2],16)
      };
    } else {
      return {
        r: parseInt(h.substring(0,2),16),
        g: parseInt(h.substring(2,4),16),
        b: parseInt(h.substring(4,6),16)
      };
    }
  }
  function toHex(n){ return ('0' + n.toString(16)).slice(-2); }

  // events
  function onMouseMove(e){
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    mouse.y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    mouse.active = true;
  }
  function onMouseLeave(){
    mouse.active = false;
    mouse.x = null; mouse.y = null;
  }

  function start(){
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduced) {
      canvas.style.display = 'none';
      return;
    }
    dpr = Math.max(1, window.devicePixelRatio || 1);
    resize();
    if(animationId) cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(step);
  }

  window.addEventListener('resize', () => {
    clearTimeout(window.__homeBgResize);
    window.__homeBgResize = setTimeout(resize, 120);
  });

  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('touchmove', onMouseMove, {passive:true});
  canvas.addEventListener('mouseleave', onMouseLeave);
  canvas.addEventListener('touchend', onMouseLeave);

  requestAnimationFrame(start);

  window.__homeBg = { start, stop: () => { if(animationId) cancelAnimationFrame(animationId); animationId=null; } };
})();

// ===== Scroll spy + auto AOS attributes (header -> about) =====
(function() {
  // safety
  if(typeof document === 'undefined') return;

  /* ---------- Helper: set AOS attributes with optional delay ---------- */
  function assignAos(selector, aosName, startDelay = 0, stepDelay = 80) {
    const nodes = Array.from(document.querySelectorAll(selector));
    nodes.forEach((el, i) => {
      if(!el) return;
      // don't overwrite if user already set an AOS attribute
      if(!el.hasAttribute('data-aos')) {
        el.setAttribute('data-aos', aosName);
      }
      // set delay only if not present
      if(!el.hasAttribute('data-aos-delay')) {
        const d = startDelay + (i * stepDelay);
        el.setAttribute('data-aos-delay', String(d));
      }
      // set duration default only if missing
      if(!el.hasAttribute('data-aos-duration')) {
        el.setAttribute('data-aos-duration', '700');
      }
      // preserve once behavior if not present
      if(!el.hasAttribute('data-aos-once')) {
        el.setAttribute('data-aos-once', 'true');
      }
    });
  }

  /* ---------- Apply AOS attributes from header -> about ---------- */
  function applyAosForHeaderToAbout() {
    // header elements
    assignAos('header', 'fade-down', 0, 30);
    assignAos('header .logo, header nav, header .hdr-btn', 'fade-down', 50, 40);

    // home section pieces
    assignAos('#home .home-cont-child .asj-kecil', 'fade-right', 40, 40);
    assignAos('#home .home-title', 'fade-right', 80);
    assignAos('#home .home-lead', 'fade-up', 140);
    assignAos('#home .home-list-cont .home-list', 'fade-up', 180, 70);
    assignAos('#home .home-cta, #home .home-button', 'zoom-in', 220);
    assignAos('#home .home-img-cont', 'fade-left', 120);

    // about section
    assignAos('#about .about-title', 'fade-up', 60);
    assignAos('#about .about-cont-child', 'fade-up', 120, 80);
  }

  function setupNavSpy() {
    const navLinks = Array.from(document.querySelectorAll('nav .nav-links, nav a.nav-links'));
    if(!navLinks.length) return;

    const linkToSection = new Map();
    navLinks.forEach(link => {
      let href = link.getAttribute('href') || '';
      let targetId = null;

      if(href.startsWith('#')) {
        targetId = href.slice(1);
      } else {
        const txt = (link.textContent || '').trim().toLowerCase();
        if(txt.includes('home')) targetId = 'home';
        else if(txt.includes('about')) targetId = 'about';
        else {
          // try data-target attribute if provided
          const dt = link.getAttribute('data-target');
          if(dt) targetId = dt.replace('#','');
        }
      }

      if(targetId) {
        const sec = document.getElementById(targetId);
        if(sec) linkToSection.set(link, sec);
      }
    });

    if(!linkToSection.size) {
      const sections = Array.from(document.querySelectorAll('section[id]'));
      for(let i=0;i<Math.min(navLinks.length, sections.length); i++){
        linkToSection.set(navLinks[i], sections[i]);
      }
    }

    function clearActive() {
      navLinks.forEach(l => l.classList.remove('nav-active'));
    }
    function setActiveLink(link) {
      clearActive();
      if(link) link.classList.add('nav-active');
    }

    const obsOptions = {
      root: null,
      rootMargin: '-40% 0px -40% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1.0]
    };

    const seen = new Map();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const el = entry.target;
        seen.set(el.id, entry.intersectionRatio);
      });

      let bestId = null, bestRatio = 0;
      for(const [id, ratio] of seen.entries()){
        if(ratio > bestRatio) { bestRatio = ratio; bestId = id; }
      }
      if(bestId) {
        // find corresponding link
        for(const [link, sec] of linkToSection.entries()){
          if(sec.id === bestId) { setActiveLink(link); break; }
        }
      }
    }, obsOptions);

    for(const sec of new Set(linkToSection.values())) {
      observer.observe(sec);
      seen.set(sec.id, 0);
    }

    linkToSection.forEach((sec, link) => {
      link.addEventListener('click', (ev) => {
        if(link.getAttribute('href') && link.getAttribute('href').startsWith('#')) {
          ev.preventDefault();
          sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setActiveLink(link);
          if(window.AOS && typeof window.AOS.refresh === 'function') window.AOS.refresh();
        }
      });
    });

    setTimeout(() => {
      let bestNow = null, bestR = 0;
      for(const sec of new Set(linkToSection.values())) {
        const rect = sec.getBoundingClientRect();
        const visibleH = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
        if(visibleH > bestR) { bestR = visibleH; bestNow = sec; }
      }
      if(bestNow){
        for(const [link, sec] of linkToSection.entries()){
          if(sec === bestNow){ setActiveLink(link); break; }
        }
      }
    }, 60);
  }

  /* ---------- run all ---------- */
  function init() {
    applyAosForHeaderToAbout();
    setupNavSpy();

    if(window.AOS && typeof window.AOS.refresh === 'function') {
      window.AOS.refresh();
    }
  }

  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


const phone = '6285773153585';
  document.getElementById('contact').addEventListener('click', function (e) {
    if (e) e.preventDefault();

    const waUrl = `https://wa.me/${phone}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
  });
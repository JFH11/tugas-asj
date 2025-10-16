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


const nomer = '6285773153585';
  document.getElementById('contact').addEventListener('click', function (e) {
    if (e) e.preventDefault();

    const linkWa = `https://wa.me/${nomer}`;

    window.open(linkWa, '_blank', 'noopener,noreferrer');
  });
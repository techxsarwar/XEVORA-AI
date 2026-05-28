/**
 * Xevora AI — Cosmic Forge Homepage JS
 */
'use strict';

/* ══════════════════════════════════════════
   1. FORGE CANVAS (Starfield / Void Dust)
══════════════════════════════════════════ */
(function initForgeCanvas() {
  const canvas = document.getElementById('forge-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let width, height;
  const particles = [];
  const PARTICLE_COUNT = 80;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }

  window.addEventListener('resize', resize);
  resize();

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.5,
      speedY: Math.random() * -0.2 - 0.1,
      opacity: Math.random() * 0.5 + 0.1
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f0a500'; // Gold dust
    
    particles.forEach(p => {
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      
      p.y += p.speedY;
      if (p.y < 0) {
        p.y = height;
        p.x = Math.random() * width;
      }
    });
    
    requestAnimationFrame(render);
  }
  render();
})();

/* ══════════════════════════════════════════
   2. NAVBAR
══════════════════════════════════════════ */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 40) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ══════════════════════════════════════════
   3. HAMBURGER MENU
══════════════════════════════════════════ */
(function initHamburger() {
  const btn = document.getElementById('nav-hamburger');
  const links = document.getElementById('nav-links');
  if (!btn || !links) return;

  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
    // Simplified for this iteration
  });
})();

/* ══════════════════════════════════════════
   4. TERMINAL TYPEWRITER
══════════════════════════════════════════ */
(function initTerminal() {
  const output = document.getElementById('terminal-output');
  if (!output) return;

  const LINES = [
    { text: 'xevora generate "dashboard ui"', class: 't-prompt', delay: 0, speed: 40, prefix: '❯' },
    { text: 'Initializing matrix routing...', class: 't-dim', delay: 300, speed: 20 },
    { text: 'Routing to: Qwen 2.5 Coder 32B', class: 't-accent', delay: 400, speed: 30, prefix: '✓' },
    { text: 'Generating: App.tsx', class: 't-dim', delay: 200, speed: 25, prefix: '→' },
    { text: 'Generating: styles.css', class: 't-dim', delay: 100, speed: 25, prefix: '→' },
    { text: 'Files assembled. 0 errors.', class: 't-accent', delay: 300, speed: 25, prefix: '✓' },
    { text: 'Live preview active. Port 4200.', class: 't-ok', delay: 200, speed: 30, prefix: '⚡' }
  ];

  const LOOP_PAUSE_MS = 3500;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function createCursor() {
    const c = document.createElement('span');
    c.className = 't-cursor';
    return c;
  }

  function typeText(container, cursor, text, speed) {
    return new Promise(resolve => {
      let i = 0;
      function tick() {
        if (i < text.length) {
          container.insertBefore(document.createTextNode(text[i]), cursor);
          i++;
          setTimeout(tick, speed * (0.8 + Math.random() * 0.4));
        } else {
          resolve();
        }
      }
      tick();
    });
  }

  let running = false;

  async function runSequence() {
    output.innerHTML = '';
    
    for (const line of LINES) {
      if (line.delay) await sleep(line.delay);
      
      const div = document.createElement('div');
      
      if (line.prefix) {
        const p = document.createElement('span');
        p.className = line.class; // Usually the prefix holds the color for the line in modern terminals
        p.style.marginRight = '8px';
        p.textContent = line.prefix;
        div.appendChild(p);
      }
      
      const textSpan = document.createElement('span');
      if (!line.prefix) textSpan.className = line.class;
      else textSpan.style.color = 'var(--text-1)'; // Main text is white if prefix colored
      
      div.appendChild(textSpan);
      
      const cursor = createCursor();
      textSpan.appendChild(cursor);
      output.appendChild(div);
      
      await typeText(textSpan, cursor, line.text, line.speed);
      cursor.remove();
      await sleep(150);
    }
    
    const finalDiv = document.createElement('div');
    finalDiv.appendChild(createCursor());
    output.appendChild(finalDiv);
    
    await sleep(LOOP_PAUSE_MS);
    if (running) runSequence();
  }

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !running) {
      running = true;
      runSequence();
      observer.disconnect();
    }
  }, { threshold: 0.2 });

  observer.observe(output);
})();

/* ══════════════════════════════════════════
   5. SCROLL REVEAL
══════════════════════════════════════════ */
(function initScrollReveal() {
  const reveals = document.querySelectorAll('.scroll-reveal');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  
  reveals.forEach(el => io.observe(el));
})();

/* ══════════════════════════════════════════
   6. COPY TO CLIPBOARD
══════════════════════════════════════════ */
(function initCopyCmd() {
  const cmd = document.getElementById('clone-cmd');
  const toast = document.getElementById('copy-toast');
  if (!cmd || !toast) return;

  cmd.addEventListener('click', async () => {
    const code = cmd.querySelector('code');
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code.textContent);
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    } catch (e) {
      console.error(e);
    }
  });
})();

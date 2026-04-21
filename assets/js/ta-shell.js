// Terminal Aurora — global shell runtime (no React).
// Theme + lang toggles, clock, scroll reveal, custom cursor, easter-egg terminal.
// Loaded on every page via _layouts/default.html.
(function () {
  'use strict';

  var doc = document;
  var body = doc.body;
  var LS = { theme: 'portfolio:theme', lang: 'portfolio:lang' };

  // ───── Theme ─────
  function applyTheme(theme) {
    body.classList.toggle('light', theme === 'light');
    body.classList.toggle('dark', theme !== 'light');
  }
  function getTheme() {
    try { return localStorage.getItem(LS.theme) || 'dark'; } catch (_) { return 'dark'; }
  }
  function setTheme(theme) {
    try { localStorage.setItem(LS.theme, theme); } catch (_) {}
    applyTheme(theme);
    updateThemeButtons(theme);
  }
  function updateThemeButtons(theme) {
    doc.querySelectorAll('[data-ta-theme]').forEach(function (el) {
      el.textContent = theme === 'dark' ? '◐' : '◑';
    });
  }

  // ───── Language ─────
  function getLang() {
    try { return localStorage.getItem(LS.lang) || 'en'; } catch (_) { return 'en'; }
  }
  function applyLang(lang) {
    doc.documentElement.lang = lang;
    doc.querySelectorAll('[data-en]').forEach(function (el) {
      var val = el.getAttribute('data-' + lang);
      if (val != null) el.textContent = val;
    });
    doc.querySelectorAll('[data-ta-lang]').forEach(function (el) {
      var en = el.querySelector('[data-on-en]');
      var de = el.querySelector('[data-on-de]');
      if (en) en.classList.toggle('on', lang === 'en');
      if (de) de.classList.toggle('on', lang === 'de');
    });
    window.dispatchEvent(new CustomEvent('ta:lang', { detail: { lang: lang } }));
  }
  function setLang(lang) {
    try { localStorage.setItem(LS.lang, lang); } catch (_) {}
    applyLang(lang);
  }

  // ───── Clock ─────
  function startClock() {
    var el = doc.querySelector('[data-ta-clock]');
    if (!el) return;
    function tick() {
      var d = new Date();
      var hh = String(d.getHours()).padStart(2, '0');
      var mm = String(d.getMinutes()).padStart(2, '0');
      el.textContent = hh + ':' + mm + ' CET';
    }
    tick();
    setInterval(tick, 1000);
  }

  // ───── Scroll reveal ─────
  function setupReveal() {
    if (!('IntersectionObserver' in window)) {
      doc.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    doc.querySelectorAll('[data-reveal]').forEach(function (el) { obs.observe(el); });
  }

  // ───── Custom cursor ─────
  function setupCursor() {
    var mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!mq.matches) return;

    var color = 'rgba(34, 211, 238, 0.85)';
    var ringColor = 'rgba(167, 139, 250, 0.6)';

    var ring = doc.createElement('div');
    ring.style.cssText = 'position:fixed;top:0;left:0;width:28px;height:28px;border-radius:50%;border:1.5px solid ' + ringColor + ';pointer-events:none;z-index:9999;transition:width .18s,height .18s,border-color .18s,background .18s;mix-blend-mode:difference;';
    var dot = doc.createElement('div');
    dot.style.cssText = 'position:fixed;top:0;left:0;width:8px;height:8px;border-radius:50%;background:' + color + ';pointer-events:none;z-index:10000;';
    body.appendChild(ring);
    body.appendChild(dot);

    var state = { x: 0, y: 0, rx: 0, ry: 0, hover: false };

    window.addEventListener('mousemove', function (e) {
      state.x = e.clientX; state.y = e.clientY;
      dot.style.transform = 'translate3d(' + (e.clientX - 4) + 'px,' + (e.clientY - 4) + 'px,0)';
    });
    window.addEventListener('mouseover', function (e) {
      var hov = e.target.closest('a, button, [role="button"], input, textarea, .cursor-hover');
      state.hover = !!hov;
      var s = hov ? '48px' : '28px';
      ring.style.width = s; ring.style.height = s;
      ring.style.borderColor = hov ? color : ringColor;
      ring.style.background = hov ? 'rgba(34,211,238,.1)' : 'transparent';
    });
    (function loop() {
      state.rx += (state.x - state.rx) * 0.18;
      state.ry += (state.y - state.ry) * 0.18;
      var size = state.hover ? 48 : 28;
      ring.style.transform = 'translate3d(' + (state.rx - size / 2) + 'px,' + (state.ry - size / 2) + 'px,0)';
      requestAnimationFrame(loop);
    })();
  }

  // ───── Easter-egg terminal ─────
  var term = {
    open: false,
    root: null,
    body: null,
    input: null,
    history: [
      { kind: 'system', text: 'manuele@portfolio ~ % welcome' },
      { kind: 'out', text: 'Type "help" for commands. Press ESC or ~ to close.' }
    ],
    buffer: ''
  };

  var ACCENT = '#22d3ee';
  var ACCENT2 = '#a78bfa';

  var commands = {
    help: function () {
      return [
        'available commands:',
        '  whoami     — who is manuele?',
        '  skills     — tech stack',
        '  experience — work history',
        '  contact    — how to reach me',
        '  github     — open github profile',
        '  linkedin   — open linkedin',
        '  anime      — currently watching?',
        '  matrix     — hmm…',
        '  sudo       — try it',
        '  clear      — clear screen',
        '  exit       — close terminal'
      ];
    },
    whoami: function () {
      return [
        'Manuele · Full-Stack Web Developer · Switzerland',
        '5+ yrs @ IWF Web Solutions. BSc Business IT (FHNW).',
        'PHP / Symfony / React. Speaks DE, EN, FR, ES, IT.'
      ];
    },
    skills: function () {
      return [
        'backend:  PHP 8.2 · Symfony 5.4 · PhpUnit · CraftCMS · MySQL',
        'frontend: React 18 · JS ES6 · Less · SCSS · Twig',
        'tools:    Git · Docker · Vite · Vagrant · PhpStorm',
        'business: SAP S/4HANA · Scrum PSD I · IREB'
      ];
    },
    experience: function () {
      return [
        '2022 — now   IWF Web Solutions · Junior Web Dev (4y 4m)',
        '2021         IWF Web Solutions · Intern (1y)',
        '2018 — 2022  FHNW · BSc Business IT',
        '2013 — 2016  WMS Basel · Kaufmann EFZ + BM'
      ];
    },
    contact: function () {
      return [
        'email:    gh-contact@d3st.dev',
        'github:   github.com/D3strukt0r',
        'linkedin: linkedin.com/in/d3strukt0r'
      ];
    },
    github: function () {
      window.open('https://github.com/D3strukt0r', '_blank');
      return ['→ opening github.com/D3strukt0r'];
    },
    linkedin: function () {
      window.open('https://www.linkedin.com/in/d3strukt0r/', '_blank');
      return ['→ opening linkedin.com/in/d3strukt0r'];
    },
    anime: function () {
      return [
        'currently watching: ████████░░ (classified)',
        'recommendations welcome — ping me.'
      ];
    },
    matrix: function () {
      var out = ['wake up, Neo…', '> rendering reality as text…'];
      var chars = 'アイウエオカキクケコサシスセソタチツテト01';
      for (var r = 0; r < 5; r++) {
        var line = '';
        for (var c = 0; c < 48; c++) line += chars[Math.floor(Math.random() * chars.length)];
        out.push(line);
      }
      return out;
    },
    sudo: function () {
      return [
        '[sudo] password for manuele: ••••••••',
        'access granted. you now have root.',
        'just kidding. but thanks for playing 🍡'
      ];
    },
    clear: function () { setTimeout(function () { term.history = []; renderTerm(); }, 0); return null; },
    exit: function () { setTimeout(closeTerm, 0); return ['goodbye.']; }
  };

  function ensureTermRoot() {
    if (term.root) return;
    var root = doc.createElement('div');
    root.id = 'ta-terminal-root';
    root.innerHTML = '\
<div class="ta-term-hint" data-hint><span style="color:' + ACCENT + '">▸</span> press <kbd>~</kbd> for terminal</div>\
<div class="ta-term-backdrop" data-backdrop style="display:none">\
  <div class="ta-term-modal" data-modal>\
    <div class="ta-term-bar">\
      <span class="ta-dot r" data-close></span><span class="ta-dot y"></span><span class="ta-dot g"></span>\
      <span class="ta-term-title">manuele@portfolio — -zsh — 80×24</span>\
    </div>\
    <div class="ta-term-body" data-body>\
      <form class="ta-term-form" data-form>\
        <span class="ta-term-user">manuele@portfolio</span>\
        <span class="ta-term-tilde">~</span>\
        <span class="ta-term-pct">%</span>\
        <input class="ta-term-input" data-input autocomplete="off" spellcheck="false" />\
      </form>\
    </div>\
  </div>\
</div>';
    body.appendChild(root);
    term.root = root;
    term.body = root.querySelector('[data-body]');
    term.input = root.querySelector('[data-input]');

    root.querySelector('[data-hint]').addEventListener('click', openTerm);
    root.querySelector('[data-backdrop]').addEventListener('click', closeTerm);
    root.querySelector('[data-modal]').addEventListener('click', function (e) { e.stopPropagation(); });
    root.querySelector('[data-close]').addEventListener('click', closeTerm);
    root.querySelector('[data-form]').addEventListener('submit', function (e) {
      e.preventDefault();
      run(term.input.value);
      term.input.value = '';
    });
    term.body.addEventListener('click', function () { term.input.focus(); });
    renderTerm();
  }

  function renderTerm() {
    if (!term.body) return;
    var form = term.body.querySelector('[data-form]');
    // Remove existing output lines
    Array.prototype.slice.call(term.body.querySelectorAll('.ta-term-line')).forEach(function (n) { n.remove(); });
    // Rebuild
    term.history.forEach(function (h) {
      var line = doc.createElement('div');
      line.className = 'ta-term-line ta-term-' + h.kind;
      if (h.kind === 'in') {
        line.innerHTML = '<span style="color:' + ACCENT + '">manuele@portfolio</span> <span style="color:' + ACCENT2 + '">~</span> <span style="color:rgba(255,255,255,.55)">%</span> ';
        line.appendChild(doc.createTextNode(h.text));
      } else if (h.kind === 'system') {
        line.innerHTML = '<span style="color:rgba(255,255,255,.4)"># </span>';
        line.appendChild(doc.createTextNode(h.text));
      } else {
        line.textContent = h.text;
      }
      term.body.insertBefore(line, form);
    });
    term.body.scrollTop = term.body.scrollHeight;
  }

  function run(raw) {
    var cmd = (raw || '').trim().toLowerCase();
    term.history.push({ kind: 'in', text: raw });
    if (cmd) {
      var fn = commands[cmd];
      if (fn) {
        var out = fn();
        if (out) out.forEach(function (t) { term.history.push({ kind: 'out', text: t }); });
      } else {
        term.history.push({ kind: 'err', text: 'command not found: ' + cmd });
        term.history.push({ kind: 'out', text: 'try "help"' });
      }
    }
    renderTerm();
  }

  function openTerm() {
    ensureTermRoot();
    term.open = true;
    term.root.querySelector('[data-backdrop]').style.display = 'flex';
    term.root.querySelector('[data-hint]').style.display = 'none';
    setTimeout(function () { term.input && term.input.focus(); }, 60);
  }
  function closeTerm() {
    if (!term.root) return;
    term.open = false;
    term.root.querySelector('[data-backdrop]').style.display = 'none';
    term.root.querySelector('[data-hint]').style.display = '';
  }

  function setupEasterEgg() {
    ensureTermRoot();
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && term.open) { closeTerm(); return; }
      var tag = (e.target && e.target.tagName) || '';
      var inForm = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable);
      if ((e.key === '~' || e.key === '`') && !inForm) {
        e.preventDefault();
        if (term.open) closeTerm(); else openTerm();
        return;
      }
      if (!inForm && /^[a-z]$/i.test(e.key)) {
        term.buffer = (term.buffer + e.key.toLowerCase()).slice(-5);
        if (term.buffer.indexOf('sudo') !== -1) {
          term.buffer = '';
          if (!term.open) openTerm();
        }
      }
    });
  }

  // ───── Wire controls ─────
  function wireControls() {
    doc.querySelectorAll('[data-ta-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setTheme(body.classList.contains('light') ? 'dark' : 'light');
      });
    });
    doc.querySelectorAll('[data-ta-lang-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var current = getLang();
        setLang(current === 'en' ? 'de' : 'en');
      });
    });
  }

  // ───── Init ─────
  function init() {
    applyTheme(getTheme());
    updateThemeButtons(getTheme());
    applyLang(getLang());
    wireControls();
    startClock();
    setupReveal();
    setupCursor();
    setupEasterEgg();
    // expose for home page React hooks to reuse same storage keys
    window.TAShell = { getLang: getLang, getTheme: getTheme, setLang: setLang, setTheme: setTheme };
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})();

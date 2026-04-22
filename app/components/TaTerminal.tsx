import {useCallback, useEffect, useRef, useState} from 'react';

interface Line {kind: 'in' | 'out' | 'err' | 'system'; text: string}

const ACCENT = '#22d3ee';
const ACCENT2 = '#a78bfa';

function matrix(): string[] {
  const chars = 'アイウエオカキクケコサシスセソタチツテト01';
  const out = ['wake up, Neo…', '> rendering reality as text…'];
  for (let r = 0; r < 5; r++) {
    let line = '';
    for (let c = 0; c < 48; c++) {
      line += chars[Math.floor(Math.random() * chars.length)];
    }
    out.push(line);
  }
  return out;
}

export function TaTerminal() {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<Line[]>([
    {kind: 'system', text: 'manuele@portfolio ~ % welcome'},
    {kind: 'out', text: 'Type "help" for commands. Press ESC or ~ to close.'},
  ]);
  const [input, setInput] = useState('');
  const bufferRef = useRef('');
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  const openTerm = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        close(); return;
      }
      const tag = (e.target as Element | null)?.tagName ?? '';
      const inForm = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement | null)?.isContentEditable;
      if ((e.key === '~' || e.key === '`') && !inForm) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (!inForm && /^[a-z]$/i.test(e.key)) {
        bufferRef.current = (bufferRef.current + e.key.toLowerCase()).slice(-5);
        if (bufferRef.current.includes('sudo')) {
          bufferRef.current = '';
          setOpen(true);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [open, history]);

  const commands: Record<string, () => string[] | null> = {
    help: () => [
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
      '  exit       — close terminal',
    ],
    whoami: () => [
      'Manuele · Full-Stack Web Developer · Switzerland',
      '5+ yrs @ IWF Web Solutions. BSc Business IT (FHNW).',
      'PHP / Symfony / React. Speaks DE, EN, FR, ES, IT.',
    ],
    skills: () => [
      'backend:  PHP 8.2 · Symfony 5.4 · PhpUnit · CraftCMS · MySQL',
      'frontend: React 18 · JS ES6 · Less · SCSS · Twig',
      'tools:    Git · Docker · Vite · Vagrant · PhpStorm',
      'business: SAP S/4HANA · Scrum PSD I · IREB',
    ],
    experience: () => [
      '2022 — now   IWF Web Solutions · Junior Web Dev (4y 4m)',
      '2021         IWF Web Solutions · Intern (1y)',
      '2018 — 2022  FHNW · BSc Business IT',
      '2013 — 2016  WMS · Kaufmann EFZ + BM',
    ],
    contact: () => [
      'email:    gh-contact@d3st.dev',
      'github:   github.com/D3strukt0r',
      'linkedin: linkedin.com/in/d3strukt0r',
    ],
    github: () => {
      window.open('https://github.com/D3strukt0r', '_blank'); return ['→ opening github.com/D3strukt0r'];
    },
    linkedin: () => {
      window.open('https://www.linkedin.com/in/d3strukt0r/', '_blank'); return ['→ opening linkedin.com/in/d3strukt0r'];
    },
    anime: () => ['currently watching: ████████░░ (classified)', 'recommendations welcome — ping me.'],
    matrix,
    sudo: () => [
      '[sudo] password for manuele: ••••••••',
      'access granted. you now have root.',
      'just kidding. but thanks for playing 🍡',
    ],
    clear: () => {
      setTimeout(setHistory, 0, []); return null;
    },
    exit: () => {
      setTimeout(close, 0); return ['goodbye.'];
    },
  };

  const run = (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    const entries: Line[] = [{kind: 'in', text: raw}];
    if (cmd) {
      const fn = commands[cmd];
      if (fn) {
        const out = fn();
        if (out) {
          out.forEach((t) => entries.push({kind: 'out', text: t}));
        }
      } else {
        entries.push({kind: 'err', text: `command not found: ${cmd}`});
        entries.push({kind: 'out', text: 'try "help"'});
      }
    }
    setHistory((h) => [...h, ...entries]);
  };

  if (!open) {
    return (
      <div
        onClick={openTerm}
        role="button"
        tabIndex={0}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 500,
          padding: '8px 14px',
          borderRadius: 999,
          fontSize: 12,
          fontFamily: '"JetBrains Mono", monospace',
          color: 'rgba(255,255,255,.75)',
          background: 'rgba(20,20,30,.45)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,.1)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          userSelect: 'none',
          width: 'auto',
        }}
      >
        <span style={{color: ACCENT}}>▸</span> press <kbd style={{padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,.1)', fontSize: 11}}>~</kbd> for terminal
      </div>
    );
  }

  return (
    <div
      onClick={close}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'taTermFade .18s ease',
      }}
    >
      <style>{`@keyframes taTermFade { from { opacity: 0 } to { opacity: 1 } } @keyframes taTermPop { from { opacity: 0; transform: translateY(10px) scale(.98) } to { opacity: 1; transform: none } }`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(720px, 92vw)',
          height: 'min(480px, 80vh)',
          background: 'rgba(15,15,25,.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 30px 100px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.04), inset 0 1px 0 rgba(255,255,255,.06)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'taTermPop .22s cubic-bezier(.2,.8,.2,1)',
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid rgba(255,255,255,.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: 'rgba(255,255,255,.55)',
          }}
        >
          <span onClick={close} style={{width: 12, height: 12, borderRadius: 6, background: '#ff5f57', display: 'inline-block', cursor: 'pointer'}} />
          <span style={{width: 12, height: 12, borderRadius: 6, background: '#febc2e', display: 'inline-block'}} />
          <span style={{width: 12, height: 12, borderRadius: 6, background: '#28c840', display: 'inline-block'}} />
          <span style={{marginLeft: 12}}>manuele@portfolio — -zsh — 80×24</span>
        </div>
        <div
          ref={bodyRef}
          onClick={() => inputRef.current?.focus()}
          style={{
            flex: 1,
            padding: '14px 18px',
            overflowY: 'auto',
            fontSize: 13,
            lineHeight: 1.55,
            color: 'rgba(255,255,255,.85)',
          }}
        >
          {history.map((h, i) => (
            <div key={i} style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
              {h.kind === 'in' && (
                <>
                  <span style={{color: ACCENT}}>manuele@portfolio</span>{' '}
                  <span style={{color: ACCENT2}}>~</span>{' '}
                  <span style={{color: 'rgba(255,255,255,.55)'}}>%</span>{' '}
                  {h.text}
                </>
              )}
              {h.kind === 'out' && <span>{h.text}</span>}
              {h.kind === 'err' && <span style={{color: '#ff6b8a'}}>{h.text}</span>}
              {h.kind === 'system' && (
                <span style={{color: 'rgba(255,255,255,.4)'}}># {h.text}</span>
              )}
            </div>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(input);
              setInput('');
            }}
            style={{display: 'flex', gap: 6, marginTop: 4}}
          >
            <span style={{color: ACCENT}}>manuele@portfolio</span>
            <span style={{color: ACCENT2}}>~</span>
            <span style={{color: 'rgba(255,255,255,.55)'}}>%</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              autoFocus
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'rgba(255,255,255,.95)',
                fontFamily: 'inherit',
                fontSize: 13,
                padding: 0,
                caretColor: ACCENT2,
              }}
            />
          </form>
        </div>
      </div>
    </div>
  );
}

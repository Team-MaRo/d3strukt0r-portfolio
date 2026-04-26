import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {EXPERIENCE} from '~/lib/linkedin';
import {SKILL_GROUPS, SOCIALS} from '~/lib/site';

interface Line {kind: 'in' | 'out' | 'err' | 'system'; text: string}

const PROTO_RE = /^https?:\/\//;
const ALPHA_KEY_RE = /^[a-z]$/i;

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
  const {t, i18n} = useTranslation();
  const de = i18n.resolvedLanguage === 'de';
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<Line[]>(() => [
    {kind: 'system', text: t('terminal.welcome')},
    {kind: 'out', text: t('terminal.intro')},
  ]);
  const [input, setInput] = useState('');
  const bufferRef = useRef('');
  const cmdHistRef = useRef<string[]>([]);
  const cmdCursorRef = useRef(-1);
  const draftRef = useRef('');
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  const openTerm = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        close();
        return;
      }
      const tag = (e.target as Element | null)?.tagName ?? '';
      const inForm = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement | null)?.isContentEditable === true;
      if ((e.key === '~' || e.key === '`') && !inForm) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (!inForm && ALPHA_KEY_RE.test(e.key)) {
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
    let focusTimer: ReturnType<typeof setTimeout> | undefined;
    if (open) {
      focusTimer = setTimeout(() => inputRef.current?.focus(), 60);
    }
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
    return () => {
      if (focusTimer !== undefined) {
        clearTimeout(focusTimer);
      }
    };
  }, [open, history]);

  const commands = useMemo<Record<string, () => string[] | null>>(() => ({
    help: () => [
      t('terminal.help.header'),
      ...(t('terminal.help.items', {returnObjects: true}) as string[]),
    ],
    whoami: () => t('terminal.whoami', {returnObjects: true}) as string[],
    skills: () => SKILL_GROUPS.map((g) => `${t(`skills.groups.${g.key}`)}: ${g.items.join(' · ')}`),
    experience: () => [...EXPERIENCE]
      .sort((a, b) => b.endKey.localeCompare(a.endKey))
      .map((e) => `${e.period}  ${e.company} · ${de ? e.roleDe : e.roleEn}`),
    contact: () => [
      `email:    ${SOCIALS.email}`,
      `github:   ${SOCIALS.github.replace(PROTO_RE, '')}`,
      `linkedin: ${SOCIALS.linkedin.replace(PROTO_RE, '')}`,
    ],
    github: () => {
      window.open(SOCIALS.github, '_blank');
      return [t('terminal.open_github')];
    },
    linkedin: () => {
      window.open(SOCIALS.linkedin, '_blank');
      return [t('terminal.open_linkedin')];
    },
    anime: () => t('terminal.anime', {returnObjects: true}) as string[],
    history: () => {
      const h = cmdHistRef.current;
      if (!h.length) {
        return [t('terminal.history_empty')];
      }
      return h.map((c, i) => `  ${String(i + 1).padStart(3)}  ${c}`);
    },
    matrix,
    sudo: () => t('terminal.sudo', {returnObjects: true}) as string[],
    clear: () => {
      setTimeout(setHistory, 0, []);
      return null;
    },
    exit: () => {
      setTimeout(close, 0);
      return [t('terminal.goodbye')];
    },
  }), [t, de, close]);

  const run = (raw: string) => {
    const trimmed = raw.trim();
    const cmd = trimmed.toLowerCase();
    if (trimmed) {
      const h = cmdHistRef.current;
      if (h.at(-1) !== trimmed) {
        h.push(trimmed);
      }
    }
    cmdCursorRef.current = -1;
    draftRef.current = '';
    const entries: Line[] = [{kind: 'in', text: raw}];
    if (cmd) {
      const fn = commands[cmd];
      if (fn) {
        const out = fn();
        if (out) {
          out.forEach((tx) => entries.push({kind: 'out', text: tx}));
        }
      } else {
        entries.push({kind: 'err', text: t('terminal.not_found', {cmd})});
        entries.push({kind: 'out', text: t('terminal.try_help')});
      }
    }
    setHistory((h) => [...h, ...entries]);
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const hist = cmdHistRef.current;
    if (e.key === 'ArrowUp') {
      if (!hist.length) {
        return;
      }
      e.preventDefault();
      if (cmdCursorRef.current === -1) {
        draftRef.current = input;
        cmdCursorRef.current = hist.length - 1;
      } else if (cmdCursorRef.current > 0) {
        cmdCursorRef.current -= 1;
      }
      setInput(hist[cmdCursorRef.current]!);
    } else if (e.key === 'ArrowDown') {
      if (cmdCursorRef.current === -1) {
        return;
      }
      e.preventDefault();
      if (cmdCursorRef.current >= hist.length - 1) {
        cmdCursorRef.current = -1;
        setInput(draftRef.current);
        draftRef.current = '';
      } else {
        cmdCursorRef.current += 1;
        setInput(hist[cmdCursorRef.current]!);
      }
    }
  };

  if (!open) {
    return (
      <div onClick={openTerm} role="button" tabIndex={0} className="ta-term-hint">
        <span className="ta-accent">▸</span> {t('terminal.hint')} <kbd>~</kbd> {t('terminal.hint_suffix')}
      </div>
    );
  }

  return (
    <div onClick={close} className="ta-term-backdrop">
      <div onClick={(e) => e.stopPropagation()} className="ta-term-modal">
        <div className="ta-term-bar">
          <span onClick={close} className="ta-dot r" />
          <span className="ta-dot y" />
          <span className="ta-dot g" />
          <span className="ta-term-title">manuele@portfolio — -zsh — 80×24</span>
        </div>
        <div ref={bodyRef} onClick={() => inputRef.current?.focus()} className="ta-term-body">
          {history.map((h, i) => {
            const cls = `ta-term-line${h.kind === 'err' ? ' ta-term-err' : ''}${h.kind === 'system' ? ' ta-term-sys' : ''}`;
            return (
              // eslint-disable-next-line react/no-array-index-key -- terminal log lines have no stable id; index reflects append order
              <div key={i} className={cls}>
                {h.kind === 'in' && (
                  <>
                    <span className="ta-term-user">manuele@portfolio</span>{' '}
                    <span className="ta-term-tilde">~</span>{' '}
                    <span className="ta-term-pct">%</span>{' '}
                    {h.text}
                  </>
                )}
                {h.kind === 'out' && <span>{h.text}</span>}
                {h.kind === 'err' && <span>{h.text}</span>}
                {h.kind === 'system' && <span># {h.text}</span>}
              </div>
            );
          })}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(input);
              setInput('');
            }}
            className="ta-term-form"
          >
            <span className="ta-term-user">manuele@portfolio</span>
            <span className="ta-term-tilde">~</span>
            <span className="ta-term-pct">%</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onInputKeyDown}
              spellCheck={false}
              autoComplete="off"
              autoFocus
              className="ta-term-input"
            />
          </form>
        </div>
      </div>
    </div>
  );
}

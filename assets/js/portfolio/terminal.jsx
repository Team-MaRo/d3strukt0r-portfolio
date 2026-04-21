// Direction B — "Terminal Aurora"
// Dev-coded glassmorphism. Command-palette nav, monospace accents,
// dense grid. Same content, harder-edged treatment.

const { useState: bUS, useEffect: bUE, useRef: bUR } = React;

function TerminalAurora() {
  // Shell (_includes/ta-*.html + ta-shell.js) renders nav, background, custom
  // cursor, footer, and the easter-egg terminal. This root only renders the
  // portfolio-specific interactive sections.
  const { lang, t } = useLang('en');

  return (
    <>
      <TAHero t={t} lang={lang} />
      <TAStats t={t} lang={lang} />
      <TAAbout t={t} lang={lang} />
      <TASkills t={t} lang={lang} />
      <TAGitHub t={t} lang={lang} />
      <TAProjects t={t} lang={lang} />
      <TAExperience t={t} lang={lang} />
      <TAMeta t={t} lang={lang} />
      <TAContact t={t} lang={lang} />
    </>
  );
}

function TABg() {
  return (
    <div className="ta-bg" aria-hidden>
      <div className="ta-blob ta-b1" />
      <div className="ta-blob ta-b2" />
      <div className="ta-grid-overlay" />
    </div>
  );
}

function TANav({ lang, setLang, theme, toggle }) {
  const [time, setTime] = bUS(new Date());
  bUE(() => { const i = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(i); }, []);
  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  return (
    <nav className="ta-nav">
      <div className="ta-nav-inner ta-glass">
        <div className="ta-nav-brand">
          <span className="ta-cursor-blink">▌</span>
          <span>manuele<span className="ta-dim">@ch</span>:~$</span>
        </div>
        <div className="ta-nav-links">
          <a href="#about" className="ta-nav-link cursor-hover">./about</a>
          <a href="#stack" className="ta-nav-link cursor-hover">./stack</a>
          <a href="#work" className="ta-nav-link cursor-hover">./work</a>
          <a href="#meta" className="ta-nav-link cursor-hover">./meta</a>
          <a href="#contact" className="ta-nav-link cursor-hover">./contact</a>
        </div>
        <div className="ta-nav-controls">
          <span className="ta-time">{hh}:{mm} CET</span>
          <button className="ta-pill cursor-hover" onClick={() => setLang(lang === 'en' ? 'de' : 'en')}>
            <span className={lang === 'en' ? 'on' : ''}>en</span>|<span className={lang === 'de' ? 'on' : ''}>de</span>
          </button>
          <button className="ta-icon cursor-hover" onClick={toggle} aria-label="theme">
            {theme === 'dark' ? '◐' : '◑'}
          </button>
        </div>
      </div>
    </nav>
  );
}

function TAHero({ t, lang }) {
  const { hero, role, location, github, linkedin } = PORTFOLIO_CONTENT;
  const h = hero[lang];
  const [typed, setTyped] = bUS('');
  const full = `~$ whoami`;
  bUE(() => {
    let i = 0;
    const id = setInterval(() => {
      i++; setTyped(full.slice(0, i));
      if (i >= full.length) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="top" className="ta-hero">
      <div className="ta-hero-grid">
        <div className="ta-hero-main">
          <div className="ta-shell ta-glass">
            <div className="ta-shell-head">
              <span className="ta-dot r" /><span className="ta-dot y" /><span className="ta-dot g" />
              <span className="ta-shell-title">zsh — manuele@portfolio — ~</span>
            </div>
            <div className="ta-shell-body">
              <div><span className="ta-prompt">→</span> <span className="ta-mono">{typed}<span className="ta-cursor-blink">▌</span></span></div>
              <pre className="ta-ascii">{String.raw`  __  __                         _     
 |  \/  | __ _ _ __  _   _  ___| | ___ 
 | |\/| |/ _\` | '_ \| | | |/ _ \ |/ _ \
 | |  | | (_| | | | | |_| |  __/ |  __/
 |_|  |_|\__,_|_| |_|\__,_|\___|_|\___|`}</pre>
              <div className="ta-meta-row">
                <span><span className="ta-key">name</span>: Manuele</span>
                <span><span className="ta-key">role</span>: Full-Stack Web Dev</span>
                <span><span className="ta-key">loc</span>: {t(location)}</span>
                <span className="ta-ok">● online</span>
              </div>
            </div>
          </div>

          <h1 className="ta-hero-title">
            {h.title}
          </h1>
          <p className="ta-hero-sub">{h.sub}</p>

          <div className="ta-hero-cta">
            <a href="#work" className="ta-btn ta-btn-primary cursor-hover">
              <span>$ ls ./work</span>
              <span className="ta-btn-arrow">→</span>
            </a>
            <a href="#contact" className="ta-btn ta-btn-ghost cursor-hover">
              $ echo "hi" | mail
            </a>
          </div>
        </div>

        <div className="ta-hero-side">
          <div className="ta-sidecard ta-glass">
            <div className="ta-sidecard-head">
              <span>~/NOW.md</span>
              <span className="ta-dim">· {new Date().toISOString().slice(0, 10)}</span>
            </div>
            <ul className="ta-sidecard-list">
              <li><span className="ta-check">✓</span> {lang === 'en' ? 'Shipping at IWF Web Solutions' : 'Im Einsatz bei IWF Web Solutions'}</li>
              <li><span className="ta-check">✓</span> {lang === 'en' ? 'Open to freelance inquiries' : 'Offen für Freelance-Anfragen'}</li>
              <li><span className="ta-check">→</span> {lang === 'en' ? 'Learning: Rust, on weekends' : 'Lerne: Rust, am Wochenende'}</li>
              <li><span className="ta-check">◎</span> {lang === 'en' ? 'Watching: S-tier anime' : 'Schaue: S-Tier Anime'}</li>
            </ul>
          </div>

          <div className="ta-sidecard ta-glass ta-side-skills">
            <div className="ta-sidecard-head">
              <span>~/daily.stack</span>
            </div>
            <div className="ta-side-skillrow"><span>php</span><span className="ta-bar"><span style={{ width: '92%' }} /></span></div>
            <div className="ta-side-skillrow"><span>symfony</span><span className="ta-bar"><span style={{ width: '88%' }} /></span></div>
            <div className="ta-side-skillrow"><span>react</span><span className="ta-bar"><span style={{ width: '80%' }} /></span></div>
            <div className="ta-side-skillrow"><span>docker</span><span className="ta-bar"><span style={{ width: '70%' }} /></span></div>
            <div className="ta-side-skillrow"><span>sap/erp</span><span className="ta-bar"><span style={{ width: '60%' }} /></span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TAStats({ t, lang }) {
  const { stats } = PORTFOLIO_CONTENT;
  return (
    <section className="ta-stats-strip ta-glass">
      {stats.map((s, i) => (
        <div key={i} className="ta-stat-item">
          <div className="ta-stat-val">{s.value}</div>
          <div className="ta-stat-lab">{t(s.label)}</div>
        </div>
      ))}
    </section>
  );
}

function TAAbout({ t, lang }) {
  const { about } = PORTFOLIO_CONTENT;
  return (
    <section id="about" className="ta-section">
      <TAHeading num="01" code="cat ./about.md" title={lang === 'en' ? 'About' : 'Über mich'} />
      <div className="ta-about-grid">
        <div className="ta-about-main ta-glass">
          {about[lang].map((p, i) => (
            <Reveal key={i} delay={i * 80}><p className={i === 0 ? 'ta-lead' : ''}>{p}</p></Reveal>
          ))}
        </div>
        <div className="ta-about-side">
          <div className="ta-glass ta-card-mini">
            <div className="ta-card-head">~/identity.json</div>
            <pre className="ta-json">{`{
  "from":    "Switzerland",
  "edu":     "BSc Business IT",
  "speaks":  ${PORTFOLIO_CONTENT.languages.length},
  "ships":   "yes",
  "anime":   true
}`}</pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function TAHeading({ num, code, title }) {
  return (
    <div className="ta-heading">
      <Reveal><div className="ta-hnum">{num}</div></Reveal>
      <Reveal delay={80}><div className="ta-hcode"><span className="ta-dim">$</span> {code}</div></Reveal>
      <Reveal delay={160}><h2 className="ta-h2">{title}</h2></Reveal>
    </div>
  );
}

function TASkills({ t, lang }) {
  const groups = PORTFOLIO_CONTENT.skills[lang];
  return (
    <section id="stack" className="ta-section">
      <TAHeading num="02" code="ls -la ./stack" title={lang === 'en' ? 'Daily stack' : 'Daily Stack'} />
      <div className="ta-stack-grid">
        {groups.map((g, i) => (
          <Reveal key={g.group} delay={i * 80}>
            <div className="ta-glass ta-stack-card cursor-hover">
              <div className="ta-stack-head">
                <span className="ta-dim">▸</span> {g.group.toLowerCase()}/
              </div>
              <ul className="ta-stack-list">
                {g.items.map((s, j) => (
                  <li key={s}>
                    <span className="ta-dim">{String(j + 1).padStart(2, '0')}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function TAGitHub({ t, lang }) {
  const user = useGitHubUser('D3strukt0r');
  const { repos } = useGitHubRepos('D3strukt0r');
  const grid = useContribGraph(repos);
  return (
    <section className="ta-section">
      <Reveal>
        <div className="ta-glass ta-gh">
          <div className="ta-gh-head">
            <div>
              <div className="ta-hcode"><span className="ta-dim">$</span> gh stat --user D3strukt0r</div>
              <h3 className="ta-gh-title">github.com/<span className="ta-accent">D3strukt0r</span></h3>
            </div>
            {user && <div className="ta-gh-stats">
              <div><b>{user.public_repos}</b><span>repos</span></div>
              <div><b>{user.followers}</b><span>{lang === 'en' ? 'followers' : 'Follower'}</span></div>
              <div><b>{user.created_at?.slice(0, 4)}</b><span>joined</span></div>
            </div>}
          </div>
          <div className="ta-contrib">
            {grid.map((week, wi) => (
              <div key={wi} className="ta-cc-col">
                {week.map((v, di) => (
                  <div key={di} className={`ta-cc-cell tl${v}`} />
                ))}
              </div>
            ))}
          </div>
          <div className="ta-gh-legend">
            <span>{lang === 'en' ? '26 weeks' : '26 Wochen'}</span>
            <div className="ta-legend-cells">
              {[0,1,2,3,4].map(l => <div key={l} className={`ta-cc-cell tl${l}`} />)}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function TAProjects({ t, lang }) {
  const { repos } = useGitHubRepos('D3strukt0r');
  const list = repos || PORTFOLIO_CONTENT.projectsFallback.map(p => ({
    name: p.name, desc: t(p.desc), stars: p.stars, lang: p.lang, url: `${PORTFOLIO_CONTENT.github}/${p.name}`,
  }));
  return (
    <section id="work" className="ta-section">
      <TAHeading num="03" code="git log --projects" title={lang === 'en' ? 'Projects' : 'Projekte'} />
      {!repos && <Reveal><div className="ta-loading">{'> '}{lang === 'en' ? 'fetching repos from api.github.com…' : 'lade Repos von api.github.com…'}</div></Reveal>}
      <div className="ta-proj-grid">
        {list.slice(0, 9).map((r, i) => (
          <Reveal key={r.name} delay={(i % 3) * 60}>
            <a href={r.url} target="_blank" rel="noreferrer" className="ta-glass ta-proj cursor-hover">
              <div className="ta-proj-idx">{String(i + 1).padStart(2, '0')}</div>
              <div className="ta-proj-body">
                <div className="ta-proj-name">
                  <span className="ta-dim">~/</span>{r.name}
                </div>
                <p className="ta-proj-desc">{r.desc || '// no description'}</p>
                <div className="ta-proj-meta">
                  <span className="ta-chip">{r.lang || 'misc'}</span>
                  <span className="ta-dim">★ {r.stars}</span>
                  <span className="ta-proj-arrow">↗</span>
                </div>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function TAExperience({ t, lang }) {
  const exp = PORTFOLIO_CONTENT.experience;
  return (
    <section className="ta-section">
      <TAHeading num="04" code="cat CAREER.log" title={lang === 'en' ? 'Career log' : 'Werdegang'} />
      <div className="ta-exp">
        {exp.map((e, i) => (
          <Reveal key={i} delay={i * 80}>
            <div className="ta-glass ta-exp-row cursor-hover">
              <div className="ta-exp-timestamp">[{e.period}]</div>
              <div className="ta-exp-body">
                <div className="ta-exp-company">{e.company} <span className="ta-dim">/ {t(e.role)}</span></div>
                <div className="ta-exp-dur">{t(e.duration)} · {e.location}</div>
                <div className="ta-exp-stack">
                  {e.stack.map(s => <span key={s} className="ta-chip sm">{s}</span>)}
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function TAMeta({ t, lang }) {
  const L = PORTFOLIO_CONTENT.languages;
  const certs = PORTFOLIO_CONTENT.certificates;
  return (
    <section id="meta" className="ta-section">
      <TAHeading num="05" code="cat ./meta/*" title={lang === 'en' ? 'Meta' : 'Meta'} />
      <div className="ta-meta-grid">
        <div className="ta-glass ta-meta-card">
          <div className="ta-card-head">./languages</div>
          <div className="ta-lang-list">
            {L.map((l, i) => (
              <div key={i} className="ta-lang-row">
                <span className="ta-lang-flag">{l.flag}</span>
                <span className="ta-lang-name">{t(l.name)}</span>
                <span className="ta-lang-level">{l.level}</span>
                <span className="ta-lang-bars">
                  {[1,2,3,4,5].map(n => <span key={n} className={n <= l.stars ? 'on' : ''} />)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="ta-glass ta-meta-card">
          <div className="ta-card-head">./certificates</div>
          <div className="ta-cert-list">
            {certs.map((c, i) => (
              <div key={i} className="ta-cert-row">
                <span className="ta-cert-year">{c.year}</span>
                <div>
                  <div className="ta-cert-name">{c.name}</div>
                  <div className="ta-dim ta-cert-issuer">↳ {c.issuer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="ta-glass ta-meta-card">
          <div className="ta-card-head">./writing</div>
          {(Array.isArray(PORTFOLIO_CONTENT.blog) ? PORTFOLIO_CONTENT.blog : []).slice(0, 3).map((p, i) => (
            <a key={i} href={p.url} className="ta-blog-entry cursor-hover">
              <div className="ta-blog-date">{p.date}</div>
              <div className="ta-blog-name">{t(p.title)}</div>
            </a>
          ))}
          <div className="ta-writing-foot">
            <a href={PORTFOLIO_CONTENT.blogUrl || '/archive/'} className="ta-link cursor-hover">
              $ open ./blog →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function TAContact({ t, lang }) {
  const C = PORTFOLIO_CONTENT.contact[lang];
  const { email, github, linkedin, twitter } = PORTFOLIO_CONTENT;
  return (
    <section id="contact" className="ta-section">
      <div className="ta-glass ta-contact">
        <Reveal><div className="ta-hcode"><span className="ta-dim">$</span> echo "hi@d3strukt0r.dev" | mail</div></Reveal>
        <Reveal delay={60}><h2 className="ta-h1">{C.title}</h2></Reveal>
        <Reveal delay={120}><p className="ta-contact-sub">{C.sub}</p></Reveal>
        <Reveal delay={180}>
          <a href={`mailto:${email}`} className="ta-email cursor-hover">
            <span className="ta-dim">→</span> {email}
          </a>
        </Reveal>
        <div className="ta-contact-socials">
          <a href={github} target="_blank" rel="noreferrer" className="ta-socbtn cursor-hover">GitHub</a>
          <a href={linkedin} target="_blank" rel="noreferrer" className="ta-socbtn cursor-hover">LinkedIn</a>
          <a href={twitter} target="_blank" rel="noreferrer" className="ta-socbtn cursor-hover">X/Twitter</a>
        </div>
      </div>
    </section>
  );
}

function TAFooter({ t, lang }) {
  return (
    <footer className="ta-footer">
      <div><span className="ta-dim">$</span> exit 0 · © {new Date().getFullYear()} manuele</div>
      <div className="ta-dim">tip: press <kbd>~</kbd> or type <kbd>sudo</kbd> for terminal</div>
    </footer>
  );
}

Object.assign(window, { TerminalAurora });

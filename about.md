---
layout: default
title: About
permalink: /about/
---

<section class="ta-section">
  <div class="ta-page-head">
    <div class="ta-hnum" data-reveal>~/about</div>
    <div class="ta-hcode" data-reveal data-delay="1"><span class="ta-dim">$</span> cat ./about.md</div>
    <h1 class="ta-h1" data-reveal data-delay="2">About</h1>
  </div>

  <div class="ta-about-grid">
    <div class="ta-about-main ta-glass ta-content" data-reveal>
      <p class="ta-lead">
        Hey — I'm Manuele. Swiss full-stack web developer, shipping Symfony + React at IWF Web Solutions. Business IT grad (FHNW), five languages, anime on the second monitor.
      </p>
      <p>
        This page doubles as my CV. Everything below is pulled from <code>_steps/</code>, so it stays in sync when I update the source files — no separate resume to maintain.
      </p>
    </div>
    <div class="ta-about-side">
      <div class="ta-glass ta-card-mini" data-reveal data-delay="1">
        <div class="ta-card-head">~/identity.json</div>
<pre class="ta-json">{
  "from":    "Switzerland",
  "edu":     "BSc Business IT",
  "speaks":  5,
  "ships":   "yes",
  "anime":   true
}</pre>
      </div>
    </div>
  </div>

  <!-- Timeline -->
  <div class="ta-heading" style="margin-top: 64px;">
    <div class="ta-hnum" data-reveal>01</div>
    <div class="ta-hcode" data-reveal data-delay="1"><span class="ta-dim">$</span> cat CAREER.log | tac</div>
    <h2 class="ta-h2" data-reveal data-delay="2">Timeline</h2>
  </div>
  <div class="ta-timeline">
    {% assign steps = site.steps | sort: 'date' | reverse %}
    {% for step in steps %}
      <div class="ta-glass ta-exp-row cursor-hover" data-reveal>
        <div class="ta-exp-timestamp">
          [{{ step.date | date: '%m/%Y' }}{% if step.enddate %} — {{ step.enddate | date: '%m/%Y' }}{% endif %}]
        </div>
        <div class="ta-exp-body">
          <div class="ta-exp-company">{{ step.title }}</div>
          <div class="ta-exp-dur ta-content" style="margin-top: 6px;">{{ step.content }}</div>
        </div>
      </div>
    {% endfor %}
  </div>

  <!-- Qualifications -->
  <div class="ta-heading" style="margin-top: 64px;">
    <div class="ta-hnum" data-reveal>02</div>
    <div class="ta-hcode" data-reveal data-delay="1"><span class="ta-dim">$</span> ls ./qualifications</div>
    <h2 class="ta-h2" data-reveal data-delay="2">Qualifications</h2>
  </div>

  <div class="ta-glass ta-about-main" data-reveal style="margin-bottom: 18px;">
    <div class="ta-meta-row" style="margin: 0; gap: 10px;">
      <span class="ta-chip"><span class="ta-dim">basic</span> · 1</span>
      <span class="ta-chip"><span class="ta-dim">standard</span> · 2</span>
      <span class="ta-chip"><span class="ta-dim">good</span> · 3</span>
      <span class="ta-chip"><span class="ta-dim">expert</span> · 4</span>
    </div>
  </div>

  <div class="ta-meta-grid">
    <!-- Languages -->
    <div class="ta-glass ta-meta-card" data-reveal>
      <div class="ta-card-head">./languages</div>
      <div class="ta-lang-list">
        {% assign langs = "German|🇩🇪|Native|5,English|🇬🇧|C1 · CAE|4,French|🇫🇷|B1 · DELF|3,Spanish|🇪🇸|A2|2,Italian|🇮🇹|A1|1" | split: "," %}
        {% for row in langs %}
          {% assign parts = row | split: "|" %}
          <div class="ta-lang-row">
            <span class="ta-lang-flag">{{ parts[1] }}</span>
            <span class="ta-lang-name">{{ parts[0] }}</span>
            <span class="ta-lang-level">{{ parts[2] }}</span>
            <span class="ta-lang-bars">
              {% assign n = parts[3] | plus: 0 %}
              {% for i in (1..5) %}<span{% if i <= n %} class="on"{% endif %}></span>{% endfor %}
            </span>
          </div>
        {% endfor %}
      </div>
      <p class="ta-dim" style="font-family: 'JetBrains Mono'; font-size: 11px; margin: 14px 0 0;">
        certificates on request — <a href="mailto:{{ site.author.email }}" class="ta-link cursor-hover">email me</a>
      </p>
    </div>

    <!-- Certificates -->
    <div class="ta-glass ta-meta-card" data-reveal data-delay="1">
      <div class="ta-card-head">./certificates</div>
      <div class="ta-cert-list">
        <div class="ta-cert-row"><span class="ta-cert-year">2023</span><div><div class="ta-cert-name">Professional Scrum Developer I</div><div class="ta-dim ta-cert-issuer">↳ Scrum.org</div></div></div>
        <div class="ta-cert-row"><span class="ta-cert-year">2021</span><div><div class="ta-cert-name">SAP Certified App Associate — S/4HANA</div><div class="ta-dim ta-cert-issuer">↳ SAP</div></div></div>
        <div class="ta-cert-row"><span class="ta-cert-year">2019</span><div><div class="ta-cert-name">IREB Requirements Engineering</div><div class="ta-dim ta-cert-issuer">↳ SAQ</div></div></div>
        <div class="ta-cert-row"><span class="ta-cert-year">2018</span><div><div class="ta-cert-name">Cambridge English CAE (C1)</div><div class="ta-dim ta-cert-issuer">↳ Cambridge English</div></div></div>
        <div class="ta-cert-row"><span class="ta-cert-year">2015</span><div><div class="ta-cert-name">DELF B1</div><div class="ta-dim ta-cert-issuer">↳ Ministère de l'Éducation nationale</div></div></div>
      </div>
    </div>

    <!-- Programs -->
    <div class="ta-glass ta-meta-card ta-side-skills" data-reveal data-delay="2">
      <div class="ta-card-head">./programs</div>
      {% assign progs = "JetBrains PhpStorm|4,Microsoft Word|4,Microsoft Excel|4,Microsoft PowerPoint|4,JetBrains IntelliJ|3,Nexus Hospis|3,Microsoft VS Code|2" | split: "," %}
      {% for row in progs %}
        {% assign parts = row | split: "|" %}
        {% assign pct = parts[1] | times: 25 %}
        <div class="ta-side-skillrow"><span>{{ parts[0] }}</span><span class="ta-bar"><span style="width: {{ pct }}%;"></span></span></div>
      {% endfor %}
    </div>
  </div>

  <!-- Tech stack (full-width, 4 columns of skill bars) -->
  <div class="ta-heading" style="margin-top: 40px;">
    <div class="ta-hcode" data-reveal><span class="ta-dim">$</span> ls ./stack</div>
    <h3 class="ta-h2" data-reveal data-delay="1" style="font-size: clamp(20px, 2.2vw, 26px);">Tech stack</h3>
  </div>
  <div class="ta-stack-grid">
    <div class="ta-glass ta-stack-card ta-side-skills" data-reveal>
      <div class="ta-stack-head"><span class="ta-dim">▸</span> languages/</div>
      {% assign langs2 = "HTML|4,PHP (OOP)|4,Twig|4,CSS|2,JavaScript|2,SQL|2,Java|2" | split: "," %}
      {% for row in langs2 %}{% assign parts = row | split: "|" %}{% assign pct = parts[1] | times: 25 %}
        <div class="ta-side-skillrow"><span>{{ parts[0] }}</span><span class="ta-bar"><span style="width: {{ pct }}%;"></span></span></div>
      {% endfor %}
    </div>
    <div class="ta-glass ta-stack-card ta-side-skills" data-reveal data-delay="1">
      <div class="ta-stack-head"><span class="ta-dim">▸</span> databases/</div>
      <div class="ta-side-skillrow"><span>MySQL</span><span class="ta-bar"><span style="width: 75%;"></span></span></div>
    </div>
    <div class="ta-glass ta-stack-card ta-side-skills" data-reveal data-delay="2">
      <div class="ta-stack-head"><span class="ta-dim">▸</span> os/</div>
      <div class="ta-side-skillrow"><span>Windows</span><span class="ta-bar"><span style="width: 75%;"></span></span></div>
      <div class="ta-side-skillrow"><span>Ubuntu</span><span class="ta-bar"><span style="width: 50%;"></span></span></div>
    </div>
    <div class="ta-glass ta-stack-card ta-side-skills" data-reveal data-delay="3">
      <div class="ta-stack-head"><span class="ta-dim">▸</span> vcs/</div>
      <div class="ta-side-skillrow"><span>Git</span><span class="ta-bar"><span style="width: 75%;"></span></span></div>
    </div>
  </div>

  <p class="ta-dim" data-reveal style="font-family: 'JetBrains Mono'; font-size: 12px; margin-top: 24px;">
    <span class="ta-dim">$</span> for an up-to-date list of side projects, see my
    <a href="{{ site.author.github }}?tab=repositories" class="ta-link cursor-hover">github profile</a> →
  </p>

  <!-- Elsewhere -->
  <div class="ta-heading" style="margin-top: 64px;">
    <div class="ta-hnum" data-reveal>03</div>
    <div class="ta-hcode" data-reveal data-delay="1"><span class="ta-dim">$</span> cat ./elsewhere.txt</div>
    <h2 class="ta-h2" data-reveal data-delay="2">Elsewhere</h2>
  </div>
  <div class="ta-contact-socials" style="justify-content: flex-start;" data-reveal>
    <a href="https://www.linkedin.com/in/d3strukt0r/" target="_blank" rel="noreferrer" class="ta-socbtn cursor-hover">LinkedIn</a>
    <a href="https://github.com/D3strukt0r" target="_blank" rel="noreferrer" class="ta-socbtn cursor-hover">GitHub</a>
    <a href="https://www.xing.com/profile/Manuele_xx/cv" target="_blank" rel="noreferrer" class="ta-socbtn cursor-hover">Xing</a>
  </div>
</section>

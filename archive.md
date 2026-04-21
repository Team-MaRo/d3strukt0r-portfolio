---
layout: default
title: Archive
permalink: /archive/
---

<section class="ta-section">
  <div class="ta-page-head">
    <div class="ta-hnum" data-reveal>~/blog</div>
    <div class="ta-hcode" data-reveal data-delay="1"><span class="ta-dim">$</span> ls -lah ./blog</div>
    <h1 class="ta-h1" data-reveal data-delay="2">Writing</h1>
  </div>

  {% assign grouped = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}
  {% for group in grouped %}
    <h2 class="ta-h2" style="margin: 32px 0 16px; font-family: 'JetBrains Mono'; font-size: 16px; color: var(--accent);" data-reveal>
      <span class="ta-dim">▸</span> {{ group.name }}/
    </h2>
    <div class="ta-archive-list">
      {% for post in group.items %}
        <a class="ta-blog-entry cursor-hover" href="{{ post.url | relative_url }}" data-reveal>
          <div class="ta-blog-date">{{ post.date | date: "%Y-%m-%d" }}</div>
          <div class="ta-blog-name">{{ post.title }}</div>
          {% if post.excerpt %}<div class="ta-dim" style="margin-top: 4px; font-size: 12px;">↳ {{ post.excerpt | strip_html | truncate: 120 }}</div>{% endif %}
        </a>
      {% endfor %}
    </div>
  {% endfor %}
</section>

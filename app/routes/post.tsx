import type {Route} from './+types/post';
import {useRef} from 'react';
import {Link, useParams} from 'react-router';
import {useInternalLinkNav} from '~/hooks/useInternalLinkNav';
import {postBySlug, posts, postUrl} from '~/lib/content';

export function meta({params}: Route.MetaArgs) {
  const p = postBySlug(params.slug);
  return [{title: p ? `${p.title} · Manuele` : 'Post · Manuele'}];
}

export default function Post() {
  const {slug} = useParams();
  const post = postBySlug(slug ?? '');
  if (!post) {
    return (
      <section className="ta-section">
        <div className="ta-glass ta-404">
          <h1 className="ta-h1">post not found</h1>
          <Link to="/blog" className="ta-link cursor-hover">$ cd /blog →</Link>
        </div>
      </section>
    );
  }

  const articleRef = useRef<HTMLElement>(null);
  useInternalLinkNav(articleRef);
  const idx = posts.findIndex((p) => p.slug === post.slug);
  const prev = idx < posts.length - 1 ? posts[idx + 1] : null;
  const next = idx > 0 ? posts[idx - 1] : null;
  const words = post.html.replace(/<[^>]+>/g, '').trim().split(/\s+/).length;
  const readTime = Math.max(1, Math.round(words / 200));

  return (
    <section className="ta-section">
      <div className="ta-page-head">
        <div className="ta-hnum" data-reveal>~/blog/{post.date}-{post.slug}.md</div>
        <div className="ta-hcode" data-reveal data-delay="1"><span className="ta-dim">$</span> cat ./{post.slug}.md</div>
        <h1 className="ta-h1" data-reveal data-delay="2">{post.title}</h1>
        <div className="ta-post-meta" data-reveal data-delay="3">
          <span><span className="ta-key">date</span>: <time dateTime={post.date}>{post.date}</time></span>
          <span><span className="ta-key">read</span>: ~{readTime} min</span>
        </div>
      </div>

      <article ref={articleRef} className="ta-glass ta-about-main ta-content" dangerouslySetInnerHTML={{__html: post.html}} />

      <nav className="ta-post-nav" aria-label="post navigation">
        {prev
          ? (
              <Link to={postUrl(prev)} className="ta-blog-entry prev cursor-hover">
                <div className="ta-blog-date">← {prev.date}</div>
                <div className="ta-blog-name">{prev.title}</div>
              </Link>
            )
          : <span />}
        {next
          ? (
              <Link to={postUrl(next)} className="ta-blog-entry next cursor-hover">
                <div className="ta-blog-date">{next.date} →</div>
                <div className="ta-blog-name">{next.title}</div>
              </Link>
            )
          : <span />}
      </nav>
    </section>
  );
}

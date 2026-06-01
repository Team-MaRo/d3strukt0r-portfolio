import type {Route} from './+types/post';
import {useRef} from 'react';
import {Link, useParams} from 'react-router';
import {Reveal} from '~/components/Reveal';
import {Button} from '~/components/ui/button';
import {Card} from '~/components/ui/card';
import {useInternalLinkNav} from '~/hooks/useInternalLinkNav';
import {postBySlug, posts, postUrl} from '~/lib/content';

export function meta({params}: Route.MetaArgs) {
  const p = postBySlug(params.slug);
  return [{title: p ? `${p.title} · Manuele` : 'Post · Manuele'}];
}

export default function Post() {
  const {slug} = useParams();
  const post = postBySlug(slug ?? '');
  const articleRef = useRef<HTMLElement>(null);
  useInternalLinkNav(articleRef);
  if (!post) {
    return (
      <section className="w-full pt-32 pb-20 md:pt-40">
        <div className="container">
          <Card glass className="p-10 text-center">
            <h1 className="font-display text-3xl font-medium">post not found</h1>
            <Button asChild variant="ghost" size="sm" className="mt-4 font-mono text-primary">
              <Link to="/blog">$ cd /blog →</Link>
            </Button>
          </Card>
        </div>
      </section>
    );
  }

  const idx = posts.findIndex((p) => p.slug === post.slug);
  const prev = idx < posts.length - 1 ? posts[idx + 1] : null;
  const next = idx > 0 ? posts[idx - 1] : null;

  return (
    <section className="w-full pt-32 pb-20 md:pt-40">
      <div className="container">
        <div className="mb-8">
          <Reveal>
            <div className="mb-1.5 font-mono text-xs text-primary">~/blog/{post.date}-{post.slug}.md</div>
          </Reveal>
          <Reveal delay={0.07}>
            <div className="mb-3 font-mono text-sm text-muted-foreground">
              <span className="opacity-50">$</span> cat ./{post.slug}.md
            </div>
          </Reveal>
          <Reveal delay={0.14}>
            <h1 className="font-display text-4xl font-medium tracking-tight md:text-5xl">{post.title}</h1>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-4 flex flex-wrap gap-4 font-mono text-xs text-muted-foreground">
              <span><span className="text-primary">date</span>: <time dateTime={post.date}>{post.date}</time></span>
              <span><span className="text-primary">read</span>: ~{post.readTime} min</span>
            </div>
          </Reveal>
        </div>

        <Card glass className="p-8">
          {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml -- post HTML is generated at build time from trusted markdown sources */}
          <article ref={articleRef} className="ta-content" dangerouslySetInnerHTML={{__html: post.html}} />
        </Card>

        <nav className="mt-10 grid grid-cols-1 gap-3.5 sm:grid-cols-2" aria-label="post navigation">
          {prev
            ? (
                <Link
                  to={postUrl(prev)}
                  className="block rounded-lg border border-border bg-muted/40 p-4 font-mono text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 cursor-hover"
                >
                  <div className="text-[11px] text-primary">← {prev.date}</div>
                  <div className="mt-1">{prev.title}</div>
                </Link>
              )
            : <span />}
          {next
            ? (
                <Link
                  to={postUrl(next)}
                  className="block rounded-lg border border-border bg-muted/40 p-4 text-right font-mono text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 cursor-hover"
                >
                  <div className="text-[11px] text-primary">{next.date} →</div>
                  <div className="mt-1">{next.title}</div>
                </Link>
              )
            : <span />}
        </nav>
      </div>
    </section>
  );
}

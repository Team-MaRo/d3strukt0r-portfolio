// Fixed aurora background: three blurred radial-gradient blobs that drift, plus
// a masked grid overlay. All colours come from OKLCH runtime tokens via the
// `ta-blob-*` / `ta-grid` utilities (declared in `tailwind.css`) — no inline
// `style`. Sits behind everything (`-z-10`) and ignores pointer events.
export function TaBg() {
  return (
    <div aria-hidden className="ta-bg pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="ta-blob-1 absolute -top-60 -right-40 h-[640px] w-[640px] animate-ta-float rounded-full opacity-40 blur-[130px] dark:opacity-45" />
      <div className="ta-blob-2 absolute top-1/3 -left-48 h-[600px] w-[600px] animate-ta-float2 rounded-full opacity-35 blur-[140px] dark:opacity-40" />
      <div className="ta-blob-3 absolute -bottom-52 left-1/3 h-[560px] w-[560px] animate-ta-float rounded-full opacity-30 blur-[140px] dark:opacity-35" />
      <div className="ta-grid absolute inset-0 opacity-60" />
    </div>
  );
}

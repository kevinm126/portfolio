import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="font-mono text-7xl font-bold text-coral">404</p>
      <p className="text-lg text-muted">This page could not be found.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Back to profile
        </Link>
        <Link
          href="/portfolio"
          className="rounded-md border border-border bg-btn px-5 py-2.5 text-sm font-semibold text-fg transition hover:bg-btn-hover"
        >
          View portfolio
        </Link>
      </div>
    </div>
  );
}

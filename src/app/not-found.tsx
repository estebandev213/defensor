import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-center">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">404</p>
        <h1 className="mt-4 font-serif text-4xl text-ink">Esta página no existe.</h1>
        <Link href="/" className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-navy px-5 text-sm font-semibold text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass">Volver al inicio</Link>
      </div>
    </main>
  );
}

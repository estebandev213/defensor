"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es-PE">
      <body className="grid min-h-screen place-items-center bg-[#e7e9e4] px-6 text-center text-[#16253e]">
        <main className="max-w-md">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#a9843f]">Error de aplicación</p>
          <h1 className="mt-4 font-serif text-4xl">Vuelve a intentarlo.</h1>
          <p className="mt-4 text-base leading-7 text-[#4b5b72]">La aplicación encontró un problema inesperado.</p>
          <button type="button" onClick={reset} className="mt-7 min-h-11 rounded-xl bg-[#16253e] px-5 text-sm font-semibold text-[#fcfcfa]">Reintentar</button>
        </main>
      </body>
    </html>
  );
}

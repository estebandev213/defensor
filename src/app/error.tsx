"use client";

import { useEffect } from "react";
import { logger } from "@/server/security/logger";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error("ui_boundary_error", { digest: error.digest ?? "unknown-ui-error" });
  }, [error.digest]);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-center">
      <div className="max-w-md">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">Algo no salió como esperábamos</p>
        <h1 className="mt-4 font-serif text-4xl text-ink">Podemos intentarlo de nuevo.</h1>
        <p className="mt-4 text-base leading-7 text-navy-soft">No se muestran detalles técnicos para proteger tu información.</p>
        <button type="button" onClick={reset} className="mt-7 min-h-11 rounded-xl bg-navy px-5 text-sm font-semibold text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass">Reintentar</button>
      </div>
    </main>
  );
}

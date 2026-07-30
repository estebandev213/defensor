"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ showLabel = false, className = "" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const themeLabel = isDark ? "Oscuro" : "Claro";

  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-paper text-navy-soft transition hover:border-brass hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-background ${showLabel ? "gap-2 px-3" : "min-w-11"} ${className}`}
      aria-label={isDark ? "Activar tema claro" : "Activar tema oscuro"}
      title={isDark ? "Tema claro" : "Tema oscuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M20.1 15.2A8.5 8.5 0 0 1 8.8 3.9 8.5 8.5 0 1 0 20.1 15.2Z" />
        </svg>
      )}
      {showLabel ? <span className="text-center text-sm font-semibold">{themeLabel}</span> : null}
    </button>
  );
}

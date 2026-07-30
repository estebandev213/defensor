"use client";

import type { ChatReasoning } from "@/features/chat/types";
import { cn } from "@/lib/cn";

function StepIcon({ done }: { done: boolean }) {
  if (done) {
    return (
      <svg viewBox="0 0 24 24" className="size-4 text-verified" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <path d="m5 12.5 4.2 4.2L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <span aria-hidden="true" className="reasoning-active grid size-4 place-items-center">
      <span className="size-2 rounded-full bg-brass" />
    </span>
  );
}

function StepList({ reasoning }: { reasoning: ChatReasoning }) {
  return (
    <ol className="space-y-2">
      {reasoning.steps.map((step) => (
        <li key={step.id} className="flex items-start gap-2.5">
          <span className="mt-0.5 shrink-0">
            <StepIcon done={step.done} />
          </span>
          <span className={cn("min-w-0 leading-6", step.done ? "text-navy-soft" : "text-ink")}>
            {step.label}
            {step.detail ? <span className="text-muted"> · {step.detail}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Shows what the assistant is actually doing this turn while it works, then
 * collapses into a disclosure the person can reopen.
 */
export function ReasoningTrail({ reasoning, live }: { reasoning: ChatReasoning; live: boolean }) {
  if (reasoning.steps.length === 0 && !reasoning.understanding) return null;

  if (live) {
    return (
      <div
        className="rounded-2xl border border-border-soft bg-surface px-4 py-3.5 text-sm"
        role="status"
        aria-live="polite"
      >
        {reasoning.understanding ? (
          <p className="mb-3 border-b border-border-soft pb-3 leading-6 text-ink">{reasoning.understanding}</p>
        ) : null}
        <StepList reasoning={reasoning} />
      </div>
    );
  }

  return (
    <details className="group mb-3 text-sm">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg text-xs font-semibold text-muted transition hover:text-navy-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass">
        <span aria-hidden="true" className="transition-transform group-open:rotate-90">›</span>
        Ver cómo lo razoné
      </summary>
      <div className="mt-3 rounded-xl border border-border-soft bg-surface px-4 py-3">
        {reasoning.understanding ? (
          <p className="mb-3 border-b border-border-soft pb-3 leading-6 text-navy-soft">{reasoning.understanding}</p>
        ) : null}
        <StepList reasoning={reasoning} />
      </div>
    </details>
  );
}

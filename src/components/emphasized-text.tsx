import { Fragment } from "react";

/**
 * Renders the only markup the assistant is allowed to emit: `**bold**` around
 * the part of a sentence that matters. Everything else stays plain text, so
 * model output can never inject markup into the page.
 */
export function EmphasizedText({ text }: { text: string }) {
  const segments = text.split("**");
  if (segments.length < 3) return <>{text}</>;

  return (
    <>
      {segments.map((segment, index) =>
        index % 2 === 1 && segment.length > 0 ? (
          <strong key={index} className="font-semibold text-ink">
            {segment}
          </strong>
        ) : (
          <Fragment key={index}>{segment}</Fragment>
        ),
      )}
    </>
  );
}

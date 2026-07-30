"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";

interface TypingTextProps {
  phrases: readonly string[];
  className?: string;
}

export function nextTypedText(text: string, phrase: string, isDeleting: boolean): string {
  return isDeleting ? text.slice(0, -1) : phrase.slice(0, text.length + 1);
}

/**
 * Hands do not type at a metronome: they hesitate at word breaks and after
 * punctuation. Keying the pause off the character just typed keeps the rhythm
 * human without making the animation unpredictable.
 */
function keystrokeDelay(justTyped: string): number {
  if (justTyped === " ") return 150;
  if (justTyped === "," || justTyped === "?") return 210;
  return 72;
}

export function getTypingDelay(text: string, phrase: string, isDeleting: boolean): number {
  const isComplete = text === phrase;
  const isEmpty = text.length === 0;
  if (!isDeleting && isComplete) return 1_800;
  if (isEmpty && isDeleting) return 420;
  if (isDeleting) return 44;
  return keystrokeDelay(text.slice(-1));
}

/**
 * Types a phrase out, erases it, moves on to the next one.
 *
 * The animation runs for everyone, including people who asked their system to
 * reduce motion: this headline is the product's welcome and the client owns
 * that call. It also keeps render deterministic — reading a media query while
 * rendering made the server and client markup disagree, and React leaves a
 * mismatched attribute unpatched, which is what silently killed the effect.
 */
export function TypingText({ phrases, className }: TypingTextProps) {
  const validPhrases = useMemo(
    () => phrases.filter((phrase) => phrase.trim().length > 0),
    [phrases],
  );
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (validPhrases.length === 0) {
      setText("");
      return;
    }

    const phrase = validPhrases[phraseIndex % validPhrases.length] ?? "";
    const isComplete = text === phrase;
    const isEmpty = text.length === 0;
    const delay = getTypingDelay(text, phrase, isDeleting);

    const timer = setTimeout(() => {
      if (isComplete && !isDeleting) {
        setIsDeleting(true);
        return;
      }

      if (isEmpty && isDeleting) {
        setPhraseIndex((current) => (current + 1) % validPhrases.length);
        setIsDeleting(false);
        return;
      }

      setText(nextTypedText(text, phrase, isDeleting));
    }, delay);

    return () => clearTimeout(timer);
  }, [isDeleting, phraseIndex, text, validPhrases]);

  const caret = (
    <span
      className="typing-caret ml-[0.06em] inline-block h-[0.78em] w-[0.07em] translate-y-[0.06em] bg-brass"
      aria-hidden="true"
    />
  );

  // Plain inline flow, not flex: a flex container would treat the whole text as
  // one item and strand the caret beside the first line once the phrase wraps.
  // The last character and the caret share a nowrap span so the caret can never
  // be pushed onto a line of its own either.
  return (
    <span className={cn("inline", className)}>
      {text.slice(0, -1)}
      <span className="whitespace-nowrap">
        {text.slice(-1)}
        {caret}
      </span>
    </span>
  );
}

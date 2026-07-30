import { describe, expect, it } from "vitest";
import { getTypingDelay, nextTypedText } from "@/components/typing-text";

describe("typing text transitions", () => {
  it("adds one character while writing", () => {
    expect(nextTypedText("Cuéntame tu cas", "Cuéntame tu caso", false)).toBe("Cuéntame tu caso");
  });

  it("removes one character while deleting", () => {
    expect(nextTypedText("Cuéntame tu caso", "Cuéntame tu caso", true)).toBe("Cuéntame tu cas");
    expect(nextTypedText("Cuéntame tu cas", "Cuéntame tu caso", true)).toBe("Cuéntame tu ca");
  });

  it("starts deleting immediately after the completed pause", () => {
    expect(getTypingDelay("Cuéntame tu caso", "Cuéntame tu caso", false)).toBe(1_800);
    expect(getTypingDelay("Cuéntame tu caso", "Cuéntame tu caso", true)).toBe(44);
  });

  it("types at a steady pace but hesitates at word breaks and punctuation", () => {
    const phrase = "Cuéntame tu caso";

    expect(getTypingDelay("Cuént", phrase, false)).toBe(72);
    expect(getTypingDelay("Cuéntame ", phrase, false)).toBe(150);
    expect(getTypingDelay("¿Te despidieron?", "¿Te despidieron? Te ayudo", false)).toBe(210);
  });

  it("deletes faster than it types, then pauses before the next phrase", () => {
    expect(getTypingDelay("Cuéntame", "Cuéntame tu caso", true)).toBe(44);
    expect(getTypingDelay("", "Cuéntame tu caso", true)).toBe(420);
  });
});

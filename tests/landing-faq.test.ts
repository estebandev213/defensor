import { describe, expect, it } from "vitest";
import { createFaqStructuredData, landingFaqItems } from "@/features/landing/faq";

describe("landing FAQ", () => {
  it("keeps the visible answers aligned with FAQ structured data", () => {
    const structuredData = createFaqStructuredData();

    expect(landingFaqItems).toHaveLength(6);
    expect(structuredData["@type"]).toBe("FAQPage");
    expect(structuredData.mainEntity).toHaveLength(landingFaqItems.length);
    expect(structuredData.mainEntity.map((entry) => entry.name)).toEqual(
      landingFaqItems.map((item) => item.question),
    );
    expect(structuredData.mainEntity.map((entry) => entry.acceptedAnswer.text)).toEqual(
      landingFaqItems.map((item) => item.answer),
    );
  });

  it("states coverage, privacy and professional-advice limits explicitly", () => {
    const faqText = landingFaqItems.map(({ question, answer }) => `${question} ${answer}`).join(" ");

    expect(faqText).toContain("régimen laboral privado general");
    expect(faqText).toContain("no aparece en un historial persistente");
    expect(faqText).toContain("no sustituye una evaluación profesional");
    expect(faqText).not.toContain("100% confiable");
  });
});

import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EmphasizedText } from "@/components/emphasized-text";

function render(text: string): string {
  return renderToStaticMarkup(createElement(EmphasizedText, { text }));
}

describe("emphasized text", () => {
  it("bolds only what the assistant marked as important", () => {
    const html = render("Si el despido es arbitrario, **te corresponde una indemnización**.");

    expect(html).toContain("<strong");
    expect(html).toContain("te corresponde una indemnización");
    expect(html).not.toContain("**");
  });

  it("leaves plain text untouched", () => {
    expect(render("Entiendo, lamento que estés pasando por esto.")).not.toContain("<strong");
  });

  it("escapes markup so model output cannot inject into the page", () => {
    const html = render("Cuidado con <script>alert(1)</script> y **esto**.");

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

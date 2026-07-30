import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PublicFooter, PublicHeader } from "@/components/public-shell";
import { topicPages } from "@/lib/site";

describe("PublicHeader", () => {
  it("links the educational navigation to landing sections", () => {
    const html = renderToStaticMarkup(<PublicHeader />);

    expect(html).toContain('href="/#como-funciona"');
    expect(html).toContain('href="/#metodologia"');
    expect(html).toContain(">Metodología<");
  });
});

describe("PublicFooter", () => {
  it("exposes the consultation CTA and every public footer destination", () => {
    const html = renderToStaticMarkup(<PublicFooter />);

    expect(html).toContain('href="/chat"');
    expect(html).toContain('href="/#como-funciona"');
    expect(html).toContain('href="/#metodologia"');
    expect(html).toContain('href="/#temas-principales"');
    expect(html).toContain('href="/fuentes"');
    expect(html).toContain('href="/privacidad"');
    expect(html).toContain('href="/terminos"');

    topicPages.forEach((topic) => {
      expect(html).toContain(`href="/derechos-laborales/${topic.slug}"`);
    });
  });

  it("states the product limits without overstating its authority", () => {
    const html = renderToStaticMarkup(<PublicFooter />);

    expect(html).toContain("No sustituye la asesoría de un profesional.");
    expect(html).toContain("No es un servicio oficial");
    expect(html).toContain("Proyecto en versión beta");
  });
});

export interface LandingFaqItem {
  id: string;
  question: string;
  answer: string;
}

export const landingFaqItems = [
  {
    id: "coverage",
    question: "¿Qué temas laborales puedo consultar?",
    answer:
      "Esta versión se enfoca en el régimen laboral privado general: despido, CTS, gratificaciones, vacaciones, horas extras y contratos. Algunos regímenes especiales todavía no están cubiertos; si tu caso pertenece a uno, te lo indicaremos.",
  },
  {
    id: "evidence",
    question: "¿Cómo se respalda una respuesta?",
    answer:
      "Defensor busca información en un catálogo de fuentes oficiales verificadas y muestra las citas que realmente sustentan la orientación. Si la evidencia no es suficiente o su vigencia no está clara, no completa la respuesta con suposiciones.",
  },
  {
    id: "missing-information",
    question: "¿Qué ocurre si faltan datos sobre mi caso?",
    answer:
      "Te pediremos solo el dato que pueda cambiar materialmente la orientación, como el tipo de contrato, el régimen laboral o la fecha de cese. Conocer ese contexto ayuda a evitar conclusiones apresuradas.",
  },
  {
    id: "privacy",
    question: "¿Se guarda mi conversación?",
    answer:
      "La conversación es anónima y temporal: se mantiene durante la sesión del navegador y no aparece en un historial persistente. Evita compartir DNI, direcciones, teléfonos, nombres completos o documentos confidenciales.",
  },
  {
    id: "professional-advice",
    question: "¿Defensor reemplaza a un abogado?",
    answer:
      "No. Defensor ofrece orientación informativa para ayudarte a entender tu situación y preparar tus próximos pasos. No representa al usuario, no garantiza resultados y no sustituye una evaluación profesional de tu caso.",
  },
  {
    id: "outside-coverage",
    question: "¿Qué pasa si mi consulta está fuera de cobertura?",
    answer:
      "Te lo diremos de forma directa. Cuando el tema requiera otra especialidad, un régimen no cubierto o una evaluación personalizada de alto riesgo, te sugeriremos acudir a la entidad oficial o al profesional adecuado.",
  },
] as const satisfies readonly LandingFaqItem[];

export function createFaqStructuredData(items: readonly LandingFaqItem[] = landingFaqItems) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

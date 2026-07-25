import { env } from "@/server/security/env";

export const siteConfig = {
  name: "Defensor",
  title: "Defensor — Orientación laboral del Perú",
  description:
    "Entiende tus derechos laborales con orientación clara y fuentes oficiales del Perú.",
  url: env.APP_URL,
} as const;

export const topicPages = [
  {
    slug: "despido",
    title: "Despido",
    description:
      "Qué información conviene ordenar cuando termina una relación laboral.",
    facts: [
      "Fecha de ingreso y fecha de término comunicada.",
      "Tipo de contrato y régimen que aplicaba.",
      "Comunicación recibida y documentos de la relación laboral.",
    ],
  },
  {
    slug: "cts",
    title: "CTS",
    description:
      "Una guía para identificar los datos que pueden ser relevantes al revisar la CTS.",
    facts: [
      "Periodo trabajado y fechas de los depósitos revisados.",
      "Remuneración y conceptos que aparecen en tus boletas.",
      "Régimen laboral y tamaño o registro de la empresa.",
    ],
  },
  {
    slug: "gratificaciones",
    title: "Gratificaciones",
    description:
      "Ordena tu consulta y distingue los hechos que deben verificarse.",
    facts: [
      "Periodo en que trabajaste y continuidad de la relación laboral.",
      "Boletas, pagos recibidos y conceptos remunerativos.",
      "Régimen laboral aplicable durante el periodo consultado.",
    ],
  },
  {
    slug: "vacaciones",
    title: "Vacaciones",
    description:
      "Qué datos reunir para revisar vacaciones gozadas, pendientes o truncas.",
    facts: [
      "Fechas de ingreso, cese y periodos de descanso.",
      "Constancias, boletas o comunicaciones sobre vacaciones.",
      "Régimen y modalidad de contratación.",
    ],
  },
  {
    slug: "horas-extras",
    title: "Horas extras",
    description:
      "Prepara una consulta sobre jornada, horas trabajadas y documentos disponibles.",
    facts: [
      "Jornada pactada y horario realmente realizado.",
      "Fechas, turnos o registros que permitan ordenar las horas.",
      "Boletas, mensajes o controles de asistencia disponibles.",
    ],
  },
] as const;

export type TopicPage = (typeof topicPages)[number];

export const publicPaths = [
  "/",
  "/como-funciona",
  "/metodologia",
  "/fuentes",
  "/derechos-laborales",
  "/derechos-laborales/despido",
  "/derechos-laborales/cts",
  "/derechos-laborales/gratificaciones",
  "/derechos-laborales/vacaciones",
  "/derechos-laborales/horas-extras",
  "/privacidad",
  "/terminos",
] as const;

export function getTopicPage(slug: string): TopicPage | undefined {
  return topicPages.find((topic) => topic.slug === slug);
}

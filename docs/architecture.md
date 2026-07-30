# Arquitectura de Foundation

## Principios

Defensor separa la experiencia visual, las utilidades compartidas y las futuras capacidades de servidor. En Foundation, las integraciones externas son explícitamente inexistentes: no se conectan LLM, base de datos, corpus legal, embeddings ni retrieval.

## Capas iniciales

```text
src/app          composición de rutas, metadata, boundaries y healthcheck
src/components   piezas visuales accesibles y reutilizables
src/features     límites por dominio de producto, todavía sin lógica externa
src/server       configuración, seguridad, telemetría y futuros adaptadores
src/db           reservado para persistencia de Fase 2
src/lib          utilidades sin estado y contratos compartidos
src/styles       tokens y estilos globales
```

Los componentes de presentación no acceden directamente a `process.env`. La configuración se valida en `src/server/security/env.ts` mediante Zod y el logger de `src/server/security/logger.ts` solo acepta metadatos seguros y elimina claves sensibles.

## Flujo de Foundation

```text
Rutas Next.js
  -> componentes de shell
  -> estado local de tema y drawer
  -> ningún proveedor externo

GET /api/health
  -> configuración mínima validada
  -> respuesta de proceso vivo
```

## Flujo conversacional de `/api/chat`

Cada turno hace dos llamadas al LLM con roles separados. El planificador decide
cómo sigue la conversación pero nunca afirma derecho; el generador redacta la
orientación y siempre pasa por el gate de evidencia y el validador de citas.

```text
classifyQuery            pre-filtro determinista, puede vetar al planificador
  -> planTurn            converse | ask | research, extrae caseProfile y searchQueries
  -> applySafetyVeto     emergencia / fuera de alcance / una sola pregunta por turno
  -> retrieveEvidence    solo en "research", con searchQueries autocontenidas
  -> evaluateEvidence    decide responder, aclarar o abstenerse
  -> buildLegalAnswer    prosa conversacional con bloques isLegalClaim
  -> validateCitations   autoridad final: sin respaldo, no se muestra
```

Tres barreras deterministas acotan al planificador, y ninguna depende de que el
modelo se comporte:

- `isVetoed`: emergencia o tema no laboral saltan el planificador y la
  recuperación por completo; el turno termina en abstención.
- `containsLegalAssertion`: si el texto conversacional del planificador se
  desliza hacia una afirmación legal, el turno se reencamina a `research` para
  que pase por el gate de evidencia.
- `MAX_CONSECUTIVE_QUESTIONS`: el contador `questionsAsked` lo escribe el
  servidor, no el modelo. Tras dos preguntas seguidas se responde con lo que
  hay, y se reinicia al investigar.

El único formato que puede emitir el modelo es `**negrita**`, que
`EmphasizedText` convierte en `<strong>`; cualquier otro marcado se muestra
como texto plano y nunca se inyecta en la página.

La respuesta viaja como SSE con eventos tipados que se emiten a medida que el
pipeline avanza:

```text
{ type: "stage",         id, label, state, detail? }
{ type: "understanding", text }
{ type: "answer",        answerId, answer, citations, caseProfile, reasoning }
{ type: "error",         code }
data: [DONE]
```

Las etiquetas de `stage` provienen del plan real del turno, no son decorativas.
El texto legal se emite únicamente después de `validateCitations`, así que el
usuario nunca ve afirmaciones sin verificar.

La memoria del caso vive en el cliente: el servidor devuelve `caseProfile` y el
cliente lo reenvía en el siguiente turno. El servidor sigue sin estado y
revalida ese perfil en cada request; nunca se usa como fuente de afirmaciones
legales, solo para filtrar la búsqueda y evitar repreguntar lo ya respondido.

El healthcheck no ejecuta llamadas costosas. La comprobación de base de datos queda representada como `not_configured` mientras Fase 2 no haya comenzado.

## UI y accesibilidad

La experiencia escala desde mobile: el sidebar se convierte en drawer, el panel de fuentes permanece vacío y no aparece como panel permanente en pantallas pequeñas. Los targets interactivos tienen al menos 44px, existe foco visible, labels semánticos y soporte para `prefers-reduced-motion`.

## Límites deliberados

- No hay sesión, autenticación ni historial.
- Nueva conversación solo reinicia el shell local; no almacena mensajes.
- Los temas populares son navegación visual preparada para fases posteriores y no ejecutan consultas.
- Las fuentes se muestran como estado vacío, sin inventar normas ni enlaces legales.
- El disclaimer aclara que la interfaz no sustituye asesoría profesional.

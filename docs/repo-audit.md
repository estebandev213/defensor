# Auditoría del repositorio

Fecha: 2026-07-27

## Estado actual

Defensor ya cuenta con una aplicación Next.js 15 con App Router, TypeScript estricto, Tailwind, rutas públicas, chat anónimo, pipeline de seguridad/RAG, validación de citas, migraciones, tests unitarios y un smoke test E2E. La pantalla `/chat` ya contiene el estado vacío, composer, preguntas sugeridas, sidebar y panel de fuentes.

## Comparación con la especificación

- Fundación: configurada mediante `src/server/security/env.ts`, tokens en `src/styles/globals.css`, layout global, manejo de error y health check.
- Chat: implementado con estado reducer, transporte de streaming, feedback, estados de error, nueva conversación y drawer/panel de fuentes.
- Corpus/RAG: existen esquema, corpus seed, scripts de ingesta, tipos de retrieval, RRF y deduplicación.
- Seguridad: existen rate limiting, sanitización PII, headers, timeouts, logger seguro y códigos de error.
- SEO/páginas públicas: existen metadata, sitemap, robots, metodología, fuentes, privacidad, términos y páginas de derechos laborales.
- Verificación: hay tests para seguridad, providers, retrieval, API, estado del chat, SEO, migraciones, corpus y evaluación.

## Hallazgo relevante para esta tarea

La pantalla de chat existente es funcional y visualmente cercana a la referencia, pero mantiene una composición de producto completo con sidebar y header. La referencia solicitada muestra el estado vacío central como una experiencia enfocada: marca centrada, mensaje hero, aviso de fuentes oficiales, tres ejemplos y composer amplio. El trabajo de esta fase se limita a afinar ese estado visual sin ampliar el alcance V1 ni alterar el pipeline legal.

## Riesgos y pendientes fuera de alcance

- El repositorio contiene cambios locales previos en varios archivos; se preservan y solo se toca lo necesario para esta pantalla.
- La validación visual requiere levantar Next.js y revisar desktop/mobile en navegador.
- No se agregan datos legales, autenticación, historial persistente ni features excluidas por la especificación.

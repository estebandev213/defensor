# ADR 001: límites de Foundation

## Decisión

La Fase 1 entregará una aplicación Next.js navegable y visualmente coherente, pero sin integraciones de datos o AI. Se usarán componentes de cliente únicamente para interacción local: selector de tema, apertura del drawer y reinicio visual de la conversación.

## Motivo

El producto exige gates por fase. Separar el shell de las futuras capacidades legal/RAG evita persistencia accidental, datos legales hardcodeados y dependencias de proveedores antes de definir el modelo de datos de Fase 2.

## Consecuencias

- El panel de fuentes inicia vacío y comunica ese estado de forma honesta.
- Los controles visuales no simulan llamadas al backend.
- El healthcheck reporta la base de datos como no configurada hasta que exista la capa de datos.
- Las próximas fases podrán sustituir adaptadores sin modificar el layout base.

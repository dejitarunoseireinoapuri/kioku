# Secuencia de implementación

| Fase | Entrega y aceptación antes de seguir |
| --- | --- |
| D0 · Base documental | AGENTS, mapa, requisitos/ADR/seguridad/calidad y comprobación de integridad; esta entrega |
| K0 · Base KMP | Catálogo/wrappers verificados, hosts Android/iOS, DI, navegación y diseño B mínimos; quality gates reales y una prueba compartida significativa |
| K1 · Identidad y configuración | UC-001/002; entorno aislado, cuenta autorizada, clave privada, aislamiento probado; nada de recuerdos reales aún |
| K2 · Memoria escrita | UC-003/004 por texto; separar/guardar/aclarar, versiones e idempotencia backend; tests de reglas y dominio |
| K3 · Recuperación | UC-005; corpus ficticio y evaluación de paráfrasis/contexto/fechas/evidencia; elección concreta de búsqueda y modelos |
| K4 · Control conversacional | UC-006/007/008; aceptación, corrección, olvido de fuentes/derivados y jobs concurrentes probados |
| K5 · Voz | Micrófono nativo, hold/lock/cancel, transcripción temporal, lectura de respuesta, accesibilidad y pruebas Android/iOS |
| K6 · Uso personal | Recuperación en otro móvil, errores/interrupciones, coste, seguridad y limpieza; autorizar entorno de datos reales |
| Posterior | Integraciones con calendario/recordatorios o distribución, solo si se solicitan |

La UI puede desarrollarse con fakes del contrato mientras se valida cada capa, pero una demo fake no cierra una fase conectada. La autoridad de las mutaciones se implementa en backend antes de presentar un cliente que las dé por hechas.

Cada fase concreta sus issues, decisiones previas, pruebas y evidencia al comenzar. No crear docenas de tickets ni marcar fases implementadas por tener esta tabla.

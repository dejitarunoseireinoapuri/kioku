# ADR-003 · Firebase y autoridad de servidor

- Estado: aceptada; provisión y despliegue pendientes.
- Fecha: 2026-11-11.

Firestore es la opción indicada por el propietario para conservar y recuperar memoria. Se adopta la frontera de Wonderdrop: Authentication y adaptadores nativos oficiales; Cloud Functions v2 TypeScript para operaciones protegidas; reglas deny-by-default y App Check antes de uso remoto distribuido.

Ninguna app escribe directamente fuentes canónicas, recuerdos, propuestas aceptadas, revisiones, índices o credenciales. El backend autoriza cada operación, incluye concurrencia/versiones e idempotencia y verifica de nuevo los reintentos. Las lecturas privadas se sirven inicialmente mediante contrato protegido para aplicar filtros y revocación de forma uniforme.

Entornos separados y recursos europeos como dirección operativa heredada, con región/proyectos concretos pendientes. No copiar identificadores, cuentas, secretos ni excepciones de Development de Wonderdrop.

Storage temporal se habilitará solo si el transporte de voz lo necesita; no representa un archivo de audios. Messaging, compras, moderación, panel admin, Analytics, Crashlytics y Remote Config no se incorporan automáticamente por existir en el proyecto de referencia.

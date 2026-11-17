# Decisiones de arquitectura

Una decisión aceptada define la dirección de implementación, no afirma que esté construida o desplegada. Fecha de esta base: 2026-11-11.

| ADR | Estado | Decisión |
| --- | --- | --- |
| [ADR-001](ADR-001-platform-strategy.md) | Aceptada | KMP y Compose Multiplatform; retira Expo |
| [ADR-002](ADR-002-clean-architecture.md) | Aceptada | MVVM, Clean Architecture y módulos pragmáticos |
| [ADR-003](ADR-003-backend-boundary.md) | Aceptada | Firebase y mutaciones protegidas en servidor |
| [ADR-004](ADR-004-credentials-and-audio.md) | Aceptada para diseño | Clave propia separada y audio transitorio |
| [ADR-005](ADR-005-memory-evidence-and-deletion.md) | Aceptada para diseño | Evidencia, versiones, recuperación y olvido coherente |
| [ADR-006](ADR-006-k0-toolchain.md) | Implementada; iOS pendiente | Base móvil, catálogo fijado, Navigation 3 y controles de calidad |
| [ADR-007](ADR-007-private-google-account.md) | Aceptada; frontera local inicial | Google personal, UID vinculado, proyecto remoto único y emuladores aislados |
| [ADR-008](ADR-008-k1-native-access-and-credentials.md) | Android/emuladores comprobados; remoto/iOS pendientes | Acceso nativo, sesiones aisladas y configuración de clave administrativa |
| [ADR-009](ADR-009-text-capture.md) | Integrada en main; Android aceptado, iOS pendiente | Núcleo M0 compartido, captura textual transaccional, aclaración e idempotencia |
| [ADR-010](ADR-010-text-query.md) | Implementada y activada; aceptación móvil pendiente | Consulta híbrida, evidencia vigente y preguntas solo de sesión |
| [ADR-011](ADR-011-memory-control.md) | Control conversacional y olvido entre relatos activos y aceptados en Honor; iOS pendiente | Revocación, cambios selectivos, tickets y retirada conjunta de copias |
| [ADR-012](ADR-012-independent-memory-units.md) | P1–P3 aceptadas; motor R1 ficticio probado, integración pendiente | Unidades con identidad estable, evidencia segmentada y cambios deterministas; sustituye la dirección de ADR-005/011 |
| [ADR-013](ADR-013-memory-v2-app-integration.md) | Activada y comprobada en Honor sin inferencia; iOS pendiente | Callable v2, documentos separados, identidades estables y arranque vacío autorizado |
| [ADR-014](ADR-014-local-voice-input.md) | Android con fixtures; iOS pendiente | Transcripción local, mantener/bloquear y respuestas escritas |

Una nueva ADR recoge contexto, decisión, alternativas, consecuencias y estado. No copiar la numeración ni las decisiones de regalos/comercio de Wonderdrop. No modificar retroactivamente una decisión incompatible: sustituirla con otra que la cite.

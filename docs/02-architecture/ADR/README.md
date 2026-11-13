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

Una nueva ADR recoge contexto, decisión, alternativas, consecuencias y estado. No copiar la numeración ni las decisiones de regalos/comercio de Wonderdrop. No modificar retroactivamente una decisión incompatible: sustituirla con otra que la cite.

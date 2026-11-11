# Errores y resultados

`KiokuError` será un modelo sellado portable: `Validation`, `Unauthenticated`, `Forbidden`, `NotConfigured`, `Offline`, `TemporarilyUnavailable`, `Conflict`, `LimitReached`, `ProviderUnavailable`, `Unexpected`. `InsufficientEvidence` y `NeedsClarification` son resultados de negocio, no fallos técnicos.

Mapear excepciones una vez al cruzar Data/backend. No mostrar respuestas crudas de OpenAI/Firebase, cabeceras, correos, tokens, transcripciones o rutas internas en errores públicos.

UI conserva el contexto útil y distingue entre no guardado, guardado y resultado incierto que necesita recuperar estado de operación. Solo ofrecer reintento idempotente. Un timeout no demuestra que no hubo commit ni que el proveedor no cobró.

No reintentar automáticamente denegaciones, validación, clave inválida o correcciones con versión obsoleta. Las lecturas reintentables tendrán presupuesto y deadline acotados, definidos y probados en la fase técnica. No usar bucles infinitos ni sleeps arbitrarios.

Si OpenAI agota saldo, informar del servicio de IA no disponible y de la configuración pertinente; no cambiar silenciosamente a otra clave, cuenta o modelo más caro. Cancelar un turno impide guardar su resultado tardío aunque una llamada externa no pueda cancelarse ya.

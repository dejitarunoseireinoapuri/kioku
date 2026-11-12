# Modelo lógico de datos

Contrato de diseño, no colecciones desplegadas. Cada documento está bajo identidad de propietario verificada por servidor. Los IDs son opacos; ningún nombre o dato privado aparece en una ruta.

| Entidad | Contenido mínimo | Garantía |
| --- | --- | --- |
| Account | UID, estado y configuración no secreta necesaria | Sin perfil social ni copia innecesaria del correo de Auth |
| Source | Texto original y fragmentos, canal, receivedAt servidor, contexto temporal/zone | Conserva procedencia sin archivo permanente de audio |
| Memory | sourceId/segmentIds, contenido normalizado, kind, contexto, revision, estado | Distingue hecho relatado, deseo, opinión y pensamiento |
| Clarification | operación, fragmento/contexto pendiente, pregunta, versión/expiración | No figura aún como memoria confirmada |
| Proposal | afirmación propuesta, evidencia del turno, operación y estado pendiente/aceptado/rechazado | No recuperable como hecho antes de aceptar |
| Search projection | memoryId, owner, revision y derivados acotados | No evidencia independiente; siempre se reautoriza contra el canónico |
| Operation receipt | requestId, actor, operación, hash de entrada seguro, estado y referencias mínimas | Sin copias innecesarias del relato ni clave |
| Credential metadata | referencia privada, estado, fecha de actualización | Nunca el secreto en Firestore o respuesta cliente |

Fechas del evento pueden ser intervalo, referencia contextual o fecha desconocida; no forzar un instante inventado. `receivedAt` no sustituye `occurredAt`. Una relación con Gemma no inventa que viajó ni la fecha del viaje.

Los historiales de preguntas son contexto de sesión por defecto; conservarlos como hechos exige Contar o aceptar una propuesta. La retención operativa se delimita en [STORAGE_POLICY](STORAGE_POLICY.md).

El backend define el esquema físico e índices con tests de aislamiento, revisión y borrado antes de desplegar. No leer primero un índice global para filtrar propietarios después.

## Precisión y procedencia en M0 v2

El prototipo distingue `personal`, `reported` y `quoted`, con atribución de persona/documento y estado `current`, `historical` o `superseded`. El texto citado no establece por sí mismo datos propios del usuario. Una intención sigue sin demostrar su realización; una corrección y una evolución conservan sus contextos distintos.

La fecha incluye precisión `unknown`, `day`, `month`, `year`, `month_day` o `interval`, valor, final opcional y fragmento literal de evidencia. Un cumpleaños sin año conserva `--MM-DD`; un mes no se transforma en su día 1. El normalizador solo reduce precisión a lo respaldado por el texto literal y verifica las fechas relativas contra recepción/zona. No añade información ausente.

La recuperación aporta los fragmentos candidatos y sus relatos completos vigentes, incluidas aclaraciones, dentro de un presupuesto acotado de contexto. Así se preserva identidad y relación entre fragmentos de una misma fuente. Una fuente olvidada no puede entrar en ese contexto.

Snapshots sintéticos M0 v2: versión 2 y carpeta interactiva separada. Los snapshots v1 se conservan y se rechazan expresamente, sin reinterpretación o borrado automático. No es una migración desplegada de Firestore ni una base offline del cliente.

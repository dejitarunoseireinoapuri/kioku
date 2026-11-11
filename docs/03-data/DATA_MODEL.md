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

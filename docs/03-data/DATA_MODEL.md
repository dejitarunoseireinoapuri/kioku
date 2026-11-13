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

El modelo portable `MemorySource` conserva además el `receivedAt` ISO completo recibido del servidor. La pantalla del original lo presenta como «Lo contaste el…», con formato `dd/MM/aaaa` y zona horaria actual del dispositivo, incluyendo el desplazamiento aplicable en aquel instante. No se cambia el valor persistido ni se interpreta una fecha del relato como fecha de recepción. `recordedOn` permanece como compatibilidad de fixtures anteriores; las lecturas reales y el resultado de guardado conservan siempre el instante completo para evitar truncar un día UTC antes de convertirlo.

Los historiales de preguntas son contexto de sesión por defecto; conservarlos como hechos exige Contar o aceptar una propuesta. La retención operativa se delimita en [STORAGE_POLICY](STORAGE_POLICY.md).

El backend define el esquema físico e índices con tests de aislamiento, revisión y borrado antes de desplegar. No leer primero un índice global para filtrar propietarios después.

## Persistencia K2 · Captura textual

Esquema implementado según [ADR-009](../02-architecture/ADR/ADR-009-text-capture.md); activación y comprobaciones reales en [K2_VALIDATION](../09-planning/K2_VALIDATION.md). Todas las rutas siguientes pertenecen al UID del token verificado y siguen denegadas a clientes por reglas:

| Ruta | Contenido y ciclo de vida |
| --- | --- |
| `accounts/{uid}/sources/{uuid}` | Fuente original, `receivedAt` de servidor, zona, digest con ID aleatorio y número de fragmentos. Puede incluir aclaraciones distinguidas. Sin TTL |
| `accounts/{uid}/memories/{sourceUuid-n}` | Fragmento M0 v4, evidencia/precisión/procedencia/estado, revisión 1, sourceId y embedding de 512 dimensiones. Sin TTL |
| `accounts/{uid}/operations/{requestUuid}` | Estado, digest, nonce, intentos y resultado mínimo. Contexto pendiente solo durante captura/aclaración/fallo; se retira al completar o pasar a una continuación. TTL 24 h para pendientes y siete días para recibos terminales |
| `accounts/{uid}/runtime/capture` | Nonce y vencimiento de la concesión de trabajo; sin contenido personal |
| `accounts/{uid}/usage/{diaUTC}` | Reservas/coste estimado conservador, llamadas y contadores de tokens. Sin relatos/preguntas; TTL 30 días |

No se guarda el snapshot completo del prototipo ni se mantiene una base de memoria en el móvil. La extracción se prepara en RAM del servidor; fuente, fragmentos y recibo terminal se confirman atómicamente. Un trabajador obsoleto no puede confirmar con otro nonce. Aclarar conserva el ID de fuente y la referencia temporal original; el nuevo requestId continúa la operación anterior. Un pendiente no participa en búsquedas.

Solo `operations` y `usage` usan el campo de caducidad TTL. Se excluyen texto y vectores de índices automáticos innecesarios; no se crea un índice global de propietarios. La consulta semántica definitiva se concretará en K3. Los historiales de preguntas siguen fuera del almacén canónico.

## Proyecciones y consultas K3

Según [ADR-010](../02-architecture/ADR/ADR-010-text-query.md), los fragmentos añaden `searchSchema:1`, `searchVector` nativo de 512 dimensiones y `searchTerms` acotados. Se derivan del canónico; no crean hechos ni reemplazan su revisión. Un índice vectorial de alcance de colección permite consultas bajo `accounts/{uid}/memories`, nunca una lectura global para filtrar propietarios después. La preparación de recuerdos anteriores es aditiva con precondición de versión; `privateConfiguration/search` liga UID, esquema y preparación completa. La consulta falla cerrada antes de prepararlos, en lugar de ignorarlos.

Los recibos K3 reutilizan `accounts/{uid}/operations/{UUID}` con `kind:query`, digest salado por UID/UUID/entrada, estado processing/finished/failed, nonce, intentos y TTL de 24 h. No contienen preguntas, aclaraciones, respuestas o copias de fuentes. La concesión numérica compartida está en `runtime/capture`. `getOperation` de K2 conserva su contrato de captura, no devuelve conversaciones K3. El contexto de aclaración de preguntas vive exclusivamente en RAM del móvil y de la petición.

Antes de entregar una respuesta, se comprueba de nuevo la versión exacta de los fragmentos y fuentes usados, además de identidad/propietario/concesión. Abrir el original lo lee otra vez del canónico autorizado. Los índices no autorizan respuestas por sí mismos; K4 deberá retirar proyecciones al modificar/olvidar.

## Frontera privada K1

`privateConfiguration/owner` contiene exactamente `uid`, `enabled`, `window` (minuto de servidor) y `count` (1–30). Es una vinculación privada inmutable de propietario, más admisión acotada, no un perfil ni una credencial. No guarda correo, texto, clave, token o historial. El servidor vincula el primer UID autorizado mediante transacción; otra identidad o una configuración inválida falla cerrada. El cliente tiene lectura/escritura denegadas, incluida esta ruta. Probado con fixtures y propietario real vinculado tras Google/App Check válidos.

La integración K1 añade `privateConfiguration/ai`: `uid`, `revision` positiva, `secretVersion` numérica de `kioku-openai-owner` en el proyecto permitido, `operationId` UUID y `updatedAtMs` de servidor. Lectura/activación reautorizan propietario habilitado. La revisión se cambia mediante transacción, sin llamadas OpenAI o Secret Manager dentro del callback. No guarda clave, prefijo, hash o copia del payload. El cliente recibe únicamente estado y revisión; las reglas deniegan acceso directo a ambos documentos. Pruebas ficticias de CAS/rechazos y alta real personal completada, revisión 1.

## Precisión y procedencia en M0 v2

El prototipo distingue `personal`, `reported` y `quoted`, con atribución de persona/documento y estado `current`, `historical` o `superseded`. El texto citado no establece por sí mismo datos propios del usuario. Una intención sigue sin demostrar su realización; una corrección y una evolución conservan sus contextos distintos.

La fecha incluye precisión `unknown`, `day`, `month`, `year`, `month_day` o `interval`, valor, final opcional y fragmento literal de evidencia. Un cumpleaños sin año conserva `--MM-DD`; un mes no se transforma en su día 1. El normalizador solo reduce precisión a lo respaldado por el texto literal y verifica las fechas relativas contra recepción/zona. No añade información ausente.

La recuperación aporta los fragmentos candidatos y sus relatos completos vigentes, incluidas aclaraciones, dentro de un presupuesto acotado de contexto. Así se preserva identidad y relación entre fragmentos de una misma fuente. Una fuente olvidada no puede entrar en ese contexto.

Snapshots sintéticos M0 v2: versión 2 y carpeta interactiva separada. Los snapshots v1 se conservan y se rechazan expresamente, sin reinterpretación o borrado automático. No es una migración desplegada de Firestore ni una base offline del cliente.

## Revisión de captura en M0 v3

Cada atribución identificada incluye `attributionEvidence`, un fragmento literal que contiene el nombre/relación exactos del informante o documento. `personal` significa afirmación directa del propietario, también acerca de terceros, y lleva atribución/evidencia nulas. Ser sujeto de una frase no implica ser su informante. Un segundo paso explícito de revisión contrasta la extracción y sus metadatos con el relato; no es una aceptación independiente ni una garantía de fidelidad.

`eventStatus` distingue `unspecified`, `planned`, `completed` y `not_completed`, separado de `kind` y `lifecycle`. El hecho de que haya una cita/examen agendados no prueba su celebración. El estado de no realizado requiere una negación explícita, no ausencia de evidencia.

Los snapshots sintéticos actuales son versión 3, en una carpeta interactiva nueva. Las versiones 1/2 permanecen intactas y se rechazan antes de reinterpretarse; todavía no se necesita ni se ejecuta una migración de datos personales.


## Contrato de citas M0 v4

Un recuerdo quoted describe contenido textual, nunca la ejecución de una orden ni la veracidad de lo que afirma. El código materializa su literal con eventStatus unspecified y time unknown (valor, final y evidencia temporal nulos). Si se conserva una lectura realizada en una fecha, ese es otro hecho personal y mantiene su propia evidencia. No se proyecta la fecha mencionada por un texto citado como fecha de un evento real.

Snapshot 4 y carpeta interactiva nueva; se rechazan y preservan versiones 1/2/3 sin migración de datos personales. El repositorio valida estas invariantes al cargar y guardar. Las respuestas seleccionan evidenceIds de candidatos vigentes permitidos; el servidor deriva sourceIds, sin adjuntar automáticamente todos los recuerdos de la fuente. El alcance memory/quotation/mixed es metadato efímero de generación/verificación, no un nuevo modo de usuario ni un dato de la memoria.


El estado se aplica al acontecimiento que registra el fragmento: una recomendación ya comunicada es un acto completado; no implica que el destinatario haya seguido el consejo o leído el libro. Una fecha de agenda sigue describiendo el evento previsto, no una comunicación completada ni asistencia.


Origen y estado son independientes: las recomendaciones/sugerencias recibidas conservan reported y su autor aunque su recepción sea un acto completed. Un dato propio que el usuario comunicó a otra persona sigue siendo personal; el destinatario no se convierte en informante.

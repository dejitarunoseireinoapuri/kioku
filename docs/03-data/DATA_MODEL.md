# Modelo lógico de datos

Refinamiento local R2: `time` representa fecha del evento/cambio, no el inicio inferido de un estado observado. Una preferencia «ahora» sin comienzo explícito conserva `time:unknown` y su marcador literal; registro y evento siguen separados. En enumeraciones se comparte el predicado común sin cantidades/atributos exclusivos. La vista enviada a consultas agrupa fragmentos actuales por unidad/fuente, con literal, rol, calendario y marca de ancla temporal; omite IDs, posiciones y longitud del origen. Es una proyección efímera, no cambia `Snapshot` ni borra metadatos del motor. [Validación de fiabilidad](../09-planning/R2_RELIABILITY_VALIDATION.md).

Prototipo R2: `Draft.interventions` opcional contiene hasta cuatro rangos consecutivos con `recordedAt` y `zone` aportados por la admisión confiable. Genera fuentes distintas, fragmentos con posiciones locales y ocurrencias por fuente/unidad; no es un campo que el modelo o cliente puedan usar para elegir fechas de servidor. Un ancla temporal no cruza fuentes. La búsqueda paginada indexa términos del canónico y fragmentos vigentes con ID/revisión, cuenta/época y cobertura; no crea colecciones nuevas. [Contrato y límites](../09-planning/R2_INDEXED_VALIDATION.md).

**Modelo v2 aceptado, sin migrar:** [MEMORY_CORE_V2](../02-architecture/MEMORY_CORE_V2.md) define identidad estable, ocurrencias de evidencia, fuentes segmentadas, dependencias y membresías versionadas. [R1](../09-planning/R1_VALIDATION.md) lo implementa en RAM; las colecciones activas siguientes no cambian. La disposición física definitiva y migración quedan sujetas a R3–R5 y su autorización.

Tipos ejecutables del prototipo: [model.ts](../../prototypes/memory-core/src/model.ts) y [contracts.ts](../../prototypes/memory-core/src/contracts.ts). `SourceEnvelope` no lleva texto; `Fragment` contiene literal y posiciones UTF-16, rol y propietarios. `Unit` tiene ID/revisión estable, contenido, fecha y `timeEvidenceId`; sus ocurrencias/repeticiones referencian fragmentos por fuente. Corrección conserva identidad y soporte temporal no editado; enriquecimiento temporal compatible conserva soportes anteriores. Relaciones, proyecciones, admisiones/recibos y revocaciones tienen propiedad explícita. Los snapshots RAM `schemaVersion:2` no son compatibles con snapshots M0 v2 ni una nueva colección desplegada.

Refinamiento R2 de edición parcial: `correct.retainedEvidence` identifica rangos literales de fragmentos actuales de la unidad objetivo. El motor conserva sus posiciones, fuente, fecha y zona originales, divide la propiedad cuando un contexto es compartido y retira todos los demás soportes de esa identidad. Una ficha normalizada no sustituye evidencia perdida; no se genera una cita de reemplazo a partir del resumen. Conservar una fecha conocida exige incluir explícitamente su ancla. Una partición que afectaría el ancla temporal de otro recuerdo se rechaza sin cambios hasta resolver el alcance. Los rangos y planes viven en RAM y no crean un archivo histórico; el olvido posterior elimina también los fragmentos retenidos.

Refinamiento activo de escritura/corrección: las variantes temporales sin diacríticos se comparan contra vocabulario conocido sin normalizar ni inventar el literal almacenado. Una interpretación rechazada no crea fuentes o recuerdos; puede generar un pendiente de aclaración con el TTL existente. La última reformulación explícita sustituye el fragmento erróneo en los hechos, conservando el relato de procedencia. Al corregir una cita compartida, solo pueden acotarse quote/time.quote/attributionEvidence a subcadenas exactas; texto, fecha, autor, vector y demás metadatos del recuerdo conservado permanecen iguales, con la revisión habitual. La prueba interna de separación vive en RAM, no en un campo nuevo ni en historial; no cambia snapshot 4 ni los índices.

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

El comando portable de consulta lleva la pregunta actual y hasta cuatro preguntas previas completadas, sin respuestas generadas. Este campo vive en la sesión y en la petición transitoria; no crea una colección ni modifica recuerdos/fuentes. Permite retomar el tema de una pregunta que devolvió ausencia. El texto completo enviado sigue limitado a 2000 caracteres y se elimina del contexto al reiniciar/cambiar de intención/cuenta.

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

Corrección de captura de noviembre: la evidencia temporal se materializa desde una subcadena literal validada del fragmento elegido, no necesariamente toda la oración que puede contener otros planes. evidenceText es solo salida interna de extracción/revisión; el canónico conserva time.quote con esa subcadena y no añade otro campo. Unconfirmed es estado local de transporte y no se guarda en Firestore. Consultar un recibo processing con concesión perdida/caducada puede marcar solo ese recibo failed y retirar exclusivamente su propia concesión; no toca una fuente saved ni una concesión posterior.

Refinamiento de calendario/diagnóstico del 15 de noviembre, activado con autorización y comprobado en Honor: meses y años relativos conservan precisión month/year; semanas naturales inequívocas son intervalos lunes–domingo, resueltos desde receivedAt y zone originales. No se inventa un día para un mes. Captura puede añadir al recibo privado `failure:{version:1,stage,reason,code}`, con vocabularios cerrados y sin mensajes, stack, texto, claves o salidas de IA. Comparte el TTL del recibo fallido de 24 h; el siguiente intento reemplaza ese diagnóstico y al completar no queda el pendiente. No se devuelve por la API pública ni constituye memoria consultable. Los recibos antiguos sin ese campo siguen siendo válidos. [Evidencia K4](../09-planning/K4_VALIDATION.md).

## Proyecciones y consultas K3

Según [ADR-010](../02-architecture/ADR/ADR-010-text-query.md), los fragmentos añaden `searchSchema:1`, `searchVector` nativo de 512 dimensiones y `searchTerms` acotados. Se derivan del canónico; no crean hechos ni reemplazan su revisión. Un índice vectorial de alcance de colección permite consultas bajo `accounts/{uid}/memories`, nunca una lectura global para filtrar propietarios después. La preparación de recuerdos anteriores es aditiva con precondición de versión; `privateConfiguration/search` liga UID, esquema y preparación completa. La consulta falla cerrada antes de prepararlos, en lugar de ignorarlos.

Los recibos K3 reutilizan `accounts/{uid}/operations/{UUID}` con `kind:query`, digest salado por UID/UUID/entrada, estado processing/finished/failed, nonce, intentos y TTL de 24 h. No contienen preguntas, aclaraciones, respuestas o copias de fuentes. La concesión numérica compartida está en `runtime/capture`. `getOperation` de K2 conserva su contrato de captura, no devuelve conversaciones K3. El contexto de aclaración de preguntas vive exclusivamente en RAM del móvil y de la petición.

Antes de entregar una respuesta, se comprueba de nuevo la versión exacta de los fragmentos y fuentes usados, además de identidad/propietario/concesión. Abrir el original lo lee otra vez del canónico autorizado. Los índices no autorizan respuestas por sí mismos; K4 deberá retirar proyecciones al modificar/olvidar.

## Base interna de retirada K4 · primera entrega

Implementada localmente, sin endpoint o despliegue: `accounts/{uid}/revocations/{sourceUuid}` conserva únicamente `retiredAtMs`, `operationId`, `removedCount` y digest de IDs/versiones/vencimiento, nunca texto o hash del texto. Sin TTL para impedir que una captura antigua renazca después de caducar su recibo. La transacción de fuente completa retira original y todos sus 1–8 fragmentos con proyección; sustituye recibos/textos pendientes vinculados por `{kind:retired, expiresAt}` (24 h) y crea un recibo sin contenido de retirada (siete días). El resto de fuentes/trabajos permanece intacto.

Captura y consulta verifican revocación además de las versiones y de la concesión de trabajo. La resolución interna conserva versiones de todos los documentos y dura cinco minutos. No es todavía la representación de corrección ni de borrado selectivo de una fuente compartida; contratos completos pendientes en [ADR-011](../02-architecture/ADR/ADR-011-memory-control.md).

`firestore.indexes.json` prepara un índice ascendente de colección exclusivamente para `operations.pending.turn.id`, que permite localizar pendientes vinculados por UUID. El resto del mapa `pending`, preguntas y textos siguen excluidos. La primera entrega solo los preparó; la continuación autorizada despliega la frontera y verifica ese índice READY. Los emuladores no sustituyen esa comprobación remota.

## Tickets conversacionales K4 · continuación activa

En `accounts/{uid}/operations/{requestId}`, `kind:routing` comparte nonce/concesión con consulta y añade `createdAtMs`, época, `planHash`, caducidad y, si procede, `executionId` o `declinedBy`. El digest incluye UID, entrada original, plan e ID aleatorio; no permite recuperación de preguntas/propuestas desde Firestore. Texto, pregunta, plan, corrección y hecho ofrecido no se guardan en este ticket. Sin aceptar, TTL y vigencia lógica de cinco minutos; tras vincular ejecución, TTL siete días conservando la admisión lógica original. No hay índice nuevo.

Una oferta aceptada usa captura canónica existente y puede crear su pendiente temporal normal con `memoryEpoch` adicional. Época distinta invalida recuperación/aclaración/commit sin devolver contenido antiguo. `receivedAt` es el instante del mensaje original, no del clic de aceptación. Corrección natural usa también ese instante; los controles manuales mantienen su recepción propia. Recuerdos confirmados conservan la política sin caducidad. [Contrato de conversación](../04-api/API_CONTRACT.md), [retención](STORAGE_POLICY.md).

## Reemplazo selectivo K4 · continuación activa

`changeMemory` reemplaza una fuente vigente con hasta dos nuevas: texto conservado con la recepción/zona originales y corrección explícita con recepción/zona actuales. Se retiran todos los fragmentos del origen y se crean derivados de los restantes con IDs nuevos/revisión incrementada. Los datos corregidos parten de la revisión del dato seleccionado más uno. Las proyecciones se insertan junto con el canónico; nada se confirma solo en el índice. Se preservan literales ajenos y se revisa que no reconstruyan el objetivo. La operación no alcanza otros relatos que repitan el mismo hecho.

Fuentes derivadas añaden `sourceKind:retained|correction`, exclusivamente escrito por servidor, y avisos explícitos en el texto. Una fuente original no lleva esa etiqueta. La fuente reemplazada desaparece del canónico y su revocación no contiene texto/historial. No se sobrescribe un original para fingir que siempre dijo otra cosa. `expectedVersion` es un digest de IDs y versiones exactas de fuente y todos sus fragmentos; una edición de cualquier fragmento invalida la selección. No es un hash del texto.

`accounts/{uid}/runtime/memory` contiene únicamente `revision`, entero seguro monótono sin TTL. Se incrementa en el commit de retirada/reemplazo y se lee atómicamente con el contenido de detalles. Permite descartar RAM/contextos anteriores antes de nuevas consultas o restauración. No es un archivo de recuerdos ni una copia histórica. Los recibos `kind:control` guardan estado, digest de entrada ligado al ID aleatorio, referencias actuales, época y vencimiento; no guardan orden/corrección. Terminales confirmados: siete días con TTL y comprobación lógica `expiresAtMs`. Recibos/textos vinculados al origen retirado se sustituyen sin texto y caducan en 24 h. [Contrato](../04-api/API_CONTRACT.md), [evidencia](../09-planning/K4_VALIDATION.md).

El móvil añade ForgetPreview con texto y alcance obtenidos de detalles vigentes y una aprobación solo en RAM dentro de TextCommand. No son campos Firestore ni de turn/plan/decision de la API. La aprobación se descarta tras usarla o cancelar. Por petición posterior, el objetivo confirmado se conserva en un Notice del feed local como MemoryChangeDescription: previousText y replacementText opcional, solo valores seleccionados y sin IDs/comandos. Corregir conversacionalmente puede leer detalles autorizados y cotejar versión/época antes de preparar esta descripción; no cambia el payload del cambio. Se retira con el feed, nunca se incluye en contexto, recibos, índices o persistencia móvil. Cancelar no produce un aviso de cambio confirmado.

## Olvido de copias K4 activo

Continuación de copias K4 activa: el inventario completo de fuentes/unidades y sus versiones vive solo en RAM durante allOccurrences. No hay colección de duplicados, historial o staging con texto. El commit revalida membresía/versiones completas y reemplaza todas las fuentes afectadas en una transacción; conserva cada asunto ajeno con su recepción/zona/vector, nuevos IDs y revisión incrementada. Una sola actualización de runtime/memory invalida conversación/pedidos anteriores. Las revocaciones siguen sin texto ni TTL. Recibos control de allOccurrences admiten hasta 32 referencias actuales y `forgetScope`, sin orden/inventario/selección textual; expiran a los siete días. Resultado público omite esos restos (`sources:[]`). Pendientes/recibos de cada origen se sustituyen sin texto (24 h). Alcance y cotas en [ADR-011](../02-architecture/ADR/ADR-011-memory-control.md).

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

Presentación en primera persona: getSourceDetails mantiene IDs/versiones canónicos pero items.text es una redacción efímera para lectura. Usa los fragmentos y su atribución/estado, sin vectores, verifica correspondencia exacta de IDs y revisión semántica, y revalida autorización/época/versiones después de IA. No reescribe fuentes, índices, embeddings o hechos anteriores ni crea una copia histórica. Los nuevos text de captura y las respuestas se redactan en primera persona cuando el sujeto es el propietario, preservando los demás ejes. Snapshot 4 y esquema persistente permanecen.

Refinamiento allOccurrences: el plan de separación de citas vive solo en RAM. Los restos pueden estrechar quote, time.quote y attributionEvidence a subcadenas literales de sus campos originales; preservan los restantes campos del recuerdo, incluida fecha/precisión, atribución y vector. Se exige evidencia presente en el texto conservado y revisión semántica de fuente y recuerdos. La frontera recalcula el mismo reemplazo antes de escribir; no cambia snapshot v4, añade colecciones ni guarda el contenido retirado.

Continuidad opt-in K4: el recibo control allOccurrences puede incluir managementChanges, hasta 32 pares {sourceId,sourceIds}, solo UUIDs del origen retirado y sus restos vigentes (sin texto, preguntas, órdenes o un historial recuperable). Se confirma en la misma transacción y conserva el TTL de siete días del recibo. No hay nueva colección, índice, backup o versión de snapshot. Recuperar valida que los IDs nuevos cubren exactamente las referencias actuales y que no hay duplicados/ciclos ni origen seleccionado ausente.

El feed histórico solicitado por el propietario se queda solo en RAM, sin límite artificial de mensajes; incluye originales y respuestas anteriores de lectura, sin comandos o evidencia utilizable después de un cambio. El mapa de IDs del servidor actualiza el catálogo de Gestionar y deshabilita los mensajes afectados del feed: quedan sin menú y no se enlazan a los restos actuales. Se limpia al cierre/reinicio o a los 30 minutos de segundo plano. No cambia la retención de fuentes/recuerdos canónicos ni materializa texto olvidado en el servidor.

Source puede llevar ownerTextVersion:1 como metadato privado de que sus recuerdos se crearon con la política de redacción propia actual. Lo escribe el backend de captura, una corrección nueva o una reparación aprobada; los restos conservan la marca solo si el origen ya la tenía. El olvido obtiene esa marca del inventario releído en la transacción, no de un plan del modelo ni del cliente. Un valor distinto o ausente no promueve una fuente anterior. No se expone en DTOs ni concede acceso. getSourceDetails devuelve esos textos canónicos directamente, reautorizando y cotejando versiones; las fuentes anteriores conservan su presentación comprobada con IA. No hay migración masiva ni cambio de snapshot 4.

La normalización temporal nunca cambia text por quote. Si cambia la precisión/valor/fin canónicos, una fase independiente puede revisar solamente text; el resto de cada item y el número/orden se cotejan exactamente antes de guardar. La reparación administrativa de un relato concreto reextrae desde el original con receivedAt/zone originales, verifica preservación completa/separación/atribución/fechas y usa el reemplazo atómico protegido existente: revoca el ID anterior, crea el nuevo origen y sus vectores y actualiza época/recibos vinculados. No es una lectura con efectos ni añade un endpoint; conserva ambos hechos, no ejecuta el olvido fallido. Cambios concurrentes de la fuente impiden el commit.

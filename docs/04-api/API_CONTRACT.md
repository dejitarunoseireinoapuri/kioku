# Contrato backend · memoria v2 y cuenta v1

## Consulta conjunta en rama · activación pendiente

La nueva app envía `includeReferences:true` opcional en el payload estricto de `memoryV2.query`. Sin ese campo se conserva el contrato personal anterior, incluso con documentos guardados. La consulta conjunta devuelve `sources` solo para vistas de gestión personal y `citations` opcional con hasta doce objetos estrictos `{sourceId:UUID,revision:UUID,title,location:page|paragraph|line|section,number,text,url?}`. Máximos: título 200, cita 2000, URL HTTPS 4096; localizador entero 1–200000. Son literales/versiones derivados por servidor, nunca elegidos por el proveedor. `answered` exige evidencia personal o documental; los otros estados no llevan citas. Respuesta móvil acotada a 100000 caracteres.

El proveedor recibe índices separados de recuerdos/documentos y una revisión independiente valida la atribución. Se comprueban épocas personal/documental durante las llamadas y en el commit terminal. El olvido documental incrementa el sello de contexto compartido. Los recibos siguen sin guardar preguntas/respuestas, y los replays no vuelven a generar. Con catálogo vacío se conserva el circuito personal. No cambia el callable documental de importación/gestión. [ADR-017](../02-architecture/ADR/ADR-017-unified-source-chat.md), [estado y pruebas](../09-planning/UNIFIED_SOURCES_VALIDATION.md). Las secciones siguientes describen versiones previas activadas.

## Fuentes compartidas: contrato productivo activo

Activo en Kioku desde el 18 de noviembre de 2026. Callable `referenceSources` en europe-west1: sobre estricto `{apiVersion:1,generation:UUID,operation,payload}`, cuenta Google del propietario, token revalidado, generación activa y App Check registrado. No admite UID/rutas/modelo/clave elegidos por el cliente. Operaciones: catálogo; admisión `{requestId,title,format,checksum}`; subida `{command:{apiVersion:1,requestId,title,format,bytes},lease}`; estado/cancelación `{requestId}`; lectura `{id}`; olvido `{id,revision}`; web `{requestId,url}`; consulta `{requestId,question,sourceId?}`. Bytes base64 solo RAM. Producción: 6 MiB binarios/archivo y cuerpo HTTP hasta 9 MiB; parser interno 10 MiB. Sin escrituras Firestore del cliente.

Consulta: `{status:answered|notFound|needsClarification,text,citations,referenceEpoch}`. Citas literales del servidor: sourceId/revision/title/index/locator/text/coverage y origin opcional; no son IDs de memoria personal. Ledger sin pregunta/respuesta; replay: processing o repeatRequired. Solo tras repeatRequired confirmado el cliente permite como máximo una consulta nueva en ese reintento, sin repetir un trabajo activo. No repite IA automáticamente ante un fallo de transporte. Errores propios con `details.referenceIssue` cerrado; nunca errores SDK/proveedor sin filtrar. Perfil Sol alto y clave resueltos en servidor.

Web: HTTPS/DNS/IP/TLS por salto; HTML/TXT/PDF público, hasta tres redirecciones/25 s/6 MiB. Sin login/cookies, Drive privado, vídeo o URLs propuestas por IA. Activación completada; calidad real del proveedor sin validar por la prohibición de gastar API; [evidencia](../09-planning/SHARED_SOURCES_VALIDATION.md).


**Fuentes compartidas, contrato local:** `importReference(store, uid, generation, input, signal?)` admite un objeto estricto `{apiVersion:1, requestId:UUID, title:string, format:text|markdown|pdf|docx|html, bytes:base64}`. Máximo 200 caracteres de título y 10 MiB decodificados. UID/generación proceden de la frontera confiable. El [piloto Android separado](../09-planning/SHARED_SOURCES_PILOT.md) conecta un transporte HTTP exclusivo de emuladores: no hay callable documental exportado ni modificación de `memoryV2`.

### Transporte del piloto ficticio

Solo `backend/test/pilot`, excluido del paquete productivo; guardas exactas para `demo-kioku-sources`, Auth 9197 y Firestore 8187 en loopback. Escucha 8787 en `127.0.0.1`, acepta POST con Host exacto y sin Origin. `/session` inicia una identidad Google sintética en Auth Emulator y entrega su token solo en RAM; todas las demás rutas verifican ese token y el UID del propietario ficticio. No acredita atestación/login reales ni autoriza exposición pública.

| Ruta local | Entrada y resultado |
| --- | --- |
| `/catalog` | Resúmenes actuales sin texto; época del catálogo |
| `/admit` | UUID, título, formato, SHA-256 de formato/NUL/bytes; reserva antes de transferir bytes; ready, started con lease o processing |
| `/operation` | UUID de petición; recupera resultado confirmado o lease pendiente de esa cuenta/generación; retirados/caducados no reviven |
| `/upload` | Comando v1 anterior y lease; `verifyUpload` coteja admisión, título, formato y huella antes de extraer; `uploadReference` publica solo tras reautorizar |
| `/cancel` | UUID; cancela pendiente o informa del resultado ya confirmado; no equivale a eliminar una fuente confirmada |
| `/read` | UUID de fuente; texto/localizadores actuales; el adaptador móvil coteja revisión |
| `/query` | Pregunta de hasta 2000 caracteres y sourceId opcional; citas literales, hasta 12; revalida época después de seleccionar, sin IA |
| `/forget` | UUID/revisión exactos; el móvil exige Cancelar/Sí, eliminar antes de enviar; respuesta confirmada sin texto |
| `/web` | UUID y únicamente `https://kioku.example.test/guia`; HTML ficticio, sin descarga de internet |
| `/fixture` | Índice 0–3; corpus generado, exclusivamente en este runner de pruebas |

Una sola operación de servidor a la vez acota workers y memoria en este piloto; concurrencia recibe `busy`, sin bucles de reintento. Cuerpo JSON hasta 14 MiB, plazo de petición 45 s; respuesta móvil acotada a 2 MiB. El cliente usa destino fijo, sin proxy/redirecciones, y cierra la conexión al cancelar. Conserva comando/ID en RAM ante fallo de red; reintentar consulta el mismo resultado sin añadir otro documento. «Dejar de esperar» es cancelación de espera local, no promesa de que no hubo commit. La pregunta permanece editable y reenviable. El token sintético se renueva antes de vencer; no se persiste.

`ReferenceStore.begin/complete/cancel/read/catalog/forget/operation/verifyUpload` reautorizan propietario habilitado y generación activa. Replay idéntico conserva resultado; mismo ID con comando distinto falla `conflict`. Lease de 15 minutos; publicación tardía/cancelada/retirada falla. Las citas llevan fuente/revisión/fragmento/localizador/texto y cobertura. Errores seguros: `invalid`, `unsupported`, `no-text`, `too-large`, `interrupted`, `unavailable`, `denied`, `conflict`, `retired`; el piloto añade `busy`. [Evidencia y límites](../09-planning/SHARED_SOURCES_VALIDATION.md). Producción/atestación, respuesta IA/consulta mixta, sustitución de versiones y descarga web arbitraria siguen pendientes. Bytes solo en RAM, sin staging binario persistente.

Voz K5 no añade endpoints, DTO ni audio subido al servidor. La transcripción ocurre localmente; Stop entrega solo un borrador editable, sin peticiones. Únicamente la pulsación posterior de Enviar usa los comandos autenticados existentes con las mismas reglas de versión/idempotencia/confirmación. Parciales y cancelaciones no envían. Sin respuestas habladas ni API de voz; el procesamiento posterior del texto mantiene su coste normal. [ADR-014](../02-architecture/ADR/ADR-014-local-voice-input.md), [refinamiento ADR-015](../02-architecture/ADR/ADR-015-dictation-draft.md).

## Integración v2 · 17 de noviembre de 2026

Recuperación móvil: un `repeatRequired` terminal de `route` puede provocar una sola renovación del ID de interpretación si aún no hay decisión aplicada; conserva IDs de acción/consulta. Un `repeatRequired` de `query` con plan puramente `ask` puede renovar una sola vez el ID de lectura; el comando actualizado se retiene para comprobar ese ID si vuelve a perderse la respuesta. `processing` conserva el ID, y un error de transporte no inicia por sí solo una renovación. Los cambios/ofertas aceptadas/capturas inciertas mantienen su identidad de escritura. No hay nuevos DTO ni colecciones, caché de respuestas persistida o bucle de reintentos. Una nueva pulsación explícita reutiliza el texto del comando RAM.

El contrato de memoria nuevo sustituye las rutas M0 al activar la cuenta: [ADR-013](../02-architecture/ADR/ADR-013-memory-v2-app-integration.md), [estado R3](../09-planning/R3_INTEGRATION_VALIDATION.md). La configuración de cuenta sigue en v1. Las secciones posteriores describen el protocolo anterior.

Callable autenticada y atestada `memoryV2`. Sobre estricto: `{apiVersion:2, operation, generation, payload}`. `state` omite generación/payload y devuelve `{apiVersion:2,generation,memoryEpoch}`; el cliente conserva esa generación y no cambia a otra silenciosamente. Las demás operaciones rechazan generaciones antiguas.

Operaciones: `submit`, `clarify`, `operation`, `source`, `details`, `query`, `change`, `route` y `apply`. Sus payloads conservan los campos funcionales de sus equivalentes anteriores con `apiVersion:2`. `query` exige zona IANA. `submit` admite `expectedEpoch`; la app lo envía al ejecutar un plan Contar. Las ofertas y cambios aplicados verifican la huella exacta del plan, texto, decisión y revisión. No se puede reutilizar un ID de operación con contenido distinto.

`route` comprueba primero si la pregunta necesita concretar su tema usando solo el mensaje y contexto de la revisión vigente. Continuaciones aisladas reconocidas como «¿Y ahora?» sin antecedente devuelven `needsClarification` antes de cargar el catálogo o crear el proveedor. Otras ambigüedades se clasifican en el paso de intención existente, también antes de leer contenido canónico; no se añade otra llamada de interpretación. Una pregunta completa o con contexto útil sigue devolviendo un plan `ask`. Solo corregir/olvidar carga candidatos durante `route`; la consulta de evidencia ocurre después en `query`. Se mantienen autenticación, generación, revalidación final, caducidad e idempotencia; el recibo no guarda el texto de pregunta/aclaración. Sin cambios de DTO ni modelo de almacenamiento.

`saved` incluye `memoryEpoch`, entero seguro positivo de su propia confirmación de guardado. La recuperación conserva esa revisión original, incluso si después hubo otros cambios; los recibos anteriores se completan desde el recibo canónico, nunca con la revisión global actual. Si falta ese recibo o se retiró el grupo, devuelve `expired`. El móvil acepta el avance de un guardado propio sin retirar sus referencias de gestión ni borrar el historial RAM. Un salto de revisión con cambios intermedios o una revalidación posterior distinta sigue invalidando el contexto anterior.

Los IDs de elementos son UUID estables, sin sufijo de posición. `sourceId` identifica un grupo de gestión de hasta ocho unidades. `source` y `details` muestran solo su contenido actual con `sourceKind:retained`. Máximo 2000 caracteres por unidad, 16 007 por grupo, 32 referencias de consulta y 128 sustituciones de grupos por cambio. `details` sin sourceId devuelve solo la revisión. Una corrección u olvido sustituye los grupos afectados; sus IDs viejos dejan de servir como evidencia.

Desde consultas, cada referencia identifica una vista de gestión de una sola unidad citada por la respuesta. Compartir relato no añade unidades vecinas. El UUID de esa vista se deriva de generación, identidad y revisiones de la unidad; se resuelve contra el canónico autorizado, sin documentos nuevos ni migración. `source`, `details`, cambios y contexto conversacional admiten estas referencias. Corregir o retirar una unidad revoca su vista anterior y comunica su sustitución dentro del máximo de 128 cambios, contando también los grupos del relato. El acceso desde un guardado conserva el grupo de lo contado. Respuestas anteriores a esta entrega mantienen sus referencias de grupo hasta repetir la consulta.

`change` exige versión y selección exactas. El móvil confirma localmente todo olvido antes de enviarlo. No se amplía automáticamente el alcance a dependencias. Olvido por identidad elimina todas sus ocurrencias; retirar exclusivamente un relato compartido pide concretar. Las respuestas no se almacenan: repetir una consulta pide repetirla con una nueva operación. Un guardado repetido recupera solo una fuente todavía vigente.

Precisión experimental R2: en compras/reservas `time` distingue por el contenido y soporte la fecha del acto y la fecha objetivo. Si solo consta la segunda puede anclarla, sin afirmar cuándo se realizó la compra ni que hubo asistencia; si constan ambas ancla la del acto y preserva también la objetivo. Consultar la fecha del acto exige su propia evidencia. Sin nuevos campos, colecciones, migración ni modificación de rutas activas. [Reglas y evaluación](../09-planning/R2_BOUNDED_VALIDATION.md).

Refinamiento exclusivamente local R2: intérprete y revisión comparten polaridad del contenido citado, procedencia textual e identidad de reiteración; la consulta exige soporte vigente del predicado pedido, además del sujeto. Se mantienen revisión, materialización, revalidación y confirmación del motor. No modifica DTO HTTP, permisos ni rutas desplegadas. [Alcance y pruebas](../09-planning/R2_SCOPE_VALIDATION.md).

R2 incorpora `queryCatalog` como frontera interna de prueba, sin HTTP nuevo: lectura paginada ligada a cuenta/época, máximo 32 referencias actuales por respuesta y estado de cobertura/truncado. Un pedido exhaustivo truncado pide acotar; una ausencia de coincidencias no demuestra ausencia universal. Las intervenciones de aclaración llevan calendario propio y procedencia de admisión. [Contrato local y límites](../09-planning/R2_INDEXED_VALIDATION.md).

**Contrato v2 aceptado como dirección, sin HTTP disponible:** [núcleo](../02-architecture/MEMORY_CORE_V2.md) y [R1/R3](../09-planning/MEMORY_CORE_REBUILD_PLAN.md) separan detalles por unidad, alcance y confirmación de olvido sin IA. Los DTO/rutas remotos finales siguen pendientes. El prototipo local siguiente no cambia V1; la transición deberá bloquear clientes/trabajadores antiguos por esquema/generación.

## Frontera local del prototipo R1 · no exponer por HTTP

`MemoryPrototype.prepare(actor, command)` recibe un comando estricto validado por [contracts.ts](../../prototypes/memory-core/src/contracts.ts). `capture`, `correct` y `enrich` reciben una interpretación previamente revisada, no una salida LLM aceptada automáticamente; `forget` recibe referencias actuales y posibles coincidencias excluidas explícitamente. IDs UUID, referencias `{id,revision}`, campos extra rechazados. `correct.preserveTime` conserva el soporte temporal anterior únicamente si se incluye en `retainedEvidence:[{fragmentId,start,end}]` (máximo 128 rangos relativos a fragmentos actuales propios; vacío por defecto significa retirar soporte anterior). Los rangos no pueden solaparse, exceder el literal ni partir un par UTF-16. `removeRelations` solo puede retirar relaciones salientes propias. El adaptador semántico debe acreditar esos cambios y exclusiones.

En la continuación R2, el modelo recibe solo evidencia de la unidad seleccionada con índices y procedencia. La versión actual recibe tokens con índices explícitos y devuelve `retention:[{index,parts:[{end,keep}]}]` y `segments:[{end,role,owners}]`; `end` es inclusivo y el inicio se deduce del anterior. El servidor comprueba cobertura exacta y materializa literales/IDs/rangos desde evidencia propia; no usa texto copiado por el modelo. Los literales materializados siguen pasando la revisión y los validadores originales. La revisión contrasta el contenido corregido contra evidencia nueva más retenida, y ausencia del valor sustituido. El commit no llama al modelo y vuelve a validar estado, límites y época. Esto cambia exclusivamente el contrato local del prototipo; ninguna ruta productiva acepta estos campos.

Resultados: `ready` con token, ID de operación, época, alcance y vigencia de cinco minutos; `needs_scope` con referencias concretas/dependencia o posible duplicado, sin escrituras; o `committed` para replay ya confirmado. `commit(actor,token)` aplica el plan privado o recupera su resultado; no recibe delta ni lista nueva. `cancel` descarta la preparación. Captura/edición claras llaman commit automáticamente desde la orquestación; la separación interna no impone aprobación del usuario salvo en olvido.

`operation` devuelve confirmación histórica y solo referencias aún vigentes; `current:false` evita presentar como actual un resultado corregido/retirado o sin recibo detallado. Admisión mínima evita volver a ejecutar tras caducar el recibo. `details` lee unidades sin IA; `evidence` crea un token privado con versiones/época y `revalidate` lo consume sin confiar en referencias alteradas por el consumidor. Los errores son códigos cerrados sin texto; `transport_unknown` exige consultar el resultado, nunca asumir no aplicado. La autorización es un doble local, no Google/App Check real. [Pruebas y límites](../09-planning/R1_VALIDATION.md).

### Adaptador R2 de evaluación

La salida interna indexada restringe `primary` a un propietario, `replaced` a ninguno y los demás roles a uno o más; una fecha desconocida exige valor/fin/ancla nulos. Los validadores del motor siguen comprobando referencias, cobertura y fidelidad. `CoreError.reason` añade motivos estructurales enumerados sin texto; no cambia códigos/DTO de producción. La entrada del generador/revisor de consultas usa `answerEvidenceView`: índices locales, contenido/fecha y soportes propios agrupados por calendario de fuente, sin UUIDs ni huecos posicionales del relato. El servidor conserva su mapa índice→ID/revisión y revalida época/versiones antes de entregar la respuesta. [Evidencia local](../09-planning/R2_RELIABILITY_VALIDATION.md).

El adaptador R2 tampoco expone una ruta remota. Sus resultados de interpretación son `ready`, `clarify` o `no_memory`; solo `ready` revisado/materializado entra en R1. La consulta devuelve `answered`, `not_found` o `clarify` con referencias actuales. `not_found` puede citar el mismo plan para explicar que no consta su realización; no puede usar otro recuerdo por parecido. El catálogo de prueba tiene límite explícito de 32 unidades. [Protocolo de evaluación y límites](../09-planning/R2_VALIDATION.md). No trasladar estos tipos de proveedor al dominio móvil ni considerarlos el DTO final de R3.

## Contrato V1 desplegado e historia

Refinamiento compatible de interpretación (activo el 15 de noviembre): captura usa needsClarification/question y edición usa needsClarification/text para pedir una reformulación sin escribir canónico. La edición aclara expresamente que no se ha modificado el recuerdo. Solo rechazos concretos de interpretación/fecha pueden pedir reformular; transporte, cuota, autorización, formato o evidencia ajena siguen fallando por su vía técnica. No cambia ningún DTO público. Al corregir evidencia compartida, el servidor prepara una separación literal del único ID elegido y relee su versión antes de validar lo conservado y confirmar; el cliente no recibe ni envía ese plan interno. Cuatro funciones activadas con autorización y recorrido productivo aceptado en Honor; límites y evidencia en K4_VALIDATION.

Operaciones autenticadas, versionadas y ligadas al UID verificado; el cliente no elige otro propietario. App Check y límites de abuso se aplican al entorno remoto. La tabla conserva el contrato de conjunto. `getConfiguration` está activo en K1; captura, aclaración, recuperación y fuente están desplegadas en K2 según el apartado siguiente, con aceptación móvil del nuevo build pendiente.

| Operación | Entrada relevante | Resultado |
| --- | --- | --- |
| `getConfiguration` | sesión, apiVersion: 1 | Estado seguro de cuenta/IA, nunca clave |
| `submitTurn` | requestId, mode, channel, texto o referencia temporal autorizada, locale/zone | `saved`, `needsClarification`, `answer`, `proposal` o error tipado |
| `resolveClarification` | requestId, clarificationId, respuesta, expectedRevision | Continuación del turno original |
| `queryMemory` | requestId, pregunta, referencias de contexto autorizadas | Respuesta y evidencias o insuficiencia/aclaración |
| `resolveProposal` | requestId, proposalId, accept, expectedRevision | Guardado una vez o rechazo sin mutación |
| `getSourceDetails` | sourceId opcional | Datos seleccionables y versión; sin sourceId, solo revisión global |
| `changeMemory` | requestId, sourceId, expectedVersion, memoryIds, action, correction, zone | Corrección/olvido confirmado o aclaración; unifica los correctMemory/forgetMemory previstos |
| `getSource` | sourceId, referencia/revisión | Texto propio vigente permitido, con correcciones distinguidas |
| `getOperation` | requestId propio | Estado confirmado para recuperar un resultado incierto |

## Garantías

Refinamiento de presentación del 15 de noviembre: Preguntar ofrece tres puntos → Gestionar en lugar del enlace Ver texto original. Utiliza las referencias existentes y getSourceDetails, sin cambiar sus contratos o añadir endpoints. Las descripciones locales de cambio (dato anterior/nuevo) permanecen solo en RAM de presentación y no son campos de las peticiones ni contexto de consulta. Una corrección conversacional puede leer los detalles existentes antes de aplicar para describir X, comprobando versión/época; el resultado confirmado sigue siendo autoridad del servidor. La lista de Gestión puede comenzar con hasta seis fuentes citadas y conserva las revisiones de cada una.

Frontera K1 comprobada en emuladores, función remota activa: `getConfiguration` acepta exactamente `{apiVersion: 1}`, cuerpo HTTP de hasta 256 bytes y cabecera de autorización de hasta 8192 caracteres. Requiere Google permitido, correo verificado y UID vinculado; revalida tokens revocados/usuarios deshabilitados. Responde `{apiVersion: 1, account: authorized, ai: ready | notConfigured, revision: entero no negativo}`. Sin referencia de credencial, devuelve `notConfigured`, revisión 0. Límite: 30 lecturas autorizadas por minuto de servidor. Producción exige entorno/proyecto exactos y App Check de las apps registradas. Estado de transporte HTTP y recorrido positivo real en la [evidencia K1](../09-planning/K1_INTEGRATION_VALIDATION.md); no se deducen de los tests locales. El resto de operaciones sigue previsto.

La activación administrativa de clave no es `setAiCredential`: una herramienta privada valida la credencial, crea versión inmutable en Secret Manager y activa solo su referencia con revisión esperada. No acepta identidades arbitrarias de un cliente móvil ni devuelve la clave. Una clave rechazada preserva el estado anterior. `ready` refleja la última activación validada; no verifica saldo ni garantiza que la clave no se haya revocado después. El propietario acepta gestionar la clave desde PC; formulario y endpoint móvil `setAiCredential` quedan fuera del alcance personal actual, según ADR-008.

Errores seguros de esta frontera: `unauthenticated`, `permission-denied`, `invalid-argument`, `resource-exhausted`, `failed-precondition` y `unavailable`. No devuelve detalles crudos de Firebase ni los campos rechazados. Se reautoriza cada lectura; una sesión cliente no concede acceso permanente.

- Validar campos exactos, tipos, tamaños, longitud y pertenencia de todas las referencias. Límites concretos deben fijarse antes de implementar, no quedar ilimitados.
- Idempotencia ligada a usuario+operación+requestId+entrada; reutilizar ID con otra entrada es conflicto. Reautorizar incluso un replay. Recibos no repiten secretos ni contenido olvidado.
- Mutaciones usan revisión esperada y commit de servidor. No ejecutar peticiones OpenAI dentro de callbacks de transacción Firestore que puedan repetirse.
- Una llamada externa puede haberse cobrado aunque el cliente vea timeout. No prometer exactamente-un-cobro; limitar reintentos y separar fases de operación y persistencia.
- Query es lectura salvo propuesta aceptada o corrección/borrado explícitos autorizados. Texto recuperado y decisiones del modelo no son autorización.
- Uso de OpenAI con la clave configurada para esa cuenta; sin fallback silencioso a otra clave, propietario o entorno.

Payloads de voz pueden requerir un protocolo temporal de upload/transcripción separado por límites del transporte; se resolverá antes de UC-003. No subir binarios arbitrarios al contrato de texto por conveniencia.


## Frontera K2 · Captura por texto

Implementada y desplegada; estado remoto y evidencia en [K2_VALIDATION](../09-planning/K2_VALIDATION.md). Mantiene Google permitido/verificado, UID vinculado, revocación y App Check de K1. Revalida identidad después de inferencia y propietario dentro del commit. Nunca interpreta el texto como permiso para otra operación o cuenta.

La consulta tiene una frontera separada K3, descrita al final; no se envía un modo Preguntar al endpoint de captura.

| Callable | Entrada exacta |
| --- | --- |
| `submitTurn` | `{apiVersion:1, requestId:UUID, mode:"tell", channel:"text", text, zone}`; texto no vacío hasta 8000 caracteres y zona IANA válida |
| `resolveClarification` | `{apiVersion:1, requestId:UUID, clarificationId:UUID, expectedRevision, text}`; revisión 1–3, respuesta y aclaración acumulada hasta 2000 caracteres |
| `getOperation` | `{apiVersion:1, requestId:UUID}` propio; sigue hasta tres continuaciones de la operación |
| `getSource` | `{apiVersion:1, sourceId:UUID}` propio; fuente inmutable de K2, sin campos de edición/borrado |

Todos rechazan campos extra, patrones de credencial, UID/rutas/modelo elegidos por cliente y cuerpos HTTP de más de 40 KB. Idempotencia por UID+requestId+digest de entrada; un ID reutilizado con otra entrada falla. Una captura con varios asuntos escribe una fuente y hasta ocho recuerdos con revisión inicial 1, en el mismo commit que su recibo. El servidor no llama al proveedor dentro de transacciones.

Resultados de captura/recuperación incluyen `apiVersion:1`, `operationId` y:

- `saved`: `sourceId`, `memoryCount` (1–8) y `source:{sourceId,text,receivedAt}` leída del canónico autorizado; el recibo no duplica ese texto.
- `needsClarification`: `clarificationId`, `revision` y `question`; no existe aún fuente/recuerdo confirmado.
- `processing`: el servidor mantiene una concesión de captura vigente. La app distingue este estado de una respuesta de transporte desconocida (`Unconfirmed`, solo local) y comprueba el recibo sin reenviar el texto. Si la concesión ha caducado o ya no pertenece al trabajador, getOperation cierra únicamente su recibo como failed y bloquea su commit tardío.
- `failed`: recibo confirmado de intento sin guardado; reintento explícito con el mismo ID, hasta tres intentos y sin sobrescribir un recibo saved. Un error de red/HTTP no basta para inferir failed: el cliente hace una única comprobación getOperation; si tampoco obtiene evidencia válida mantiene Unconfirmed.
- `needsRetelling`: sigue faltando contexto tras tres versiones del turno (inicial y dos aclaraciones). El refinamiento de calendario activado también lo utiliza tras tres intentos de captura confirmados fallidos; comprobar/repetir ese ID ya no llama al proveedor. No se guarda; se ofrece explicarlo como un mensaje nuevo, sin atribuir todo fallo a falta de contexto ni a una clave sin configurar.
- `ignored`: no se produjo memoria. `expired`: no puede recuperarse el resultado mediante ese recibo; no acredita por sí solo que nunca hubiera commit.

`getSource` responde `{apiVersion:1,sourceId,text,receivedAt}`. Los errores usan los códigos seguros de K1. La función limita a una captura costosa simultánea por propietario, concesión de cuatro minutos, nonce por intento y tres intentos; máximo 180 s por llamada. SDKs: 185 s, suspensión compartida: 195 s. Son límites técnicos, no objetivos de latencia. Las reservas conservadoras de IA limitan cada intento a 1 USD estimado/ocho llamadas y el día UTC a 10 USD estimados; no son saldo promocional ni un límite monetario de Firebase.

Presentación de la fuente: el cliente conserva `receivedAt` completo tanto desde `saved` como desde `getSource`; convierte el instante a la fecha local del dispositivo para la etiqueta «Lo contaste el…». No añade campos a la respuesta, no modifica la fecha del servidor ni confunde recepción con la fecha del evento relatado.

Pendientes/fallos con contexto caducan tras 24 h desde la actividad admitida; recibos terminales tras siete días. El borrado físico TTL es asíncrono. No hay TTL en fuentes/recuerdos. La app solo muestra éxito tras resultado confirmado; una respuesta perdida se comprueba por ID. Cancelar la suspensión descarta callbacks, sin prometer deshacer un commit remoto. El estado de sesión/generación elimina resultados tardíos del cliente anterior.

Pregunta natural, ofertas, corrección y olvido siguen pendientes de K3/K4. Un mensaje en Preguntar no se dirige a `submitTurn` ni se transforma en memoria.

Presentación de fallos: tras failed, processing o Unconfirmed de captura se puede continuar usando el chat. Las tarjetas de capturas pendientes conservan su ID/comando solo en RAM, dentro del límite de 40 mensajes, incluso al cambiar Explicar/Preguntar. Comprobar estado usa getOperation, no submitTurn ni una nueva inferencia. Una aclaración recuperada continúa el padre original. Cuenta/época/reinicio/fin de ámbito limpian esas referencias y descartan respuestas tardías.

## Frontera K3 · Consulta por texto

Implementada y activada desde `codex/k3-text-query`; comprobaciones remotas y aceptación móvil pendiente en [K3_VALIDATION](../09-planning/K3_VALIDATION.md). La mención anterior a K3 pendiente describe el alcance de K2, no elimina esta implementación posterior. [ADR-010](../02-architecture/ADR/ADR-010-text-query.md).

`queryMemory` acepta exactamente `{apiVersion:1, requestId:UUID, text:string}`. Texto no vacío, máximo 2000 caracteres y HTTP máximo 12 KB; rechaza secretos reconocibles, UID/modelo/reloj/clave/ruta inyectados. Google, revocación, cuenta permitida y App Check de la app registrada, como K2. Usa fecha del servidor y contexto de fuentes; una aclaración incorpora solo la pregunta anterior y respuestas explícitas del usuario, hasta 2000 caracteres acumulados.

Continuación de consulta: el cliente mantiene hasta cuatro preguntas previas de esta sesión, incluidas las respondidas con ausencia. Si hay contexto, `text` sigue siendo una cadena y contiene JSON con `pregunta_actual` y `preguntas_anteriores_solo_contexto`; sin contexto conserva el texto directo anterior. No añade campos a la petición ni envía respuestas previas. Todo el texto es dato no confiable para interpretar la pregunta actual, nunca evidencia de hechos. Conserva el límite total de 2000 caracteres, ID/entrada estable para reintento y recuperación de fuentes actuales. Un exceso se rechaza localmente sin petición ni truncado silencioso. Se limpia al reiniciar consulta, cambiar de intención o salir de la sesión. No es un historial persistente ni un campo de reloj cliente.

Respuesta exacta `{apiVersion:1, operationId:UUID, status, text, sources:[{sourceId:UUID, receivedAt:ISO}]}`. Hasta 2400 caracteres y seis fuentes distintas. Estados:

- `answered`: respuesta respaldada y al menos una fuente propia vigente.
- `notFound`: no consta información suficiente; no significa que algo no ocurrió. Puede citar evidencia vigente que explique el límite, sin convertir la ausencia en un hecho.
- `needsClarification`: preguntar por el alcance/persona/contexto; puede citar fuentes vigentes que expliquen la ambigüedad, sin guardado de hechos.
- `processing`: mismo ID aún en curso; texto/fuentes vacíos, no reenvío automático.
- `repeatRequired`: ese ID terminó; texto/fuentes vacíos. Al no conservar respuestas en Firebase, volver a preguntar exige acción explícita e ID nuevo.

El mismo ID con otra entrada es conflicto. Fallo o concesión caducada admite hasta tres intentos explícitos con el mismo ID; no se guarda la pregunta para reconstruirlos. Compartir concesión con captura impide trabajo costoso concurrente por propietario. Presupuesto distribuido y límites de tiempo K2. Revalidación después de IA y de versiones canónicas dentro de la transacción que termina el recibo, sin guardar la respuesta.

Abrir una fuente usa `getSource` protegido con el ID referenciado, no una URL ni una copia cacheada de la respuesta. El cliente rechaza ID distinto, campos extra, fechas/longitudes malformadas y estados sin la evidencia requerida. Datos nuevos, correcciones y borrados conversacionales siguen fuera de K3.

## Primera frontera interna K4 (histórica, sin HTTP)

La primitiva privada `SourceRetirementStore` resuelve y retira exclusivamente fuente completa con sus 1–8 fragmentos, versiones exactas y vencimiento de cinco minutos. No se exporta desde Functions ni recibe instrucciones del móvil/modelo. No implementa aún `correctMemory`, `forgetMemory` o `resolveProposal`: el contrato de esas operaciones sigue previsto. [ADR-011](../02-architecture/ADR/ADR-011-memory-control.md) delimita autorización conversacional y retirada selectiva pendientes.

Los adaptadores K2/K3 se preparan para revocaciones: `getSource` rechaza la fuente retirada con `failed-precondition`; `getOperation` no devuelve `saved` de un recibo retirado, sino `expired` sin referencia ni texto. Un replay de captura/consulta con un ID original revocado falla cerrado. Una consulta no entrega evidencia retirada durante la inferencia. No añade campos o estados al HTTP actual ni está desplegado este cambio.

## Frontera K4 · selección desde la fuente (activa)

Dos callables activos en Bélgica. Ambos requieren identidad Google permitida/verificada, token no revocado, UID autorizado habilitado y App Check de app registrada. No se permite elegir propietario, ruta, clave o modelo. Reautorización tras IA y dentro del commit. Recibos ligados a UID+requestId+entrada; las peticiones exactas repetidas no vuelven a mutar ni a llamar al proveedor. Misma concesión costosa, presupuestos y máximo de tres intentos que K2/K3. Sin reintentos pagados automáticos.

| Callable | Entrada exacta y límites |
| --- | --- |
| `getSourceDetails` | `{apiVersion:1,sourceId?:UUID}`; cuerpo máximo 256 bytes, 15 s. Sin sourceId devuelve `{apiVersion:1,memoryEpoch:enteroSeguroNoNegativo}` |
| `changeMemory` | `{apiVersion:1,requestId:UUID,sourceId:UUID,expectedVersion:hex64,memoryIds:string[],action:"correct"\|"forget",correction:string\|null,zone:IANA}`; cuerpo máximo 16000 bytes, 180 s |

Detalles con fuente: `{apiVersion:1,sourceId,version,text,receivedAt,memoryEpoch,items:[{id,text}],sourceKind?}`. Una fuente propia vigente y 1–8 datos. La versión opaca de 64 caracteres hexadecimales cubre versiones exactas de fuente y todos sus datos; no es hash del contenido. Texto/revisión se leen juntos. IDs seleccionados únicos y pertenecientes a esa fuente (1–8, hasta 40 caracteres cada uno). Corregir exige exactamente un dato y una afirmación actual no vacía hasta 2000 caracteres; olvidar exige `correction:null`. `sourceKind` solo puede ser `retained` o `correction`; ausente significa original. No se acepta ese campo en una escritura cliente.

Resultado de cambio: `{apiVersion:1,operationId,status,text,sources:[{sourceId,receivedAt}],memoryEpoch}`. Estados `corrected` / `forgotten` solo después del commit; hasta dos fuentes actuales (cero si se retiró todo). `processing`: mismo ID sigue ocupado, sin texto/fuentes y sin éxito supuesto. `needsClarification`: no hubo cambio; revisar alcance o escribir corrección completa, con nuevo ID si cambia la entrada. Error seguro tipado conserva el comando para comprobación explícita con el mismo ID. Una entrada distinta con el mismo ID es conflicto. El cliente valida forma exacta, IDs, fechas, época y correlación operación/acción. No usa `getOperation` de captura para comprobar controles: repite `changeMemory` con la entrada estable.

Original y todos sus fragmentos quedan revocados al reemplazarlos; se conserva el resto del relato en otra fuente y la corrección en una nueva con fecha propia. Las citas antiguas fallan cerrado y los recibos no devuelven texto retirado. No significa olvidar otras fuentes que repitan ese dato. Una retirada completa explícita no llama a OpenAI. Una retirada parcial/corrección exige revisión positiva de preservación y ausencia de dato objetivo; no se ejecuta si el alcance es inseguro.

`getSource` y `saved.source` conservan sus campos y admiten `sourceKind` opcional para las fuentes derivadas; originales mantienen la forma anterior. La UI distingue «Texto original», «Texto que conservas» y «Fragmento de tu corrección». En contexto JSON de `queryMemory`, `memory_revision` es opcional y se valida como entero seguro no negativo. Si difiere de la revisión del servidor, se descartan preguntas anteriores antes de recuperar; clientes sin el campo se consideran revisión 0. La pregunta actual siempre se mantiene como dato no confiable, nunca como hecho guardado. El campo no sustituye autorización ni decide escrituras.

La primera activación no incluía interpretación natural ni ofertas. La continuación siguiente las incorpora y activa con autorización posterior, sin un endpoint separado llamado `resolveProposal`. El transporte HTTPS público no da acceso a contenido sin superar las comprobaciones. Estado remoto en [K4_VALIDATION](../09-planning/K4_VALIDATION.md).

## Conversación K4 · activa

`routeMessage` interpreta `{apiVersion:1,requestId,mode:ask|tell,text,zone,memoryEpoch,context:{questions,sourceIds}}`. Texto no vacío: 2000 caracteres en ask, 8000 en tell. Hasta cuatro preguntas previas, suma máxima 2000, y seis referencias propias; cuerpo máximo 64 KB. No acepta identidades/rutas/modelo/credenciales elegidos por el relato. Devuelve `ready` con plan, `needsClarification` con pregunta, `processing` o `repeatRequired`. Una interpretación terminada no puede recuperar el plan desde un recibo: no se persiste su contenido.

Todo plan incluye `memoryEpoch`, `receivedAt` del mensaje y `expiresAtMs` (cinco minutos). Acciones: `ask`, `tell`, `offer` con `fact` literal y `alsoAsk`, o `correct|forget` con `sourceId`, `expectedVersion`, `memoryIds` y `correction` nullable. Corrección exige un dato inequívoco, olvido hasta ocho de una sola fuente. Una referencia contextual requiere exactamente una fuente anterior; varios objetivos posibles piden aclaración. La interpretación no escribe recuerdos. Preguntas, hipótesis e instrucciones citadas no autorizan mutación. Cambios reales con el tiempo se añaden como hechos nuevos, sin borrar el pasado.

`applyMessage` recibe `{apiVersion:1,requestId,turn,plan,decision:apply|accept|reject}`. `turn` es la entrada original exacta. El servidor comprueba digest ligado a UID/ID aleatorio, plan emitido, época, caducidad y un único ID hijo. Modificar texto/plan/propietario o aceptar con un segundo ID falla. Rechazar una oferta es idempotente y definitivo, devuelve `declined`, sin IA ni captura. Solo aceptar explícitamente permite `saved` o aclaración de captura; el modo permanece Preguntar. Las órdenes explícitas correct/forget devuelven el contrato de `changeMemory`. La app actual exige confirmación local de todo forget antes de llamar applyMessage; correct conserva su recorrido. Para mostrar el objetivo se leen los detalles autorizados y se cotejan versión/época/IDs con el plan; la aprobación y su texto solo viven en RAM, no se serializan en turn/plan/decision ni se almacenan en recibos. No cambia la autorización del servidor ni el protocolo de clientes anteriores. Los replays confirmados vuelven a contrastar evidencia vigente y no repiten IA/commit. Un resultado incierto se comprueba con el mismo comando; repetir con ID nuevo requiere acción del propietario.

Ofertas/correcciones conservan el instante del mensaje original para resolver fechas relativas, aunque se apliquen después de medianoche. Una aclaración de captura aceptada conserva esa época: si hubo un cambio de memoria, expira sin exponer ni guardar el texto antiguo. Los planes quedan en RAM del cliente; no hay cola offline. `ask`/`tell` normales reutilizan las fronteras de consulta/captura ya existentes. Los dos callables nuevos mantienen Google verificado/no revocado, App Check, cuenta permitida y propietario habilitado; una admisión por petición y comprobación final tras IA.

No existe borrado global de la cuenta desde esta frontera. Una orden de borrar toda la memoria pide un objetivo concreto, sin retirar un subconjunto de candidatos. El alcance entre relatos se amplía en el apartado siguiente; su activación es distinta de la primera frontera. [Aceptación nativa y límites](../09-planning/K4_VALIDATION.md).

La evidencia interna de consulta conserva `sourceKind:retained|correction` opcional, validado desde Firestore, hasta generación y verificación. La cabecera de una corrección no la convierte en cita ajena; la procedencia `quoted` de un candidato sigue sin acreditar hechos personales. No cambia la forma pública de las referencias de respuesta ni permite al cliente asignar esa etiqueta.

## Olvido de copias K4 · activo

Entrada `changeMemory`: `forgetScope:source|allOccurrences` opcional y solo aplicable a olvidar; `allOccurrences` se rechaza para corregir. Ausente mantiene source para clientes anteriores. La app nueva envía allOccurrences al olvidar un dato y source al retirar todo el texto. Los planes de ruta forget incluyen el mismo campo; el móvil conserva presencia/valor exactos al aplicar, y el ticket rechaza cambios. Una ruta sin scope resuelto pide aclaración, sin escoger una sola copia por defecto. Las órdenes de corregir y las ofertas conservan su alcance existente.

allOccurrences parte de un representante/versiones actuales y revisa el inventario completo de la cuenta, no solo candidatos de búsqueda. Selección/revisión semánticas, transformación literal y commit conjunto impiden anunciar éxito si falla algún relato. Inventario cambiado, fuente/unidad nueva, revocación, propietario o concesión inválidos bloquean toda la mutación. Resultado confirmado usa el contrato de cambio existente con `status:forgotten`, `sources:[]` y una época nueva. No expone otras 32 referencias como fuentes de respuesta; permanecen solo en el recibo mínimo para comprobar su vigencia al recuperar. El replay no repite IA ni borrado.

Rechazo por ambigüedad/reconstrucción devuelve needsClarification y ninguna mutación, con pregunta útil si consta. No hay reescritura automática de otro hecho ni aprobación redundante de un olvido inequívoco. Si se supera capacidad/presupuesto se devuelve una explicación de que no pudo completarse y no borró nada. La implementación está limitada a 128 fuentes/512 unidades/180 000 caracteres, hasta 16 lotes de 48 000 caracteres, 32 fuentes afectadas/400 escrituras y preparación de 160 s; los límites se comprueban antes del commit. El servidor mantiene las cuotas y elige su perfil de presupuesto; el cliente no puede enviarlo. [Decisión](../02-architecture/ADR/ADR-011-memory-control.md).

Se requiere actualizar la app; clientes antiguos no saben aplicar el nuevo campo de ruta y sus acciones explícitas por fuente conservan el alcance anterior. Sin endpoints/permisos nuevos. El despliegue de las tres funciones afectadas y su aceptación real están registrados en [K4_VALIDATION](../09-planning/K4_VALIDATION.md).

## Frontera interna comprobada en M0 v4

El prototipo local limita la salida del proveedor a evidenceIds de los candidatos seleccionados y deriva las citas sourceIds en código. Generación y verificación contrastan el alcance de la pregunta (recuerdo, contenido citado o ambos). El texto citado no acredita datos personales. Para consultas exclusivamente de citas, el resultado se materializa desde el literal autorizado tras la verificación. Esto no publica endpoints ni sustituye autorización por UID/revisión en el backend previsto.

## Presentación de recuerdos en primera persona

Distinción vigente por petición posterior: los datos guardados y las fichas de getSourceDetails mantienen la primera persona del propietario, pero queryMemory le responde en segunda persona («Quieres…», «Tu padre…», «Pablo te dijo…»). La evidencia no se reescribe. Generación y verificación de respuestas reconocen esa conversión de sujeto/posesivo como fiel sin trasladar deseos de un tercero al propietario. Las citas literales conservan su texto original. No hay cambio de esquema, endpoints o persistencia ni otra llamada de IA: siguen las fases existentes. Adaptación activada con autorización únicamente en queryMemory y comprobada en Honor; no se actualizan captura o Gestionar.

getSourceDetails con sourceId conserva el esquema de respuesta y sus IDs/versiones. Para fuentes creadas con la política de redacción propia actual (ownerTextVersion:1, metadato interno del servidor), items.text devuelve directamente el texto canónico de sus recuerdos; no llama a IA ni reescribe los datos al leerlos. Para fuentes anteriores, un servicio de solo lectura proyecta hasta ocho fragmentos sin vectores, exige IDs exactos y revisión positiva de fidelidad/perspectiva/atribución. Ambos recorridos reautorizan y contrastan época y todas las versiones al terminar. Datos retirados o versiones cambiadas fallan cerrado; la lectura anterior tampoco devuelve una paráfrasis no comprobada ni funciona sin su proveedor configurado. Sin sourceId sigue devolviendo solo la época, sin proveedor.

Solo la lectura anterior con presentación usa el proveedor/presupuesto privado, dos llamadas de redacción/revisión y store:false. La lectura de texto canónico actual no accede a la clave. La función admite 180 s y concurrencia cuatro dentro del máximo de una instancia; Google, App Check y cuenta permitida siguen obligatorios. No se añaden entradas, permisos, claves o índices de consulta. La captura nueva conserva la perspectiva en el propio dato. Si normalizar una fecha cambia precisión/valor, una fase acotada de texto y revisión puede ajustar únicamente su redacción temporal; no puede alterar evidencia, metadatos, número de asuntos ni ampliar un texto con la cita de otros. Son dos llamadas adicionales solo en ese caso, sin reintento ciego. Un fallo no confirma guardado. La activación productiva requiere autorización concreta.

Refinamiento interno de allOccurrences: las entradas/respuestas públicas no cambian. changeMemory y el cambio delegado por applyMessage pueden separar automáticamente citas compartidas de hechos independientes. El plan de IA añade evidence, validado como subcadenas exactas por ID; no acepta texto alternativo ni cambios de hechos/fecha/atribución. Revisión de fuentes y recuerdos conservados, recálculo en almacenamiento y comprobación de versiones preceden al commit. Una dependencia real sigue fallando sin borrado parcial. La selección admite hasta 6000 tokens de salida y el cálculo del lote incluye la revisión ampliada dentro de los límites ya documentados. No hay otra llamada ni endpoint.

Continuidad opt-in: changeMemory y applyMessage admiten continueManagement?:boolean, ligado a la entrada/idempotencia del cambio; no amplía alcance de escritura ni altera el plan autorizado. Las respuestas terminales solicitadas añaden changes:[{sourceId:UUID,sourceIds:UUID[]}], máximo 32 orígenes únicos, cero a dos destinos por origen y destinos únicos/currentes sin ciclos. sources conserva como máximo las dos fuentes de la selección: para allOccurrences con opt-in devuelve únicamente el resto del origen seleccionado (cero o uno), mientras changes incluye los reemplazos de todas las copias afectadas. Sin opt-in sigue devolviendo sources vacío en ese olvido y no añade changes. Processing/needsClarification no anuncian reemplazos.

El cliente valida IDs, correlación operación/acción, origen seleccionado y coincidencia entre sus referencias y el mapa. Cada lectura posterior sigue autorizada y versionada; el mapa no permite recuperar un original revocado. Un recibo adulterado o con referencias retiradas falla cerrado, sin inferencia ni otra mutación. Reutilizar el mismo ID con otro valor de opt-in es conflicto. GetSource/getSourceDetails no añaden redirecciones ni cambian sus contratos.

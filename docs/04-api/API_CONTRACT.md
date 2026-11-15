# Contrato backend previsto · v1

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
- `needsRetelling`: sigue faltando contexto tras tres versiones del turno (inicial y dos aclaraciones). No se guarda; se ofrece volver a explicarlo, sin un bucle de preguntas que no pueda contestarse.
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

getSourceDetails con sourceId conserva el esquema de respuesta y sus IDs/versiones; items.text pasa a ser presentación efímera en primera persona para datos propios. El texto fuente y la versión permanecen canónicos. Un servicio de solo lectura proyecta hasta ocho fragmentos sin vectores, exige IDs exactos y revisión positiva de fidelidad/perspectiva/atribución y reautoriza/contrasta época y todas las versiones al terminar. Un resultado no comprobado, datos retirados o una clave no configurada fallan cerrado; no devuelven una paráfrasis no autorizada ni modifican recuerdos. Sin sourceId sigue devolviendo solo la época, sin proveedor.

La lectura con presentación usa el mismo proveedor/presupuesto privado, dos llamadas de redacción/revisión, store:false y la identidad existente. La función admite 180 s y concurrencia cuatro dentro del máximo de una instancia; Google, App Check y cuenta permitida siguen obligatorios. No se añaden entradas, permisos, claves o índices. La captura nueva y las respuestas incorporan la misma perspectiva sin cambiar sus esquemas, garantías temporales o fuentes de evidencia. La activación productiva requiere autorización concreta.

Refinamiento interno de allOccurrences: las entradas/respuestas públicas no cambian. changeMemory y el cambio delegado por applyMessage pueden separar automáticamente citas compartidas de hechos independientes. El plan de IA añade evidence, validado como subcadenas exactas por ID; no acepta texto alternativo ni cambios de hechos/fecha/atribución. Revisión de fuentes y recuerdos conservados, recálculo en almacenamiento y comprobación de versiones preceden al commit. Una dependencia real sigue fallando sin borrado parcial. La selección admite hasta 6000 tokens de salida y el cálculo del lote incluye la revisión ampliada dentro de los límites ya documentados. No hay otra llamada ni endpoint.

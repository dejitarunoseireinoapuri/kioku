# K4 · Control conversacional de memoria

Rama: `codex/k4-memory-control`, desde la entrega K3 `6b264e7`. **En curso: controles por fuente activos en Honor; continuación conversacional implementada y comprobada localmente, activación nueva pendiente.** K3 conserva la comprobación iOS actual y la aclaración del reporte temporal pendientes. No se integran ramas en `main` por esta ejecución. K4 no cerrada.

## Alcance de la primera ejecución

Se prepara la base del servidor para retirar una fuente completa cuyo alcance ya esté resuelto, antes de implementar interpretación y UI. No responde todavía a «olvida…» desde la app. La retirada selectiva de un asunto de un relato, correcciones, ofertas de guardado, endpoints y limpieza coordinada de las conversaciones de dispositivos siguen pendientes. No se elimina un relato completo en lugar de un fragmento ambiguo.

`FirestoreSourceRetirementStore.inspect/retire` comprueba propietario, IDs, conjunto completo de 1–8 fragmentos, versiones y vencimiento de cinco minutos. El commit elimina fuente y fragmentos/índices juntos, limpia recibos/texto pendiente del mismo origen y persiste una revocación sin contenido ni TTL. La misma retirada es idempotente y se reautoriza; otra entrada, alcance caducado, cambio concurrente o exceso de registros impiden la mutación entera. No cancela concesiones de otro asunto.

Los adaptadores K2/K3 consultan las revocaciones para impedir guardados antiguos, fuentes retiradas y respuestas tardías con esa evidencia. El estado `expired` existente evita presentar como guardado un recibo retirado; no afirma que nunca se hubiera guardado. No se añaden callables ni se modifica el contrato HTTP público. [Decisión y secuencia restante](../02-architecture/ADR/ADR-011-memory-control.md).

Revisión de índices: `pending` está exento por privacidad; la consulta de limpieza requiere la excepción específica `pending.turn.id` con índice ascendente de alcance colección. La definición local conserva excluidos mapa/textos y no añade búsqueda global. No está desplegada; el éxito del emulador no prueba índices productivos. Debe comprobarse su preparación remota antes de habilitar K4.

## Criterios y comprobación local

Antes de comprobar se fijan casos ficticios de: retirada completa de dos asuntos, preservación de otra fuente y otra cuenta, replay simultáneo y tras caducidad del recibo, cambio de fuente/fragmento/conjunto, resolución caducada, identidad ajena/deshabilitada, recuperación de una captura K2 confirmada y trabajador antiguo, limpieza de pendientes, conservación/cancelación selectiva de concesiones, consulta en curso, reinserción de snapshot obsoleto y límites/colisiones. Los tests no tocan producción ni usan claves o datos reales.

Comandos desde la raíz:

```powershell
node tooling/backend.mjs build
node tooling/backend.mjs test
node tooling/backend.mjs format:check
pwsh -NoProfile -File tooling/backend-emulators.ps1
pwsh -NoProfile -File tooling/check-docs.ps1
```

Resultados: compilación TypeScript strict y formato correctos, **15/15 pruebas unitarias** (una nueva de validación de alcance) y **47/47 pruebas de emuladores** (11 nuevas de retirada, más ampliación de reglas de acceso a revocaciones). Se conserva la cobertura existente de captura, consulta, credenciales y aislamiento. La suite incluye confirmación K2, retirada y rechazo de su trabajador antiguo; no solo registros de ejemplo insertados directamente. La primera ronda de nueve casos de retirada pasó 45/45 antes de añadir los dos casos de captura confirmada y concesión/replay revocado. Una revisión posterior sustituye interpolación de regex por conjunto cerrado de IDs y amplía el caso de entrada malformada; compilación y las 15 unidades se repiten correctamente. No se atribuyen resultados al modelo o al entorno real a partir de estos dobles. El validador local `FirestoreApi.validateSpec` del CLI fijado acepta la definición de índices, sin llamar a Google. Comprobador documental correcto: **65 documentos y 11 ADRs**, enlaces/mapa/identificadores; revisión semántica y `git diff --check` sin errores.

## Límites de la primera entrega (históricos)

Sin llamadas OpenAI, gasto API nuevo, claves consultadas, nuevos recursos o modificaciones de recuerdos productivos. No hay cambio visual/móvil: no procede afirmar pruebas nativas nuevas o instalar el mismo APK por esta frontera. El Honor queda seleccionado por el propietario para las próximas comprobaciones que sí afecten al móvil. No se valida despliegue, Google/App Check real, interpretación del proveedor, sincronización móvil o iOS.

Documentación consultada: convenciones/calidad, plan/limitaciones, evidencia K3, modelo/retención, API, seguridad/privacidad y ADR-005; SDK fijado y transacciones de Firestore. No se precisa acceso visual a Stitch porque este bloque no modifica interfaces. La continuación no cierra K3 ni K4 automáticamente.

## Segunda ejecución · control selectivo por fuente

Desde «Texto original» se añade «Gestionar»: cada dato permite corregirlo con una frase completa u olvidarlo; una acción distinta declara expresamente que retira todo ese texto. La orden clara no añade confirmación redundante. El servidor comprueba el alcance seleccionado y una versión opaca de fuente y fragmentos; cualquier conflicto, ambigüedad o revisión negativa deja intacto el canónico. Todavía no interpreta órdenes naturales como «olvida lo del examen» ni ofrece guardar un dato nuevo desde Preguntar. **K4 no está cerrada.**

La selección retira todos los literales del dato escogido y preserva los bytes ajenos. Una revisión semántica adicional comprueba autorización, conservación y ausencia del objetivo. Fuente original y todos sus fragmentos se revocan en el mismo commit que crea los restos y la corrección con IDs nuevos y proyecciones vigentes. La fuente conservada mantiene recepción/zona; la corrección usa su recepción nueva y revisiones incrementadas. `sourceKind` distingue original intacto, texto conservado y fragmento corregido. No se presenta un texto modificado como original histórico.

Los callables preparados son `getSourceDetails` y `changeMemory`, con Google verificado, revocación, cuenta permitida y App Check, más límites estrictos. La misma concesión de captura/consulta serializa cambios; ID/entrada estables permiten comprobar una respuesta incierta sin repetir el commit ni la IA. El token de versión cubre también cambios de fragmentos ocurridos antes de enviar. Recibos terminales de control sin texto: siete días, con caducidad lógica además de TTL. La revisión mínima `runtime/memory` invalida el contexto antiguo del chat; fuente y revisión se leen juntas.

El cliente limpia mensajes, respuestas, fuentes, borradores y generaciones después de un cambio confirmado; al volver a primer plano oculta datos anteriores hasta revalidar la revisión. Antes de enviar preserva lo recién escrito, pero descarta contexto viejo si hubo un cambio. Una respuesta tardía no restaura contenido retirado. No hay sincronización continua con otro dispositivo en primer plano ni limpieza garantizada de clientes antiguos: deben actualizarse. La corrección conserva borrador durante errores y rotación; recuperar usa exactamente la misma operación. Cancelar/volver no promete revertir un commit remoto ya iniciado.

### Evidencia fijada y proveedor real

Se congelaron siete fixtures en `tooling/k4-control-fixtures.mjs` antes de llamar al proveedor. Incluyen fuentes mixtas, negación, deseo frente a realización, fechas relativas, corrección con recepción diferente, instrucción citada no ejecutable y retirada completa. Comando explícito:

```powershell
pwsh -NoProfile -File tooling/backend-emulators.ps1 -LiveControlSmoke
```

Resultado: **7/7 casos correctos**, 36 llamadas a OpenAI, **0,13151104 USD estimados**, `gpt-6.1-sol` con razonamiento `medium`, Responses `store:false`. [Informe público sin texto](k4-control-1794659632423.json), hash del corpus `e1d50797cb7cb9267ca9f206f9dd38aec289cd8009b4f29cd25047686c2b5afb`. Replays: cero llamadas nuevas en los siete casos. La revisión posterior de fuentes y fragmentos sintéticos comprobó ausencia del dato retirado, conservación de los demás asuntos, estado/atribución/fechas y fecha nueva de la corrección. El contador previo se conservó: estimación acumulada 18,25034382 USD; **no es el saldo real de la cuenta API**. No se tocó producción ni se crearon claves.

El mismo agente de desarrollo realizó esta inspección fuera del circuito de respuesta; no hubo auditor humano independiente ni constituye garantía universal. Las comprobaciones automáticas del informe no sustituyen esta revisión de contenido. Los refinamientos posteriores de token de versión, caducidad y etiquetas de procedencia se verificaron con pruebas deterministas, sin repetir llamadas pagadas ni ajustar el corpus a resultados observados.

### Comprobaciones deterministas

TypeScript strict y formato correctos, **22/22 unidades**, **55/55 pruebas en emuladores** y dos pruebas del transporte de revisión del proveedor. Casos nuevos: retirada selectiva, preservación de otros asuntos/cuentas, corrección y fechas, revisión negativa/incompleta, versiones de fuente/fragmentos antes y durante el trabajo, concesión caducada, replay/ID conflictivo, caducidad lógica, HTTP positivo/negativo y eliminación completa sin proveedor. Se conservan los casos anteriores de captura confirmada, trabajadores antiguos, revocaciones y consultas en curso. Los fixtures de Auth se aíslan por propietario: el emulador vincula Google con el mismo correo a un mismo UID.

Compilación Android, `mobileCheck`, formato, capas, Detekt y Lint correctos; **56/56 pruebas host**. Ronda nativa final: **36/36 en Honor FNE_NX9, Android 14/API 34**, incluidos los cinco casos nuevos de selección/corrección/olvido, giro durante cambio sin duplicación, borrador/recuperación y fuente retirada durante segundo plano. También pasan teclado real y fondo/tamaño del envío. Son repositorios sintéticos inyectados, sin atribuirles Google/App Check reales. Durante la integración se corrigieron lectura de estado antiguo en navegación, visibilidad de carga/confirmación tras giro, ocultación del teclado al aplicar y resultados pendientes mientras la pantalla está oculta. Las primeras rondas fallidas no se consideran aceptación; el caso de giro restaura después la orientación para aislar los demás casos. La prueba del teclado se configura con edge-to-edge igual que MainActivity; Android 14 no lo impone como Android 16. Se conserva la comprobación de que el campo está físicamente sobre el teclado y el envío mide al menos 48 dp.

[Controles con datos ficticios](../assets/branding/kioku-source-controls-honor.png), [carga durante corrección en horizontal](../assets/branding/kioku-correction-pending-honor.png). Capturas de la raíz Compose, revisadas visualmente, sin datos del propietario ni otras apps. APK local `androidApp/build/outputs/apk/debug/kioku-k4-control.apk`, SHA-256 `268fac37e1de39a0f8679889183cb8afb93066d4ae4b335ceb7b6fac83551bf7`; no se suben binarios ni credenciales al repositorio. Instalación de pruebas mediante actualización, sin desinstalar, resetear, cerrar la sesión real o modificar ajustes globales del teléfono.

Comandos móviles: `pwsh -NoProfile -File tooling/mobile.ps1 formatKotlin :androidApp:assembleDebug :androidApp:assembleDebugAndroidTest mobileCheck`, actualización de ambos APK y runner Android completo sobre el Honor. La ronda final termina `OK (36 tests)`; no se vuelven a ejecutar pruebas de pago para confirmar cambios de presentación. Comprobador documental correcto: 65 documentos y 11 ADRs; `git diff --check` correcto y revisión semántica de contratos/estado/privacidad.

Se consultaron convenciones/calidad, ADR-011/005, modelo/retención, API, seguridad/privacidad, estado, plan y limitaciones. Antes de modificar la UI se inspeccionaron por MCP las vistas Stitch 07 y 05 y sus imágenes, sin editar Stitch. Paleta B, JetBrains Mono y pulsación por color del texto se mantienen. La adaptación con teclado y poca altura prioriza el campo y el envío, ocultando temporalmente la cabecera; vuelve al cerrar el teclado.

### Activación y aceptación nativa

El propietario autoriza expresamente en el chat activar y probar en Honor el 14 de noviembre: `kioku-9454f`, Bélgica, dos callables nuevos, adaptación de cinco existentes, índice estrecho `operations.pending.turn.id` y entrada HTTPS de los dos nuevos manteniendo Google/App Check/cuenta permitida; pruebas nuevas solo sintéticas y limpieza limitada a ellas. El despliegue concreto de siete funciones finaliza correctamente. Verificación administrativa final: todas `ACTIVE`, identidad `kioku-runtime`, máximo una instancia y entrada de transporte presente; las siete rechazan HTTPS sin credenciales con 401. No se cambió `getConfiguration`. Se prepara únicamente el índice del UUID con `updateMask=indexConfig`, sin tocar otros campos/TTL; estado final **READY**, mapa `pending` permanece excluido.

`LiveSourceControlTest` ejecutada en el mismo Honor contra MainActivity, SDKs Google/Firebase nativos y servidor productivo: **1/1 correcta**, 55,92 s para el recorrido completo. Guarda un relato con dos datos marcados como prueba; cambia la película de Loto a Niebla desde Gestionar; la consulta devuelve Niebla y abre su fuente actual; olvida esa película desde la fuente; la consulta nativa confirma `NotFound` para ella y `Answered` con día 24 para el examen conservado. No se inyectan repositorios fake ni tokens/atestación de depuración. El primer intento parcial guardó correctamente, pero el helper de test intentó desplazar el botón fijo Gestionar; se corrigió para desplazar solo si hace falta, sin modificar la app ni debilitar la aserción de visibilidad. Su relato se retiró antes del intento definitivo.

La regla exterior de [LiveSourceControlTest](../../androidApp/src/androidTest/kotlin/io/github/dejitarunoseireinoapuri/kioku/LiveSourceControlTest.kt) exige `-e liveSourceControlProject kioku-9454f` antes de abrir MainActivity; sin ese opt-in la prueba se omite (estado de instrumentación -4), no se cuenta como pasada ni llama a IA. Ejecución de producción requiere autorización previa y preparación/limpieza supervisadas, no forma parte del runner ordinario. Antes de repetir debe comprobarse que no queda el marcador `K4farol8254`; se retiran exclusivamente sus fuentes al terminar, incluso si falla. Se comprobó ausencia previa del marcador sintético; tras el recorrido se retiró únicamente la fuente residual de prueba, validando marcador y pertenencia de todos sus fragmentos. Comprobación final: **cero fuentes sintéticas restantes**. Las revocaciones mínimas permanecen según la política; no contienen el texto retirado. APK de K4 queda instalado en el Honor, con sesión preservada.

Esta prueba nativa añade llamadas pagadas distintas de las 36 del informe local de 0,13151104 USD. No se atribuye ese importe al total remoto ni al saldo real API. No se recabó un desglose monetario aislado del intento nativo. La aceptación confirma este recorrido y dispositivo, sin convertirlo en garantía universal, prueba iOS o cierre de todas las historias K4.

Se consulta la [documentación oficial de despliegue acotado](https://firebase.google.com/docs/functions/manage-functions) y el código del CLI fijado. No se crean proyectos, backups o claves ni se amplían permisos de memoria de clientes. iOS comparte UI/adaptadores preparados, pero este build necesita Mac/Xcode y comprobación propia. Tampoco se resuelve retroactivamente el reporte «debate hoy» a partir de inferencias o de esta entrega.

## Tercera ejecución · conversación y ofertas, preparada para activar

Se implementan órdenes naturales explícitas de corrección/olvido en ambos modos y ofertas para afirmaciones nuevas en Preguntar. Los controles «Sí, recuérdalo» / «No, gracias» o una respuesta inequívoca a la oferta activa conservan el modo. Preguntas, hipótesis, citas e instrucciones relatadas no autorizan una escritura. Un cambio real con el tiempo se añade como nuevo dato y conserva el pasado. Una orden clara no añade confirmación; objetivo ambiguo pide aclaración. Chat compartido en RAM, carga bajo mensajes por fase real, borrador vaciado al enviar y operaciones estables ante giro/reintento.

Los dos nuevos callables preparados son `routeMessage` y `applyMessage`; **no están desplegados**. Ticket sin texto, digest ligado a UID/entrada/plan/ID aleatorio, vigencia de cinco minutos, un solo hijo y época/versiones actuales. Rechazo definitivo no llama a IA. Fecha original del mensaje ancla ofertas y correcciones, incluso al cruzar medianoche. Un pendiente de oferta aceptada conserva época y no puede restaurarse tras un cambio. La consulta descarta contexto antiguo y el cliente retira mensajes anteriores al conocer otra época, antes del resultado hijo. La fuente actual se vuelve a leer para abrirla. [Contrato](../04-api/API_CONTRACT.md), [ADR-011](../02-architecture/ADR/ADR-011-memory-control.md).

### Evaluación con proveedor, conservando los fallos

Se mantiene Sol medio, `store:false` y la clave existente, sin crear/copiar secretos ni reiniciar el contador. Todas estas rondas usan datos sintéticos y Firestore local; no acreditan identidad/atestación productivas ni iOS.

| Conjunto | Resultado | Llamadas | Estimación USD | Informe |
| --- | --- | --- | --- | --- |
| Inicial, 14 casos fijados | 14/14 interpretación/efecto correctos | 62 | 0,16970436 | [Inicial](k4-conversation-1794667252096.json) |
| Reserva nueva, 10 casos + 10 consultas | 8/10 casos; dos consultas de fechas corregidas se abstienen indebidamente | 98 | 0,28486984 | [Intento fallido conservado](k4-conversation-reserve-1794670269485.json) |
| Regresión dirigida tras corregir procedencia | 2/2 casos y consultas correctos | 28 | 0,08279040 | [Regresión](k4-conversation-dates-1794670825728.json) |
| Reserva nueva final, seis casos + diez consultas | 6/6 casos y 10/10 consultas correctos | 80 | 0,22492988 | [Aceptación local reservada](k4-conversation-acceptance-1794670927440.json) |

El primer conjunto precede los refinamientos de revisión de tell/borrado global y del instante de corrección; no prueba por sí solo la versión final. La reserva posterior encontró que se guardaban correctamente las fechas nuevas y se retiraban las anteriores, pero el verificador confundía la cabecera de corrección con una cita. Una comparación diagnóstica acotada confirmó `quoted_as_personal` al omitir la procedencia; no fue un reintento contado como aceptación. Se corrige la lectura de evidencia para conservar `sourceKind` tipado del servidor y explicar sus cabeceras al generador/verificador, sin promover candidatos quoted a hechos personales. El resultado sigue exigiendo su procedencia individual y evidencia actual.

Los casos observados pasan a regresión. La aceptación posterior se fijó antes de ejecutar y usa otras fechas/asuntos: bicicleta/mandarinas, cerámica cruzando medianoche, corrección de aprendizaje con cita de cartel preservada, olvido de pódcast conservando acuario, oferta de alimento y borrado global que no actúa. Incluye pregunta personal sobre una cita ajena rechazada, consulta del literal citado correcta, fecha nueva recuperable y asunto ajeno conservado. Replays de mutaciones: cero llamadas nuevas. Revisión posterior de las fuentes y respuestas sintéticas realizada por el agente de desarrollo, separada del circuito de respuesta, sin auditor humano independiente; no es garantía universal ni evaluación a gran escala.

La estimación local acumulada queda en **19,05086660 USD**, incremento de **0,80052278 USD** respecto de 18,25034382 al iniciar esta continuación; incluye las comparaciones diagnósticas, además de los informes. No representa saldo real de créditos API ni incluye gasto productivo de otras ejecuciones.

### Comprobaciones locales y Honor

- Backend: TypeScript strict/formato, **22/22 unidades**, **70/70 emuladores** y núcleo M0 **82/82 pruebas deterministas**. Incluyen autorización/HTTP de los nuevos endpoints, tickets alterados/ajenos/caducados, rechazo/aceptación simultánea, revisión negativa, versión/época/revocación durante trabajo, propietario deshabilitado tras IA, aclaración antigua, medianoche y procedencia de consulta tipada. Seis pruebas nuevas de transporte verifican perfil fijo, `store:false`, límites de salida y rechazo de campos inventados para interpretación/selección/revisión.
- Android: compilación de app y pruebas, `mobileCheck`, formato, capas, Detekt y Lint correctos; **74/74 host tests**. Contexto excesivo se rechaza antes de IA; época regresiva no ejecuta hijo; época nueva limpia antes de responder; la sesión no recupera resultados tardíos después de destruirse.
- Honor FNE_NX9, Android 14/API 34: **41/41 pruebas instrumentadas con dobles**, cinco nuevas de oferta/aceptación/rechazo, giro real durante aceptación, seguimientos y olvido con limpieza. Se mantiene teclado y regresión de cuenta/fuentes. [Oferta ficticia, revisada visualmente](../assets/branding/kioku-memory-offer-honor.png). No son pruebas de los nuevos endpoints en producción.
- `LiveConversationTest` está preparada para probar MainActivity, SDKs nativos y servidor real con el marcador nuevo `K4nube9261`. Una regla exterior exige `-e liveConversationProject kioku-9454f` antes de abrir la Activity. Sin opt-in se comprobó **una omisión** (código -4), no un éxito del recorrido ni una llamada a IA. La prueba productiva anterior tiene su guardia separada y no forma parte de las 41.

Comandos adicionales:

```powershell
pwsh -NoProfile -File tooling/backend-emulators.ps1 -LiveConversationSmoke
pwsh -NoProfile -File tooling/backend-emulators.ps1 -LiveConversationReserve
pwsh -NoProfile -File tooling/backend-emulators.ps1 -ConversationCorpus dates
pwsh -NoProfile -File tooling/backend-emulators.ps1 -ConversationCorpus acceptance
node tooling/m0.mjs check
node tooling/m0.mjs test
```

APK preparado `androidApp/build/outputs/apk/debug/kioku-k4-conversacion.apk`, SHA-256 `064fef84e8a166b825b0b5bb8a6981eac3498cff2e715cadade5de313eb509d1`. Después de probar con fixtures se deja en Honor el APK anterior compatible con el servidor actual, por actualización sin borrar datos o sesión. El APK nuevo se instalará al activar las fronteras nuevas; no se deja una interfaz que dependa de endpoints inexistentes.

### Activación y límites pendientes

El despliegue preparado añade dos funciones y actualiza `submitTurn`, `resolveClarification`, `getOperation` y `queryMemory`. Los dos nuevos necesitan entrada HTTPS pública de transporte, manteniendo Google, App Check y propietario permitido; misma identidad/secreto/Blaze y OpenAI. No hay nuevos índices, claves, backups o permisos directos de cliente. La autorización de la frontera anterior no se interpreta como autorización de esta ampliación; se solicita con entrega concreta revisable. Después se comprobarán estado/denegación y recorrido nativo en Honor con nuevos datos sintéticos y limpieza exclusivamente de ellos.

Alcance actual de corrección/olvido: una fuente inequívoca, hasta ocho fragmentos; resolver recupera seis candidatos o una fuente contextual. No garantiza retirar copias del mismo hecho en otros relatos ni borrar toda la cuenta. Una orden global pide concretar sin borrar parcialmente. Tampoco hay sincronización continua de otro móvil en primer plano. iOS comparte implementación/adaptadores preparados, pero falta compilar y probar este build en Mac. Estas limitaciones impiden declarar K4 completa.

Se consultaron convenciones/calidad, reglas/casos de uso, ADR-011, plan/limitaciones, estado, contratos/modelo/retención y seguridad/privacidad. Referencia Stitch 06 y captura inspeccionadas por MCP, sin editar el diseño. No se cambió modelo/perfil ni se usó Astra.

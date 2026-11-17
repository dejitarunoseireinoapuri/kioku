# Archivos, Drive y webs compartidos con Kioku

## Estado, autorización y resultado

Plan preparado por petición del propietario: incorporar archivos, Drive y páginas web mediante el menú **Compartir** del sistema, además de seleccionar archivos dentro de Kioku. Solo planificación en esta entrega: no hay código de importación, recursos nuevos, acceso a Drive, despliegues o pruebas nativas ejecutadas.

La preparación e implementación local se diseñan con **cero llamadas de IA, cero gasto de API y solo casos ficticios**. No se cargan claves, recuerdos, archivos, enlaces privados ni cuentas documentales reales. Consultar documentación pública no implica usar la API de esos servicios. Las pruebas de respuestas con dobles no acreditan comprensión real. El coste de almacenamiento/CPU remoto tampoco se considera gratuito: cualquier activación remota se separa de este plan.

Resultado previsto: desde Archivos, Drive o navegador, elegir Compartir → Kioku → ver el elemento y su progreso → disponer de una fuente consultable → preguntar y abrir la cita utilizada. No se exige copiar el texto a mano, organizar carpetas o convertir el documento en un relato personal. [Dirección técnica propuesta](../02-architecture/ADR/ADR-016-shared-reference-sources.md).

## Alcance inicial y orden

| Entrada | Primera entrega prevista | Límite explícito |
| --- | --- | --- |
| Archivos | TXT UTF-8, Markdown, PDF con texto y DOCX sin macros; compartir y selector nativo | Sin OCR, PDF cifrado/escaneado, hojas de cálculo, presentaciones, ZIP genérico, audio o vídeo |
| Drive como archivo | Fichero entregado por Compartir/Enviar una copia o por el proveedor del selector nativo | Recibir un URI no garantiza poder leerlo; comprobar el permiso y que se obtienen bytes |
| Drive como enlace | Distinguir enlace de archivo; explicar cómo enviar una copia cuando no se puede leer | El acceso privado mediante OAuth/exportación es una subfase separada; no se supone incluido en el acceso Google actual de Kioku |
| Web | Enlace HTTPS explícito, una página, texto principal y enlace PDF tratado como archivo | Sin login, cookies personales, navegador automático, ejecución de scripts, muro de pago o rastreo de páginas enlazadas |

YouTube, TikTok, Instagram, vídeos incrustados y transcripciones quedan fuera de esta entrega. Una página puede contener texto legible y un vídeo inaccesible: solo se declara leído el texto realmente extraído.

Orden recomendado: cerrar contratos → archivos y recepción Android → extracción/almacenamiento → Drive por fichero → webs → consultas y gestión → iOS y aceptación. La conexión privada directa a Drive puede desarrollarse después del recorrido de fichero sin bloquearlo.

## Recorrido del propietario

1. En otra app, seleccionar el archivo o enlace y tocar Compartir → Kioku. Kioku aparece solo para los tipos declarados; validar también el contenido real recibido.
2. Mostrar el nombre/título, origen y estado del elemento. Elegir Kioku expresa la intención de importar: no añadir otra aprobación rutinaria para guardar. Una selección desde Kioku pasa por el mismo recorrido. El propietario puede cancelar antes de la confirmación del servidor.
3. Resolver sesión y cuenta antes de leer/subir. Si no hay sesión válida, pedir acceder; si el permiso temporal no puede conservarse con seguridad, explicar que debe volver a compartir. Nunca asignar silenciosamente el contenido a una cuenta distinta.
4. Estados veraces por elemento: Recibiendo → Leyendo → Preparando para consultas → Disponible. Separar «Texto leído; consultas con IA pendientes» del estado listo si no se ha preparado el modo final. Un fallo parcial o límite no se anuncia como importación completa.
5. Un lote muestra cada resultado; ningún archivo desaparece de la lista por fallar. Reintentar una operación conserva su ID; no genera fuentes duplicadas. Cancelación durante una confirmación incierta consulta primero el resultado y permite eliminar lo ya confirmado, sin declarar que nunca existió.
6. Ofrecer Preguntar sobre esta fuente y acceso a sus datos. Preguntar en general puede encontrar fuentes y recuerdos con atribución clara; un filtro de fuente es opcional, sin nueva obligación de clasificar. Seguir el contexto solo con referencias vigentes.
7. Responder con título y cita navegable: página real de PDF, encabezado/párrafo de DOCX, líneas de texto o sección de web con URL y fecha de lectura. No inventar paginación de DOCX, contenido oculto o una cita que solo apunte al título.
8. Eliminar una fuente requiere el diálogo local de objetivo/alcance vigente. En esta primera versión se elimina la fuente completa; una orden sobre un fragmento ambiguo pide concretar y nunca se amplía sola al documento completo. Eliminar en Kioku no borra el archivo en Drive/dispositivo ni la web original.

Compartir mientras Kioku está cerrada, abierta, preguntando, mostrando gestión o recibiendo otro elemento debe mantener el contexto existente y el aislamiento de la operación. No insertar adjuntos como texto ya enviado ni invocar el circuito de interpretación de recuerdos para importar.

## Reglas para documentos y recuerdos

- El contenido importado se conserva como **fuente de referencia** con título, procedencia, versión y fragmentos. No se convierte automáticamente en experiencias/preferencias del propietario. «El documento recomienda…» y «Tú contaste…» mantienen atribuciones distintas.
- Guardar una web conserva una instantánea textual con fecha de obtención; preguntar usa esa versión, sin releer internet silenciosamente. Una actualización explícita crea una versión nueva y retira citas de la anterior al confirmar. Cambiar el archivo original tampoco cambia lo importado automáticamente.
- La propuesta inicial conserva texto extraído y localizadores, no una biblioteca permanente de binarios/HTML bruto. El enlace original sirve para volver al proveedor; que desaparezca después no invalida por sí mismo la copia textual importada. No se promete reconstruir el PDF original desde esa copia.
- No reescribir el contenido ajeno mediante Corregir un recuerdo. La sustitución del documento es una nueva versión; una nota personal sobre él sigue las reglas de Contar/ofertas y cita la fuente cuando corresponda.
- Duplicados idénticos de la misma cuenta y versión se reconocen con huella de contenido y versión de extracción; el título o URL solos no prueban igualdad. Otra cuenta no puede deducir que el documento existe. Un reintento no reimporta; un nuevo compartir explícito tras eliminar es una operación nueva, sin rehabilitar IDs retirados.
- La revisión/época autoriza cada consulta y su respuesta final. Olvidar revoca inmediatamente la recuperabilidad, cancela trabajos, retira fragmentos/índices y desactiva citas/contextos anteriores. El feed RAM histórico conserva únicamente la excepción de presentación ya elegida por el propietario; nunca vuelve a ser evidencia.

## Arquitectura y contratos a congelar en I0

Mantener KMP/Compose, MVVM, StateFlow y Koin. Domain recibe descriptores y contratos portables; `Intent`, `Uri`, `NSItemProvider`, SDK de cuenta y tipos de parsers quedan en adaptadores. UI muestra estado y envía intenciones; el ViewModel no descarga webs ni analiza PDF.

Fronteras propuestas: recepción nativa, lectura temporal de adjuntos, repositorio de fuentes, extracción de texto, búsqueda de evidencias y proveedor de respuesta. La extracción de documentos se implementa detrás de un adaptador de servidor/worker TypeScript y se prueba primero en un proceso local aislado. Elegir parsers mantenidos y versiones/licencias verificadas en I0; no añadir dependencias ni asumir que hay un extractor PDF portable nativo sin comprobarlo.

El backend sigue autorizando admisión, subida, extracción, revisiones, consulta y borrado. El cliente solo puede subir al área temporal de una operación admitida; no escribe fuentes o índices canónicos directamente. Los trabajos releen propietario/generación/estado antes de publicar y no pueden confirmar después de cancelar/eliminar. Un origen compartido nunca contiene una orden ejecutable.

| Contrato lógico propuesto | Garantía que debe quedar escrita antes de implementarlo |
| --- | --- |
| Iniciar importación | Cuenta/atestación, ID idempotente, tipo, límites, generación, admisión antes de transferir; sin llamada IA |
| Entregar archivo o URL | Subida temporal acotada ligada a operación o URL validada para el fetcher; nunca rutas/credenciales elegidas por un modelo |
| Consultar/cancelar operación | Estado confirmado, resultado desconocido distinto de fallo, replay idéntico sin duplicados y cancelación de workers tardíos |
| Leer fuente/evidencia | IDs opacos, versión actual, cobertura de extracción, localizadores verificables y permiso comprobado en servidor |
| Preguntar por fuentes | Alcance explícito opcional, selección acotada de fragmentos, citas autorizadas y revalidación tras generar respuesta |
| Eliminar/actualizar | Objetivo y versión exactos, confirmación local para eliminar, revocación antes de limpieza y sustitución atómica de versión |

Nombres de endpoints/DTO y versión se fijan en I0 en API_CONTRACT; esta tabla no crea rutas desplegadas ni reutiliza `memoryV2` con payloads incompatibles. Los textos largos no se introducen en el límite de 256 unidades del núcleo como cientos de recuerdos personales.

Datos propuestos: `ReferenceSource` (propietario, generación, revisión, origen, título, fecha, tipo, huella, cobertura/estado), fragmentos con offsets/localizadores de esa versión, operación de importación y revocaciones sin contenido. Aislarlos por cuenta y por clase de evidencia; búsquedas comunes combinan resultados autorizados sin perder esa clase. La evidencia de una versión retirada nunca satisface una cita nueva. Las respuestas/preguntas continúan fuera de la persistencia de memoria.

I0 fijará una revisión del catálogo documental además de la revisión de memoria: una consulta mixta captura y revalida ambas, con referencias tipadas que no confunden un fragmento documental con un recuerdo. La cuota documental es propia; no ampliar silenciosamente las cotas o reescribir unidades del núcleo personal para hacer caber archivos.

Durante el tramo sin API: extracción determinista, búsqueda textual acotada y citas comprobables contra fixtures. El adaptador de IA está ausente o falla cerrado; el doble solo se inyecta en pruebas/previews identificadas. No producir embeddings reales ni invocar interpretación/revisión/respuesta de la app actual por accidente. La recuperación semántica y la calidad de la respuesta quedan explícitamente pendientes hasta poder evaluarlas.

## Límites y retención propuestos para el primer piloto

Estos valores son propuestas conservadoras para I0, no capacidad acreditada ni autorización de almacenamiento remoto. Ajustarlos exige justificarlo y repetir casos de límites; no recortar sin aviso.

| Recurso | Propuesta inicial |
| --- | --- |
| Una entrega del sistema | Hasta 5 archivos, máximo 10 MiB por archivo y 25 MiB sumados; o un enlace HTTPS. Mezcla archivo+texto auxiliar se interpreta sin descargar dos veces; entradas ambiguas se aclaran |
| Texto de una fuente | Hasta 200 páginas de PDF, 200 000 caracteres extraídos y 128 fragmentos. Detectar el límite durante lectura/extracción; fuente parcial queda señalada y fuera de consultas generales por defecto |
| Fuente web | Una URL, máximo 3 redirecciones, 20 s totales de descarga y 10 MiB tras descompresión; sin seguir enlaces, ejecutar scripts o descargar multimedia |
| Procesamiento | Extracción aislada con límites medidos de CPU, RAM y tiempo; propuesta 30 s/256 MiB por tarea para comprobar en I0. Cola y concurrencia acotadas, sin reintentos que oculten un fallo del parser |
| Recuperación | Piloto de hasta 100 fuentes por cuenta; índice paginado y máximo 12 fragmentos por respuesta. Informar de alcance/cobertura y pedir acotar ante una petición exhaustiva que exceda las cotas |
| Temporal nativo | Copia privada estrictamente necesaria para la importación online, excluida de backups; caducidad lógica de 15 minutos. Limpiar al cancelar/salir de cuenta/terminar y en el siguiente arranque tras muerte de proceso; no cola offline |
| Temporal remoto | Limpiar binario/HTML bruto tras extraer o fallar; abandonados inutilizables a la hora. Barrido propuesto cada 15 minutos, verificado en emulador con reloj controlado. La caducidad lógica no equivale a borrado físico instantáneo |
| Canónico | Texto extraído hasta eliminación explícita; sin históricos de versiones sustituidas, binarios permanentes, backups/versionado de objetos nuevos o credenciales de Drive en fuentes |

Confirmar en I0 el mecanismo de limpieza y su objetivo operacional medible antes de activar almacenamiento real. Si no puede cumplirse, no anunciarlo como resuelto. La revocación impide servir contenido pendiente de purga.

## Seguridad y privacidad del nuevo límite

- Archivos/URLs y todo su contenido son datos no confiables. No ejecutar macros, scripts, XML con entidades externas, órdenes incrustadas ni instrucciones del documento para acceder a cuentas, claves o red.
- Validar MIME declarado y bytes reales; nombres saneados, lectura en streaming, límites para ZIP interno de DOCX/descompresión, páginas y tiempo. En Android leer solo `content://` con concesión vigente; rechazar `file://`, rutas aportadas como texto o acceso arbitrario a árboles de archivos. Un texto compartido sin archivo ni URL reconocible no se transforma automáticamente en recuerdo. Rechazar ejecutables, corrupción y fuentes vacías/cifradas con mensajes seguros. Un parser no hereda acceso a secretos o red.
- Descarga web en componente separado para la URL explícitamente compartida: solo HTTPS público, sin credenciales embebidas, puertos arbitrarios, IPs privadas/locales/link-local/metadata o redirecciones a ellas. Revalidar DNS/destino en cada salto y en la conexión para evitar rebinding; límites sobre bytes comprimidos y descomprimidos. Nada de permitir localhost en producción para facilitar tests.
- No reutilizar cookies/sesiones del navegador o credenciales de Google del acceso de Kioku para leer Drive. Un URI concede solo su acceso nativo temporal; una URL privada no concede autorización. No guardar URLs firmadas, query tokens, permisos temporales o cabeceras en logs/citas públicas.
- La subfase OAuth de Drive pide acceso mínimo a los archivos expresamente elegidos, con frontera de tokens separada y revocable. Elegir scopes y flujo móvil durante esa subfase, verificando requisitos oficiales; no dar por válidos scopes del login actual ni pedir permiso global de Drive por comodidad.
- Subidas temporales, objetos y colecciones nuevas con denegación por defecto; límites de admisión y operaciones ligadas a cuenta/generación. Revalidar también al hidratar una cita, terminar una respuesta y publicar un worker.
- Los mensajes distinguen permiso perdido, formato no admitido, documento sin texto, tamaño excesivo, página no accesible, conexión y tiempo agotado. No exponer excepciones del parser, URL privada, texto fuente o tokens en diagnósticos.
- Fallo de conexión conserva la identidad de operación y ofrece reintento explícito. Muerte del proceso puede exigir volver a compartir el archivo; no fingir un guardado ni introducir sincronización offline.

## Fases ejecutables y aceptación

| Fase | Entrega | Comprobación de cierre sin API |
| --- | --- | --- |
| I0 · Contratos y fixtures | Afinar este plan, ADR/FR/datos/API/retenciones, permisos de compartir y selector, parsers y cotas; corpus ficticio con resultados escritos previamente | Revisión semántica y checker documental; demostrar separación de fuentes/recuerdos y que ningún flujo de prueba puede construir un proveedor real |
| I1 · Compartir Android | `ACTION_SEND`/`ACTION_SEND_MULTIPLE`, ClipData/grants y recepción en arranque frío/caliente; selector de documentos; sesión y cancelación | App emisora/proveedor documental de pruebas con PDF/TXT/DOCX ficticios, URI caducado/revocado, múltiples adjuntos, navegación activa y dos cuentas ficticias; preservar instalación/sesión |
| I2 · Extracción aislada | TXT/MD, PDF con texto, DOCX; localizadores y cobertura | Corpus determinista de formatos válidos, vacíos, Unicode, tablas, cifrado, corrupción y límites. Ninguna llamada IA/red desde el extractor; recursos acotados medidos |
| I3 · Persistencia protegida | Admisión, área temporal, estados/idempotencia, publicación canónica e invalidación/purga | Emuladores positivos/negativos por cuenta y generación; cancelación/replay, respuesta perdida, worker tardío, duplicados, fallo durante commit y limpieza con reloj controlado |
| I4 · Drive | Primero archivo/copia y selector nativo; después enlace privado/exportación autorizada como subfase propia | Proveedor ficticio que simula streaming/caducidad/download/export. No navegar por Drive personal. Integración con la app/servicio Drive real queda pendiente hasta usar un archivo ficticio seleccionado expresamente y el acceso necesario |
| I5 · Webs | Recepción de URL, fetcher restringido, extracción de una página y estados de cobertura | DNS/transporte HTTP dobles con fixtures HTML/PDF: redirecciones, rebinding, privado/metadata, cookies, scripts, vacíos, compresión, duplicado y cambios de versión; pruebas sin internet de extracción |
| I6 · Consultas y gestión | Evidencias por fuente y combinadas, citas, actualización explícita y eliminación completa | Recuperación determinista y proveedor doble; notas personales frente a afirmaciones ajenas, cita ajena/retirada/inventada rechazada, cambio durante consulta y ausencia con cobertura limitada. La IA real sigue sin validarse |
| I7 · iOS y aceptación integrada | Share Extension y selector nativo, recorrido desde otras apps y recuperación de contexto | Compilar/probar en Mac/iPhone: proceso separado, NSItemProvider, acceso temporal, cuenta/atestación, cancelación, límites de tiempo/memoria de la extensión y borrado; no trasladar resultados Android a iOS |

Los contratos/backend se preparan antes de que la UI anuncie guardado. I1 puede usar dobles mientras I2/I3 se desarrollan; la demostración se identifica como ficticia. I4 por fichero puede avanzar junto a I1; I4 por enlace privado no bloquea I5. I6 con dobles depende de I2/I3 y fuentes de archivo/web disponibles. I7 se diseña desde I0 para no asumir que iOS abre siempre la app principal al compartir.

La prueba temprana de iOS debe resolver el traspaso temporal y la identidad entre extensión/contenedor (App Groups/Keychain y atestación por verificar). No se resuelve deshabilitando App Check, dejando tokens en archivos de intercambio o prometiendo que el login del contenedor autoriza directamente la extensión. Una subfase de Drive por fichero terminada tampoco acredita enlaces privados: el cierre de esa capacidad exige el recorrido de autorización/exportación I4 correspondiente.

Crear una rama independiente propuesta `codex/shared-sources` al iniciar implementación desde el punto que incluya el dictado aceptado. No integrar voz en main, cambiar de rama, desplegar, activar recursos o modificar código por preparar este documento. Conservar los pendientes R2/K5/K6; esta ampliación no los cierra.

## Matriz mínima de casos ficticios

| Grupo | Casos y resultado esperado |
| --- | --- |
| Archivos | Itinerario de Nara en PDF de tres páginas, manual de Lira en DOCX y notas UTF-8/MD con acentos: recuperar respuesta/cita exactas; encabezado/página correctos. Un PDF escaneado dice que necesita extracción no admitida, sin inventar texto |
| Procedencia | Un manual recomienda viajar y un recuerdo ficticio dice que el propietario no viajará: mantener atribuciones, sin convertir el manual en un hecho personal |
| Compartir | Kioku cerrada/abierta, lote de cinco, sexto rechazado, URI que caduca, proceso destruido, cancelación y cambio de cuenta: sin duplicados ni importación en otra cuenta |
| Drive | Proveedor sintético entrega bytes o solo enlace, deniega permiso o exige exportación: estados diferentes y explicación para enviar copia; no éxito basado solo en título/URL |
| Web | Dominios reservados `.test`/`.invalid` resueltos únicamente por el transporte de fixture; HTML legible, PDF enlazado directamente, texto parcial y error de login. Sin peticiones reales a esos dominios |
| Seguridad | Instrucciones incrustadas, MIME falso, DOCX expandido excesivo, nombres con rutas, URL con credenciales, IPv4/IPv6 privadas, redirección a metadata y DNS cambiante: rechazar sin acceso externo |
| Consulta/borrado | Fuente A y B con títulos iguales; una responde y la otra contradice; cita exacta por ID/revisión. Eliminar A, repetir pregunta y recibir callback antiguo: A no vuelve; B permanece |
| Red y coste | Pérdida de respuesta tras commit y reintento con mismo ID; spy de proveedor exige cero llamadas. Los dobles de respuesta no aparecen como servicio activo para el propietario |

Fixtures pequeños se versionan junto a su procedencia ficticia, huella y oráculo; no copiar archivos del propietario ni generar corpus con IA. Los formatos/casos límite se generan localmente y no ejecutan cargas peligrosas reales. Las pruebas de recursos se aíslan y tienen timeout del proceso.

## Validación, evidencia y punto de parada

Elegir comprobaciones por cambio según DEVELOPMENT_GUIDE y backend/README: documentación con `tooling/check-docs.ps1`; Kotlin con `tooling/mobile.ps1 mobileCheck` y compilaciones/test APK pertinentes; TypeScript/formato/pruebas configuradas y emuladores para autorización/persistencia. Instrumentación de Compartir real con la app emisora ficticia en Honor/Samsung, sin desinstalar/resetear. Resolver o documentar el puente de automatización Samsung antes de atribuirle resultados UI. iOS exige Mac/Xcode/dispositivo; no declarar validado por revisar Swift en Windows.

Separar en un informe futuro: casos previstos, ejecutados, fallidos y pendientes; compilación, emulador, receptor nativo y proveedor real. La app emisora demuestra el receptor, no que Drive exponga todos sus formatos; el transporte HTTP doble no acredita todas las webs. Inspeccionar por MCP las referencias Matrix pertinentes antes de tocar UI. Inventario consultado en esta planificación: no hay pantalla de importación diseñada; adaptar los componentes existentes sin atribuirle a Stitch una maqueta nueva ni editarlo sin autorización.

**Cierre alcanzable sin API:** recepción, extracción, persistencia/aislamiento/limpieza en emuladores, selección de evidencia y UI con dobles comprobados; sin activar una función ficticia como producto. **Pendiente posterior:** evaluación independiente de preguntas naturales con IA real, embeddings si se eligen, integración remota, costes/latencias, Drive real y iOS donde no haya herramientas. Mantener el proveedor bloqueado y entregar esa lista si no hay autorización/saldo; no gastar para completar la fase por obligación.

## Decisiones propuestas no bloqueantes para preparar el plan

- [PENDING DECISION] Conservar solo texto extraído (recomendado para el primer piloto) o archivar también el original. Archivar cambia almacenamiento, coste, privacidad y borrado; no se presupone autorizado. Resolver antes de I3 real.
- [PENDING DECISION] Actualizar documentos manualmente mediante reimportación/versionado (propuesta inicial) o sincronizar Drive/web. Sincronización introduce permisos persistentes y trabajos recurrentes y queda fuera de esta entrega.
- [PENDING DECISION] Aceptar las cotas/formatos iniciales propuestos o ajustarlos en I0 con casos medidos. La elección no bloquea redactar contratos ni crear fixtures; sí debe quedar fijada antes de aceptar entradas reales.

## Fuentes consultadas

Repositorio: alcance/reglas, requisitos/casos/flujos, arquitectura/ADR-013/015, modelo, contrato, seguridad/privacidad/retenciones, calidad/convenciones, guía de desarrollo, política documental y límites K5. No se utiliza contenido personal.

- [Android: recibir contenido compartido](https://developer.android.com/develop/ui/compose/sharing/receive).
- [Android: selector de documentos, incluidos proveedores en nube](https://developer.android.com/training/data-storage/shared/documents-files).
- [Apple: Share Extension](https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/Share.html). Su proceso y recorrido no equivalen a abrir automáticamente el contenedor.
- [Drive: descarga y exportación con permisos](https://developers.google.com/workspace/drive/api/guides/manage-downloads). Compartir un enlace y entregar un archivo son operaciones diferentes.

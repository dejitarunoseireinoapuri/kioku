# ADR-011 · Retirada canónica y control conversacional

- Estado: retirada y corrección selectivas por fuente activas y comprobadas en Honor; iOS y control conversacional completo pendientes.
- Fecha: 2026-11-14.
- Amplía [ADR-005](ADR-005-memory-evidence-and-deletion.md), [K2](ADR-009-text-capture.md) y [K3](ADR-010-text-query.md).

## Contexto

K4 debe permitir ofertas de guardado, correcciones y olvido por texto, sin convertir una pregunta en un hecho ni una instrucción almacenada en permiso. Una eliminación aislada de `memories` deja texto en la fuente; eliminar fuente y fragmentos sin revocación duradera permite que un reintento de captura vuelva a crearlos cuando haya caducado el recibo. K3 comprueba versiones, pero también debe rechazar una fuente retirada si un trabajador obsoleto reintrodujera datos canónicos.

## Decisión inicial y alcance del primer bloque

Se implementa primero una primitiva privada de retirada de **fuente completa**. `inspect` resuelve fuente y todos sus fragmentos (1–8), con versiones exactas de Firestore y vencimiento de cinco minutos. `retire` exige ese alcance explícito, propietario habilitado, IDs válidos y revisiones idénticas; cambia nada si caducó, faltan fragmentos, cambió alguno o existen conflictos de operación. No expone HTTP, herramienta de modelo ni controles móviles. Un futuro resolver conversacional deberá comprobar identidad/revocación/App Check y que el usuario ha pedido ese alcance antes de llamarla. La existencia de una fuente coincidente no acredita intención de borrado.

La transacción retira fuente y fragmentos con sus vectores/términos, limpia texto pendiente y recibos vinculados y crea una revocación sin texto. Reautoriza incluso un replay; mismo ID y entrada produce el mismo resultado, mientras que reutilizar ID con otro alcance falla. Las lecturas se completan antes de escribir y no hay proveedor dentro de la transacción, conforme a las [garantías oficiales de Firestore](https://firebase.google.com/docs/firestore/manage-data/transactions).

`accounts/{uid}/revocations/{sourceUuid}` no tiene TTL: contiene solo instante, ID opaco de retirada, número de fragmentos y digest de IDs/versiones/expiración, **no del contenido**. Bloquea replays y trabajadores anteriores aunque caduquen los recibos. Los recibos vinculados se sustituyen sin texto y caducan en 24 h; el de retirada dura siete días. La revocación permite recuperar el resultado de la misma retirada incluso después. No se promete borrar copias externas al almacén administrado o RAM de otros dispositivos con esta pieza.

Se prepara un único índice ascendente de colección para `operations.pending.turn.id`, necesario para encontrar sus recibos sin escanear la cuenta. La exclusión del mapa `pending` y del texto permanece; únicamente su UUID anula la herencia de esa exclusión, conforme a la [documentación de índices por subcampo](https://firebase.google.com/docs/firestore/query-data/index-overview). El emulador no acredita disponibilidad de índices reales: definición comprobada localmente, despliegue/preparación remotos pendientes antes de exponer retiradas.

Captura comprueba la revocación al iniciar, recuperar y confirmar; fuente la comprueba en cada lectura. Consulta la comprueba al recuperar y al terminar además de las versiones actuales. Se invalida únicamente la concesión vinculada al trabajo retirado; una captura ajena al alcance no se cancela. Las consultas en curso con evidencia retirada fallan antes de devolverla.

## Continuación · selección explícita desde la fuente

Se implementan `getSourceDetails` y `changeMemory`. El propietario selecciona uno o varios IDs actuales en una fuente; la UI permite corregir un dato con una afirmación completa, olvidar un dato o retirar expresamente todo el texto. La selección explícita resuelve autorización de alcance sin esperar al futuro resolver conversacional. Los endpoints no convierten instrucciones almacenadas en órdenes. Una versión opaca SHA-256 cubre los metadatos de versión de fuente y todos sus fragmentos, nunca su contenido. Un cambio previo o concurrente invalida el alcance entero.

La retirada selectiva elimina cada aparición literal de las citas elegidas y conserva los bytes ajenos. Si afecta evidencia de un dato conservado, falla sin mutación. La revisión semántica adicional contrasta alcance actual, preservación y ausencia del objetivo reconstruible. Una negativa pide concretar sin guardar ni borrar. Se conserva el modelo/perfil acordado, Sol medio, y `store:false`. Una corrección se extrae/revisa mediante M0 como nueva afirmación con fecha/zona actuales; no se inventa una corrección a partir de un resumen. Fuera de la transacción se prepara como máximo una fuente conservada y una corregida. Una petición de cambio ambiguo no se interpreta como autorización para retirar todo el relato.

El commit revoca el original y retira todos sus fragmentos/proyecciones; inserta únicamente la versión conservada y la corrección con IDs nuevos. Los datos ajenos mantienen recepción, contexto temporal y vector, incrementando revisión; la corrección incrementa la revisión del dato sustituido y usa recepción nueva. `sourceKind` distingue `retained` y `correction`, además del original sin esa etiqueta. No guarda una copia recuperable del texto retirado ni la presenta como original intacto. La primitiva completa sigue privada; los callables validan Google, cuenta, revocación y App Check y el servidor conserva autoridad de escritura.

Se comparte la concesión costosa de K2/K3 para evitar cambios paralelos. Un recibo de control terminal conserva hash de entrada ligado al ID, resultado, referencias actuales y caduca en siete días; nunca guarda la orden/corrección. Recuperar reautoriza y vuelve a comprobar fuentes vigentes; no repite IA ni commit. Revocación sin contenido y sin TTL bloquea trabajadores antiguos. `runtime/memory.revision`, entero monótono sin texto ni TTL, cambia en la misma transacción. Cliente y consulta usan esa revisión para descartar contextos anteriores; el cliente actualizado oculta datos al pasar a segundo plano y revalida antes de restaurarlos, enviar o abrir una fuente. Una comprobación al enviar preserva el borrador nuevo. No promete borrar RAM ajena instantáneamente ni limpiar clientes antiguos no actualizados.

Estados móviles `Loading/Missing/Ready/Working/Done`, generaciones y comandos estables conservan borradores durante errores/recreación. La confirmación remota limpia chat/contexto/fuentes anteriores antes de presentar éxito. La pantalla fuente distingue texto conservado y corrección de original. Reintentar comprueba la misma orden; volver/cancelar no promete anular un commit ya iniciado. [Contrato](../../04-api/API_CONTRACT.md) y [evidencia](../../09-planning/K4_VALIDATION.md).

## Secuencia restante de K4

1. Completar la validación iOS en Mac. Activación autorizada de la frontera selectiva e índice READY, rechazo sin credenciales y recorrido nativo productivo en Honor ya comprobados; los casos locales/sintéticos no sustituyen esas evidencias separadas.
2. Resolver conversacional y propuestas: solo orden explícita actual autoriza corrección/olvido; nuevo dato en Preguntar requiere oferta aceptada, con versión, caducidad e idempotencia. Texto recuperado y salidas del modelo siguen siendo datos no confiables.
3. Integrar el resolver y las propuestas en los estados/fronteras compartidos ya implementados, conservando las mismas garantías de limpieza y revisión. Comprobar distinción entre corrección y cambio real con el tiempo a través de ese nuevo recorrido.
4. Ampliar la evaluación previa para esos recorridos nuevos e iOS en Mac. La evaluación selectiva con proveedor real ya pasó siete casos fijados antes de ejecutar; Android usa Honor con fixtures. Activación de endpoints/recursos productivos requiere autorización concreta; no se deduce de este ADR.

## Alternativas y límites

No se usa borrado suave con contenido o copias históricas, ni TTL para revocaciones. Tampoco una búsqueda global de todos los datos de la cuenta para cada operación: fuente máxima ocho fragmentos y dos consultas de recibos limitadas a nueve documentos cada una, que rechazan exceso en lugar de limpiar parcialmente. El ámbito actual no elimina hechos repetidos en otras fuentes ni resuelve referencias naturales. El recorrido fuente está activo; no se declara K4 cerrada hasta completar los bloques restantes y sus pruebas. [Evidencia](../../09-planning/K4_VALIDATION.md).

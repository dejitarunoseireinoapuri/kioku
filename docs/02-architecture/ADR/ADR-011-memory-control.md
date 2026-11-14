# ADR-011 · Retirada canónica y control conversacional

- Estado: primera frontera interna implementada; control conversacional completo pendiente.
- Fecha: 2026-11-14.
- Amplía [ADR-005](ADR-005-memory-evidence-and-deletion.md), [K2](ADR-009-text-capture.md) y [K3](ADR-010-text-query.md).

## Contexto

K4 debe permitir ofertas de guardado, correcciones y olvido por texto, sin convertir una pregunta en un hecho ni una instrucción almacenada en permiso. Una eliminación aislada de `memories` deja texto en la fuente; eliminar fuente y fragmentos sin revocación duradera permite que un reintento de captura vuelva a crearlos cuando haya caducado el recibo. K3 comprueba versiones, pero también debe rechazar una fuente retirada si un trabajador obsoleto reintrodujera datos canónicos.

## Decisión y alcance de este bloque

Se implementa primero una primitiva privada de retirada de **fuente completa**. `inspect` resuelve fuente y todos sus fragmentos (1–8), con versiones exactas de Firestore y vencimiento de cinco minutos. `retire` exige ese alcance explícito, propietario habilitado, IDs válidos y revisiones idénticas; cambia nada si caducó, faltan fragmentos, cambió alguno o existen conflictos de operación. No expone HTTP, herramienta de modelo ni controles móviles. Un futuro resolver conversacional deberá comprobar identidad/revocación/App Check y que el usuario ha pedido ese alcance antes de llamarla. La existencia de una fuente coincidente no acredita intención de borrado.

La transacción retira fuente y fragmentos con sus vectores/términos, limpia texto pendiente y recibos vinculados y crea una revocación sin texto. Reautoriza incluso un replay; mismo ID y entrada produce el mismo resultado, mientras que reutilizar ID con otro alcance falla. Las lecturas se completan antes de escribir y no hay proveedor dentro de la transacción, conforme a las [garantías oficiales de Firestore](https://firebase.google.com/docs/firestore/manage-data/transactions).

`accounts/{uid}/revocations/{sourceUuid}` no tiene TTL: contiene solo instante, ID opaco de retirada, número de fragmentos y digest de IDs/versiones/expiración, **no del contenido**. Bloquea replays y trabajadores anteriores aunque caduquen los recibos. Los recibos vinculados se sustituyen sin texto y caducan en 24 h; el de retirada dura siete días. La revocación permite recuperar el resultado de la misma retirada incluso después. No se promete borrar copias externas al almacén administrado o RAM de otros dispositivos con esta pieza.

Se prepara un único índice ascendente de colección para `operations.pending.turn.id`, necesario para encontrar sus recibos sin escanear la cuenta. La exclusión del mapa `pending` y del texto permanece; únicamente su UUID anula la herencia de esa exclusión, conforme a la [documentación de índices por subcampo](https://firebase.google.com/docs/firestore/query-data/index-overview). El emulador no acredita disponibilidad de índices reales: definición comprobada localmente, despliegue/preparación remotos pendientes antes de exponer retiradas.

Captura comprueba la revocación al iniciar, recuperar y confirmar; fuente la comprueba en cada lectura. Consulta la comprueba al recuperar y al terminar además de las versiones actuales. Se invalida únicamente la concesión vinculada al trabajo retirado; una captura ajena al alcance no se cancela. Las consultas en curso con evidencia retirada fallan antes de devolverla.

## Secuencia restante de K4

1. Transformación selectiva de fuentes compartidas y correcciones con revisión: preservar asuntos ajenos, distinguir sustitución de dato incorrecto y cambio real con el tiempo, reconstruir derivados vigentes y retirar originales obsoletos en el mismo commit. Si no se puede resolver el alcance, aclarar sin ejecutar. La primitiva completa no puede usarse como sustituto de borrar un fragmento.
2. Resolver conversacional y propuestas: solo orden explícita actual autoriza corrección/olvido; nuevo dato en Preguntar requiere oferta aceptada, con versión, caducidad e idempotencia. Texto recuperado y salidas del modelo siguen siendo datos no confiables.
3. Fronteras HTTPS autenticadas y cliente compartido: estados confirmados, limpieza de chat/contexto/fuentes/cachés tras mutaciones, generaciones y respuestas tardías. Revalidar otros dispositivos antes de presentar evidencia anterior.
4. Evaluación sintética fijada antes de llamadas reales, casos positivos/negativos de seguridad/concurrencia y revisión Android en Honor e iOS en Mac. Activación de endpoints/recursos productivos requiere autorización concreta; no se deduce de este ADR.

## Alternativas y límites

No se usa borrado suave con contenido o copias históricas, ni TTL para revocaciones. Tampoco una búsqueda global de todos los datos de la cuenta para cada operación: fuente máxima ocho fragmentos y dos consultas de recibos limitadas a nueve documentos cada una, que rechazan exceso en lugar de limpiar parcialmente. El ámbito actual no elimina hechos repetidos en otras fuentes ni resuelve referencias naturales. No se declara K4 implementada ni usable desde la app hasta completar los bloques restantes y sus pruebas. [Evidencia](../../09-planning/K4_VALIDATION.md).

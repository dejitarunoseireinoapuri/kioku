# ADR-013 · Núcleo v2 en servidor y aplicación

Estado: activada e instalada en Honor; metadatos comprobados sin inferencia real. Evidencia y límites en [R3](../../09-planning/R3_INTEGRATION_VALIDATION.md). Fecha: 2026-11-17.

## Contexto

El propietario pide usar en la aplicación el núcleo de ADR-012 y empezar vacío, borrando los recuerdos anteriores. La API OpenAI queda sin saldo: no se autorizan nuevas pruebas pagadas. R2 conserva sus límites de latencia y validación independiente pendientes; la integración no los da por resueltos.

## Decisión

Una callable `memoryV2` recibe un sobre v2 con operación y generación de cuenta. Google, App Check, UID vinculado y autorización del servidor permanecen obligatorios. `getConfiguration` mantiene v1. Los endpoints de memoria v1 quedan cerrados tras la activación, también en sus transacciones finales.

El servidor compila el núcleo y el intérprete revisado de `prototypes/memory-core`. Persiste documentos individuales de unidades, fragmentos, ocurrencias, relaciones y proyecciones. Lee un catálogo acotado y confirma diferencias atómicas con revisión global; no persiste el snapshot completo ni un archivo del texto original. Conserva admisiones sin contenido para impedir que reaparezca una operación cuyo recibo temporal ya caducó.

La identidad UUID del recuerdo permanece estable al corregirlo. La gestión móvil usa grupos de hasta ocho identidades; sus textos se forman desde el canónico actual. Al corregir u olvidar, se sustituyen los identificadores de los grupos afectados y el móvil deshabilita sus mensajes originales en la sesión RAM. Los avisos con nombres siguen siendo presentación transitoria.

El olvido de IDs ya resueltos no usa IA. La petición sale después del diálogo local existente, incluye la versión actual y no amplía automáticamente el alcance. Dependencias o coincidencias inciertas bloquean el cambio y piden concreción. Retirar solo un relato que comparte identidades requiere seleccionar el dato y confirmar el alcance global; no se convierte silenciosamente en un borrado global.

Planes conversacionales firmados mediante huellas de contenido y generación, aceptación vinculada a una petición, aclaraciones temporales y revisión final impiden replays y trabajo obsoleto. Las preguntas y respuestas no se guardan. Cualquier mutación purga las operaciones pendientes y los planes anteriores. La clave sigue exclusivamente en Secret Manager, con el perfil Sol alto del prototipo activado para este núcleo.

## Alternativas

Se descarta migrar o archivar recuerdos por la decisión expresa del propietario. También se descartan ejecutar el prototipo como almacén RAM, introducir un snapshot monolítico o conservar M0 como fallback silencioso.

## Consecuencias y límites

El cliente conserva el comando RAM al fallar la conexión. Puede renovar una preparación terminada sin decisión aplicada o una lectura terminal, una sola vez por ejecución; las escrituras inciertas siempre mantienen ID. La renovación sustituye el ID del comando retenido para evitar perder la nueva operación si vuelve a cortarse la conexión. No añade cola offline, almacenamiento persistente ni llamadas periódicas. La evidencia y los permisos siguen bajo autoridad del servidor actual.

La clasificación de intención precede a la carga de contenido canónico. Una puerta determinista acotada para continuaciones aisladas sin contexto puede pedir tema sin crear proveedor; la clasificación semántica restante reutiliza la llamada de intención existente. Solo los cambios necesitan catálogo durante el encaminamiento; las consultas leen evidencia posteriormente. La revisión y autorización se contrastan al terminar incluso cuando no se leyó catálogo. El ajuste v2 no altera prompts ni benchmarks históricos M0.

Refinamiento del 17 de noviembre: las consultas exponen referencias por unidad citada, resueltas como vistas calculadas del canónico y vinculadas a generación/revisiones. No amplían la gestión a otros datos del mismo relato. Los grupos de captura conservan su función desde el guardado. Corrección/olvido revocan y sustituyen también las vistas individuales, dentro del límite compartido de 128 sustituciones. No hay migración ni copia persistida adicional.

El límite operativo inicial es 256 unidades y 4096 documentos canónicos, además de las comprobaciones de capacidad de borrado. Recuperación léxica con expansión del modelo y hasta 32 candidatos; una lista exhaustiva truncada pide acotar. No demuestra mutaciones a escala de 10 000 unidades ni aceptación independiente nueva de IA.

El arranque vacío usa mantenimiento y eliminación paginada de las colecciones anteriores. Cuenta, identidad, firma, configuración de clave y uso permanecen. La operación administrativa no se exporta como callable. Las pruebas con proveedor doble no prueban inferencia real; iOS requiere Mac/Xcode.

# Fiabilidad de consultas · 20 de noviembre de 2026

Rama `codex/query-reliability`, basada en `main` (`c3b5d77`), sin incorporar Fuentes. Revisión publicada y activada únicamente en `memoryV2` con autorización expresa posterior; teléfonos sin reinstalar. No se han consultado recuerdos reales ni hecho llamadas a la API de pago.

## Incidente y correcciones

El propietario notificó respuestas distintas a una petición imperativa y su pregunta equivalente. El equivalente ficticio con una profesora y una recomendación musical respondió correctamente en ambas formas antes del cambio: **no se ha reproducido ni establecido la causa exacta del incidente original**. No se copiaron su pregunta ni su contenido personal a pruebas.

La evaluación dirigida sí detectó dos problemas distintos:

- Una consulta por ubicación y marca de un paraguas, con ubicación conocida y marca ausente, era rechazada por desacuerdo entre respuesta y revisión (`ANSWER_REVIEW_coverage`). Ahora ambas fases exigen responder la parte respaldada y señalar expresamente lo desconocido. Preguntar solo por la marca sigue dando ausencia, sin divulgar recuerdos vecinos.
- «He olvidado lo que me dijo Ada. ¿Me recuerdas qué me recomendó ayer?» se clasificaba como oferta de guardar un hecho. La intención distingue ahora expresar falta de recuerdo de contar que se dejó un objeto en algún sitio o de ordenar borrar recuerdos. No añade otra inferencia ni omite la confirmación de olvido.

Se refuerzan además tres fronteras: normalización limitada de peticiones inequívocas sin reescribir nombres, negación, fechas o citas; separación explícita de pregunta actual y preguntas anteriores; y distinción entre fecha de una comunicación y fecha de la actividad recomendada. Se descarta el contexto de una revisión obsoleta **antes** de normalizar y recuperar. El contexto interpretativo nunca acredita hechos y una pregunta actual completa prevalece.

Los paquetes de búsqueda, respuesta y revisión usan la misma pregunta normalizada. Las consultas grandes mantienen el contexto para resolver elipsis, conservando paginación, cotas, precisión y restricciones de exhaustividad. No cambian DTO públicos, almacenamiento, autorización, evidencia vigente, revalidación final ni número de inferencias productivas.

## Evaluación semántica mediante la suscripción

Se empleó la CLI oficial de Codex autenticada con ChatGPT, modelo `gpt-6.1-sol`, razonamiento `high`, herramientas deshabilitadas y salida estructurada validada. El adaptador de evaluación elimina variables de claves/proveedores, ignora configuración de usuario, exige login ChatGPT y rechaza eventos de herramientas. No carga `.env`, no usa el proveedor API ni accede a Firebase. Todo el corpus es ficticio. Los informes locales contienen IDs, estados, huellas y contadores, no respuestas ni preguntas personales.

| Serie | Resultado | Inferencias de suscripción | API de pago |
| --- | ---: | ---: | ---: |
| Consulta inicial, 9 casos dirigidos | 8/9 | 18 | 0 |
| Consulta ajustada, 17 casos | 17/17 | 32 | 0 |
| Intención inicial, 6 casos | 5/6 | 6 | 0 |
| Intención ajustada, 8 casos | 8/8 | 8 | 0 |

Una comprobación inicial del adaptador utilizó otra inferencia de suscripción. Los casos de consulta cubren seis formulaciones equivalentes, contexto útil y ajeno, fechas de intervención/registro/actividad futura, elipsis, respuesta parcial, ausencia, memoria vacía y un recuerdo olvidado que no debe reaparecer. La serie de intención incluye controles de hecho nuevo y de olvido total. Las métricas originales se conservan sin recalificar fallos en `local-data/query-reliability/`, ignorado por Git, y en una [copia de métricas sin contenido](evidence/query-reliability-20261120.json) versionada para revisión.

Se intentó adicionalmente el recorrido de interpretación de una captura ficticia y consulta con `query-capture-run.ts`. Dos ejecuciones no completaron la primera inferencia de la CLI (`SUBSCRIPTION_INFERENCE_FAILED`, una invocación cada una); no alcanzaron guardado ni consulta. No se ha determinado la causa de esa indisponibilidad y no se cuenta como fallo semántico ni como prueba superada. Queda pendiente acreditar ese recorrido completo con inferencia de suscripción. No se recurrió a la API de pago para sortearlo. Total: 67 solicitudes de inferencia a la CLI, incluidas prueba inicial y estos dos intentos; no es un contador de inferencias completadas ni de tokens facturados.

**Límites:** estas series son regresiones dirigidas y expuestas al desarrollo, no una reserva independiente ni una estimación de tasa de acierto general. La CLI aporta su propio entorno e instrucciones y no reproduce los límites de salida de la API productiva; `productionEquivalent:false` queda explícito en cada informe. No acredita latencia productiva, el incidente original, audio, iOS ni comportamiento remoto. No se ha sustituido la configuración del proveedor de producción.

## Comprobaciones deterministas

TypeScript raíz y backend correctos; 245 pruebas raíz, 44 pruebas unitarias backend y 138 de emuladores Auth/Functions/Firestore correctas. Se eliminaron únicamente artefactos generados de `backend/lib` antes de compilar: una ejecución inicial incluía tests compilados obsoletos de Fuentes y no se contabiliza como evidencia de esta rama. El emulador emplea modelos simulados y datos ficticios, sin API.

Las nuevas pruebas comprueban equivalencia del paquete normalizado, JSON no reconocido conservado como dato, separación del contexto, búsqueda en catálogo grande, descarte de revisión antigua y el servicio de consulta v2 con sus dos fases simuladas. Los 138 casos incluyen controles positivos y negativos existentes de cuenta, autorización y revocación. No se modificaron código móvil ni contratos de red; no se presentan pruebas Android/iOS como ejecutadas en esta revisión.

## Reproducción sin API

Desde la raíz con las herramientas ya preparadas:

```powershell
node tooling/m0.mjs check
node tooling/m0.mjs test
node tooling/m0.mjs format:check
node tooling/backend.mjs build
node tooling/backend.mjs test
node tooling/backend.mjs format:check
pwsh -NoProfile -File tooling/backend-emulators.ps1
pwsh -NoProfile -File tooling/check-docs.ps1
```

Solo cuando se autorice gastar cuota de suscripción, y comprobando su disponibilidad, las pruebas semánticas se ejecutan directamente, sin comandos `--live` ni variables de API:

```powershell
$env:KIOKU_CODEX_EXECUTABLE = (Get-Command codex).Source
node prototypes/memory-core/evaluation/query-reliability-run.ts --run nueva-serie-consultas
node prototypes/memory-core/evaluation/query-intent-run.ts nueva-serie-intencion
```

Cada identificador debe ser nuevo; no se sobrescriben resultados. El proveedor limita cada ejecución a 48 inferencias, 120 segundos por proceso y salida acotada. Las claves permanecen fuera de este flujo. Las pruebas no sustituyen la autorización específica para desplegar: el propietario autorizó después su subida y activación exclusivamente en `memoryV2`, sin un APK nuevo.

## Activación autorizada

El propietario autorizó expresamente publicar la rama y actualizar únicamente el servicio de memoria. Subida confirmada a `dejitarunoseireinoapuri/kioku`; código desplegado `f388c52`. Despliegue parcial `functions:kioku:memoryV2`, proyecto `kioku-9454f`, región `europe-west1`. Estado remoto **ACTIVE**, revisión **memoryv2-00006-seq**, actualización `2026-11-20T09:08:35.822185828Z`, Node 22, identidad de ejecución esperada y máximo una instancia. Compilación y formato del predespliegue correctos.

Comparación de metadatos antes/después: las otras **once funciones** conservan sus revisiones y fechas. No se desplegaron reglas, índices, otros servicios ni APK; no se leyó, migró o borró memoria. La app vigente sigue en el alcance anterior a Fuentes; `referenceSources` conserva su revisión. Una petición ficticia sin autenticación devuelve **401** antes de acceder a datos o crear proveedor. Esto comprueba el rechazo anónimo, no el acceso de una cuenta válida, la calidad de respuestas productivas ni el incidente original. Comprobaciones y activación: **cero llamadas de IA/API**.

La primera consulta de metadatos con gcloud no pudo autenticarse; se utilizó la sesión Firebase existente mediante su biblioteca oficial, sin exportar credenciales ni solicitar otras. El rechazo de subida de la entrega anterior quedó resuelto mediante la autorización expresa del propietario. Los pendientes semánticos y del recorrido de captura descritos arriba se mantienen.

## Seguimiento de velocidad

Revisión de servidor preparada sobre `4fa86b6`. El cliente llama primero a `route` y después a `query`. Una pregunta ordinaria con recuerdos hace tres inferencias secuenciales: intención, respuesta y revisión. Con más de 32 unidades, la búsqueda añade una inferencia de términos. La prueba conserva estas fases y verifica las referencias de la respuesta.

El servidor agrupa lecturas de documentos independientes y consulta el catálogo por pares dentro de una transacción de solo lectura. Conserva el límite conjunto de documentos, las comprobaciones de revocación y la revisión final. Al abrir la app, `details` sin identificador lee únicamente el propietario y el estado de la memoria, suficiente para comprobar su revisión. El cliente de Secret Manager se reutiliza mientras la instancia esté activa. Cada solicitud vuelve a leer la referencia vigente y pide esa versión al gestor; la conexión compartida no conserva la clave entre solicitudes.

Comparación en el mismo emulador con el backend desplegado (`4fa86b6`, con el código de `f388c52`) y la revisión propuesta. Por combinación de catálogo y versión, se hicieron cinco ejecuciones de calentamiento y 30 medidas, alternando el orden. El modelo simulado devolvió la misma respuesta, referencia y secuencia de fases. Se midieron `route` y `query` desde su entrada al servidor, y por separado la lectura de revisión del arranque. Los tiempos son milisegundos con percentiles por rango más próximo.

| Camino | Unidades | p50 anterior → nuevo | p95 anterior → nuevo |
| --- | ---: | ---: | ---: |
| Interpretación y consulta | 1 | 426 → 298 | 441 → 315 |
| Interpretación y consulta | 40 | 517 → 357 | 532 → 362 |
| Lectura de revisión | 1 | 144 → 14 | 158 → 15 |
| Lectura de revisión | 40 | 156 → 14 | 160 → 16 |

La mediana de la consulta en el servidor baja un 30–31 %. La medición no incluye el viaje del móvil, autenticación HTTP, Secret Manager, ni la espera por el proveedor real. El ahorro de reutilizar la conexión al gestor de claves queda sin cuantificar; el porcentaje no estima la mejora total que verá el usuario en producción.

Se comparó la redacción con razonamiento alto y medio en seis casos ficticios del corpus de consultas. Se alternó el orden y la revisión mantuvo Sol alto. Ambos perfiles pasaron 6/6, incluidos una consulta parcial y un recuerdo retirado. Mediana de redacción de **4,82 s** en alto y **4,58 s** en medio. Medio fue más rápido en tres casos y más lento en tres. La diferencia no acredita una mejora repetible y se conserva el perfil actual. Las 24 inferencias completadas se ejecutaron mediante la suscripción a ChatGPT. Los tiempos incluyen el proceso de la CLI y no representan la latencia de producción. Reproducción con una sesión de ChatGPT preparada como arriba: `node prototypes/memory-core/evaluation/query-speed-run.ts`.

Pruebas finales: 245 raíz, 44 unitarias de servidor y 138 de emuladores correctas. El caso de arranque comprueba que se devuelve la revisión aunque exista un documento de catálogo inválido, y verifica el rechazo anónimo y de generación obsoleta. Las pruebas de consulta siguen cubriendo la invalidación de evidencia durante la generación. Cero llamadas a la API de pago.

Con autorización expresa, el commit `0e708cd` se publicó y activó de forma parcial en `kioku:memoryV2`. El servicio está **ACTIVE** en la revisión `memoryv2-00007-jip` desde el `2026-11-20T09:46:08.816107457Z`. Conserva Node 22, la cuenta de ejecución prevista y el máximo de una instancia. Los metadatos confirman las mismas revisiones y fechas para las otras once funciones. La petición ficticia `details` sin autenticar recibió HTTP 401 antes de acceder a datos o IA. El despliegue y la comprobación consumieron cero llamadas de IA. La nueva versión sirve al cliente ya instalado. La latencia completa desde el móvil con el proveedor de producción queda pendiente de medida.

## Menos llamadas al contar y preguntar

Revisión de servidor preparada sobre `3945b6d`. Con el modo explícito ya seleccionado, el servidor puede resolver la intención de enunciados completos de una sola cláusula. En Contar se admiten ubicaciones afirmativas de objetos del conjunto reconocido. En Preguntar se admiten formas cerradas sobre planes, ubicación o color de objetos y comunicaciones de hoy o ayer. Se aplica la normalización de peticiones existente, conservando el mensaje original en el recorrido. El reconocimiento exige que coincida toda la frase. Las negaciones, dudas, citas, mensajes mixtos, referencias sin antecedente y órdenes que queden fuera del conjunto siguen la interpretación existente.

En Contar, un plan `tell` propone pasar al guardado. Ahora la revisión independiente que precede a la escritura comprueba en la misma llamada la fidelidad y la intención de aportar contenido. La interpretación genera aclaración ante una pregunta sin hechos, una orden de cambio o una ambigüedad real. La revisión rechaza una ficha engañosa aunque el clasificador inicial haya propuesto `tell`. La corrección, el olvido y las ofertas conservan su revisión en la ruta. Se mantienen las comprobaciones de generación/época, alcance, autorización final y recibos de operación. El DTO móvil y el modelo `gpt-6.1-sol` alto se conservan.

| Recorrido sin búsqueda adicional de catálogo | Llamadas antes → ahora | Fases evitadas en la muestra de suscripción |
| --- | ---: | ---: |
| Contar un relato que requiere interpretación de intención | 4 → 3 | Revisión de la ruta, 4,88 s |
| Contar una ubicación sencilla reconocida | 4 → 2 | Interpretación y revisión de la ruta, 9,98 s combinados |
| Preguntar con una forma reconocida | 3 → 2 | Interpretación de la ruta, 4,87–5,01 s |
| Preguntar con una forma fuera del conjunto | 3 → 3 | Sin cambio en fases de inferencia |

Los recuentos corresponden a recorridos sin aclaración y con evidencia suficiente para llegar a las fases indicadas. La búsqueda de un catálogo de más de 32 unidades puede añadir una inferencia. Los tiempos miden aisladamente las fases antiguas que ya no se necesitan, con el mismo perfil alto mediante la CLI de suscripción y casos ficticios. Incluyen el proceso de la CLI; no son una comparación desde el móvil ni garantizan ahorros iguales en producción. La revisión automática bloqueó el ensayo con razonamiento bajo por la política vigente del proyecto. No se ejecutó.

En la suscripción pasaron seis pruebas de captura y cinco consultas independientes del corpus conocido. En dos de esas seis capturas se verificó además la cadena completa de interpretar, guardar en el almacén de prueba y preguntar con la referencia correcta. Se comprobaron una cita literal con una orden dentro, una pregunta, una petición de corrección y una de olvido introducidas en el recorrido de guardado. Las tres últimas pidieron aclaración sin ficha. Fueron 26 inferencias de validación y 7 de medición de las fases previas. Cero API de pago, datos exclusivamente ficticios y ninguna lectura remota de memoria. Reproducción semántica bajo las condiciones de suscripción ya documentadas: `node prototypes/memory-core/evaluation/turn-speed-run.ts`.

Verificación local: 245 pruebas raíz, 46 unitarias de servidor y 140 de emuladores correctas. Las pruebas verifican que un plan directo no escriba por sí solo, que un rechazo de la revisión impida el guardado, que una captura revisada confirme una sola unidad, y que las preguntas ambiguas y las que presentan dos intenciones deriven al recorrido previsto. TypeScript, formato y comprobación documental correctos.

El propietario autorizó publicar `8af38e3` y activar exclusivamente `memoryV2`. El servicio está **ACTIVE** en `memoryv2-00008-vug` desde `2026-11-20T10:22:39.983108234Z`, con Node 22, la identidad de ejecución prevista y el máximo de una instancia. La comparación de metadatos confirma que las otras once funciones conservan su revisión. Una petición ficticia `route` sin autenticar recibió HTTP 401 antes de leer recuerdos o llamar a IA. Activación y comprobación consumieron cero llamadas de IA. La app instalada es compatible y la latencia total de producción queda pendiente de medir.

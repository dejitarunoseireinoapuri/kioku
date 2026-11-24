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

## Comparación con GPT-6.2 Sol ligero

El propietario autorizó probar GPT-6.2 Sol con razonamiento `low` de forma aislada. El catálogo de la suscripción confirmó ese modelo y esfuerzo. El control sigue siendo GPT-6.1 Sol `high`. La variante sustituye únicamente la preparación de la captura y la redacción de respuestas. La revisión independiente usa GPT-6.1 Sol `high` en ambos recorridos. Cada variante recibe las mismas instrucciones, evidencia y esquema, con orden alternado entre pares.

El ensayo mide la generación por separado y el recorrido con revisión. Los casos de Contar validan ubicación, atribución, fechas de dos asuntos separados, negación, preservación de una cita, aclaración de un dato incompleto y rechazo de un olvido como captura. Para los guardados aceptados se prueba también el almacén RAM. Las consultas contrastan exactitud y referencias actuales: expresiones equivalentes, contexto ajeno o elíptico, fecha de comunicación distinta de fecha de registro o de actividad, respuesta parcial y contenido retirado. Se comprueban campos y referencias frente a oráculos separados de los paquetes enviados al modelo.

Reproducción con la sesión de ChatGPT y `KIOKU_CODEX_EXECUTABLE` preparados como arriba: `node prototypes/memory-core/evaluation/light-sol-run.ts`. Solo se prueban fixtures ficticias, con modelos de la suscripción y sin claves de API. Los tiempos incluyen la CLI y no incluyen autenticación móvil, Firestore, el paso previo de intención ni el transporte a la API productiva. Por sí solo el ensayo no valida límites de salida o latencia de producción.

| Recorrido con revisión | Correctos actual / ligero | Mediana actual | Mediana ligero | Mediana del ahorro por par | Pares más rápidos con ligero |
| --- | ---: | ---: | ---: | ---: | ---: |
| Guardar o aclarar | 7/7 · 7/7 | 16,47 s | 14,74 s | 0,74 s | 4/7 |
| Responder | 7/7 · 7/7 | 10,03 s | 9,71 s | 0,60 s | 6/7 |

La mediana del ahorro se calcula sobre las diferencias de cada caso, por lo que puede diferir de restar las dos medianas de tiempo. En la fase de generación por separado, el ligero ganó 5/7 pares de captura y 6/7 de consulta, con ahorros medianos por par de 0,76 y 0,65 s. Se completaron 56 inferencias de suscripción, 42 con el perfil actual y 14 con el ligero, con cero llamadas a la API de pago. El [registro de tiempos y resultados](evidence/light-sol-comparison-20261120.json) conserva cada par sin contenido de preguntas, recuerdos o respuestas.

Decisión de esta prueba: el ligero mantuvo los resultados de los 14 casos, pero el ahorro típico en el recorrido medido fue menor de un segundo. Se conserva el perfil actual de producción. Este resultado es una comparación dirigida, con una muestra por caso y variación entre ejecuciones. Las 245 pruebas Node, TypeScript, formato y documentación pasaron. La integración y la latencia completa de la app siguen pendientes de validación si se decide cambiar de perfil.

## Prototipo de ubicaciones sin IA

El prototipo se habilita solo en el proyecto ficticio `demo-kioku-local` con Auth, Functions y Firestore en los emuladores locales. Usa las operaciones HTTP habituales (`route`, `submit`, `query`, `details`, `change`). El cliente no puede activar el prototipo ni cambiar sus límites. Producción sigue usando el recorrido existente.

En Contar, una afirmación actual completa en primera persona, como la de un objeto en un cajón, se convierte en un borrador canónico con un fragmento literal íntegro. Una repetición inequívoca conserva la identidad y añade su propia procedencia. La transacción existente valida autorización, generación, revisión e idempotencia antes de confirmar. En Preguntar, una pregunta completa por la ubicación actual devuelve el lugar respaldado y el enlace de gestión de una sola unidad. Varias coincidencias compatibles o una identidad que no se puede distinguir piden concretar. Se responde ausencia solo cuando se puede interpretar el catálogo completo para ese alcance.

Una corrección explícita desde Gestión admite la frase completa con el mismo objeto y una ubicación de reemplazo, cuando el soporte de toda la afirmación anterior puede sustituirse de forma segura. El olvido utiliza la operación de cambio existente con el objetivo y alcance seleccionados. La respuesta rápida se deriva de la evidencia primaria y vigente, no de una proyección adicional, una caché o el historial de conversación. Una modificación concurrente invalida la revisión y el trabajo antes de publicar una respuesta. El recibo de una consulta conserva un estado seguro, sin el texto de la respuesta.

**Alcance de la prueba.** Siete tipos de objetos, lugares y colores acotados, con una sola cláusula afirmativa presente y evidencia íntegra. Negaciones, atribuciones, condiciones, cuerpos con varios asuntos y preguntas sobre acciones pasadas siguen la vía normal. Un catálogo mixto con al menos un recuerdo que el prototipo no puede verificar íntegramente también sigue esa vía: no permite descartar una ubicación competidora que la gramática no reconozca. La cobertura de cuentas mixtas y frases libres es una cuestión abierta. Se conservan el esquema de Firestore, el contrato móvil y el modelo activo.

**Resultados locales.** Compilación, formato y documentación correctos. Pasaron 47 pruebas unitarias de servidor y 145 de emuladores. Las pruebas nuevas comprueban cinco recorridos: guardar, repetir, recuperar, corregir y olvidar con evidencia ligada; distintas identidades o ubicaciones en conflicto; olvido concurrente antes de responder; bloqueo por autorización y generación; y retorno al recorrido de IA simulado si el catálogo contiene un recuerdo no verificable. Un control de gramática comprueba negaciones, acciones pasadas, citas, órdenes y mensajes compuestos. La primera tanda reveló que Auth reutiliza el UID cuando las pruebas inician con el mismo correo. Se aisló cada caso limpiando solo la cuenta ficticia dentro del emulador antes y después. La tanda limpia es la que se contabiliza. Reproducción funcional: `node tooling/backend.mjs build`, `node tooling/backend.mjs test` y `pwsh -NoProfile -File tooling/backend-emulators.ps1`.

| Recorrido autenticado en el emulador | Muestras | Mediana | p95 |
| --- | ---: | ---: | ---: |
| Contar (`route` + `submit`) | 12 | 647 ms | 703 ms |
| Preguntar (`route` + `query`) | 12 | 357 ms | 364 ms |

Se excluyeron dos iteraciones de calentamiento por recorrido. Se usaron 14 ubicaciones ficticias y cuentas sin credencial de IA. Se comprobó el estado confirmado del guardado y una única referencia con la ubicación correcta en cada consulta. **Cero llamadas a IA y cero gasto API** en toda la validación, que no accedió a recuerdos personales. Los tiempos incluyen los dos viajes HTTP locales y Firestore emulado. Quedan por medir la cobertura sobre un catálogo mixto y la latencia de la app en producción.

## Preparación de ubicaciones con la API habitual

Se compiló e instaló en el Honor una variante separada, **Kioku Pruebas**, con cuenta ficticia y conexión prevista por USB a los emuladores. Pasaron compilación, `mobileCheck` y `lintLocationTrial`. La app arrancó, pero el Honor no completó la comprobación de acceso local. El servidor local respondió desde el PC. La prueba física de ubicación quedó sin completar y el servidor ficticio que se inició para ella se detuvo. La instalación habitual sigue disponible.

El propietario pidió probar también el comportamiento con la API real. La opción preparada para ello usa la app habitual y habilita la ruta directa en `memoryV2` únicamente si la configuración de ese servidor incluye `KIOKU_DIRECT_LOCATIONS=true`. El valor por defecto en producción es desactivado. Para una ubicación verificable se usan las mismas transacciones y evidencia del prototipo; cuando el formato o el catálogo quedan fuera del alcance, se usa el proveedor habitual del servidor, con su revisión y presupuesto ordinarios. La credencial existente permanece en Secret Manager. El cliente conserva su contrato y la app instalada es compatible.

La comprobación local del recorrido con proveedor simulado verifica tanto una captura confirmada como una consulta con referencia en un catálogo mixto, incluidos los controles de revisión. Pasan 47 pruebas unitarias del servidor y 145 de emuladores. La comprobación conserva modelos, permisos y credenciales. Las operaciones hechas desde la app son recuerdos normales de esa cuenta y las que usan IA consumen saldo. Un catálogo mixto puede seguir usando la API incluso para una frase con formato de ubicación.

El propietario autorizó activar `54ca4c3` únicamente en `memoryV2`. Producción está **ACTIVE** en la revisión `memoryv2-00009-ziw` desde `2026-11-20T11:41:54.482331147Z`, con `KIOKU_DIRECT_LOCATIONS=true` verificado en los metadatos. Se confirmaron Node 22, la identidad de ejecución existente y el límite de una instancia. Las otras once funciones conservan sus revisiones. Una petición ficticia sin autenticar recibió HTTP 401 antes de acceder a memoria o IA. El despliegue y su comprobación no consumieron API. La prueba del propietario se hace en la app **Kioku** habitual del Honor, sin USB ni reinstalación. La latencia y la cobertura con la memoria real quedan por medir.

## Envío unificado y respuestas directas del 24 de noviembre

La versión local devuelve el resultado de un turno ordinario en una petición móvil autenticada. La consulta y el guardado conservan sus identificadores y recibos. Las órdenes de gestión y las ofertas siguen por su flujo de decisión. Android e iOS consultan la capacidad anunciada por el servidor durante la apertura de la sesión. La comprobación de capacidad aprovecha la petición de estado existente.

El guardado directo admite más objetos cotidianos y afirmaciones de color. La consulta de color exige evidencia primaria vigente en un catálogo que se pueda interpretar por completo. Las denominaciones que podrían solaparse, como móvil y teléfono, pasan a revisión cuando hay una posible identidad competidora. Una búsqueda explícita como `¿En qué recuerdo aparece «cuando vuelva»?` también funciona en un catálogo mixto si la frase entre comillas rectas o angulares coincide literalmente en el texto primario de un único recuerdo. En la prueba de catálogo mixto, una pregunta semántica y una captura libre conservaron sus dos fases simuladas de generación y revisión.

### Mediciones en emuladores

Se compararon los dos protocolos con la misma ubicación ficticia y con el servidor ya iniciado. Por operación y protocolo se excluyó un calentamiento y se cronometraron seis turnos, alternando el orden de cada par. La latencia incluye autenticación y transacciones locales, y el guardado espera confirmación. En el primer ensayo se alcanzó el límite de 30 peticiones por minuto al encadenar las dos series en la misma cuenta. La comparación final aísla cada serie con su propia preparación ficticia, conservando el límite habitual.

| Operación | Antes, mediana | Envío unificado, mediana | Peticiones desde la app |
| --- | ---: | ---: | ---: |
| Guardar ubicación | 660 ms | 610,5 ms | 2 → 1 |
| Preguntar ubicación | 358,5 ms | 314,5 ms | 2 → 1 |

Reproducción con `KIOKU_TIMING_TURNS=1` y `tooling/backend-emulators.ps1` en modo local. Pasaron 48 pruebas unitarias de servidor, 148 de emuladores y 140 de lógica móvil. Android compiló y pasó formato, arquitectura, Detekt y Lint. Se verificaron la repetición de un guardado con la respuesta perdida, la recuperación con el protocolo anterior, el rechazo de identificadores incompatibles, la retirada de evidencia tras olvidar y una cita literal en una cuenta mixta. Cero llamadas a la API de IA. Quedan por medir los tiempos en un teléfono contra producción y por compilar iOS en macOS.

### Elección del modelo por interacción

Se reevaluaron los 14 pares ficticios de la [comparación de perfiles](evidence/light-sol-comparison-20261120.json). Con la misma revisión, el modelo ligero ganó en seis de siete consultas, con un ahorro mediano por par de 0,60 s. En capturas ganó en cuatro de siete, con un ahorro mediano de 0,74 s. En la consulta con contexto ajeno, el ligero tardó 1,96 s más. Una muestra por caso permite comparar los recorridos, pero deja abierta la variabilidad de cada caso. Se eligió resolver directamente las peticiones con prueba suficiente y mantener el perfil revisado para las demás. Elegir un modelo mediante una llamada adicional introduciría otra espera antes de contestar.

### Equivalencia de preguntas sobre el color

«¿Qué color tiene mi cartera?», «¿De qué color es mi cartera?» y «¿Cuál es el color de mi cartera?» consultan el mismo atributo actual del mismo objeto. La interpretación de la pregunta y la búsqueda directa comparten el patrón. Las preguntas en pasado, con otro propietario o con una segunda petición siguen el recorrido de interpretación. Si la evidencia solo indica que la cartera está en un cajón azul, la consulta pasa a redacción y revisión con su texto original.

La prueba local de equivalencia compara el texto de la respuesta, la referencia citada y el catálogo antes y después de preguntar. También cubre la coexistencia de dos colores contradictorios y la consulta posterior al olvido de uno de ellos. Los ejemplos y las cuentas de emulador son ficticios. Para comprobar qué fases requieren IA se usa un proveedor simulado.

Antes del cambio, la prueba reprodujo el fallo de reconocimiento con «¿Qué color tiene mi cartera?». Tras el cambio pasaron 50 pruebas unitarias y 148 de emuladores. Las dos mediciones opcionales de velocidad se omitieron en esta pasada de funcionalidad. Compilación TypeScript, formato y comprobación de documentación correctos. Gasto de API de IA en las pruebas: cero.

### Activación en producción y en el Honor

El 24 de noviembre se desplegó `737e835` en `memoryV2`. Producción confirmó la revisión `memoryv2-00010-lig` activa a las 17:39 UTC, con la opción de ubicaciones directas habilitada. Sustituye a `memoryv2-00009-ziw`. Se verificaron las revisiones de las otras once funciones y el rechazo HTTP 401 de una petición ficticia sin sesión antes del acceso a memoria o IA. Durante el despliegue también pasaron seis pruebas locales de interpretación directa con ejemplos ficticios.

La app habitual se actualizó sobre la instalación existente del Honor. Se comprobó que la fecha de primera instalación se conservó y que la huella SHA-256 del APK en el teléfono coincide con la compilación (`F8FC390989BC623133A1DD69A689CFA0E169ADB150D5320214A8DDE77DCEBB49`). El teléfono estaba bloqueado durante la comprobación. El recorrido autenticado en la pantalla del Honor y su latencia en producción quedan pendientes de prueba. Gasto de API de IA durante estas comprobaciones: cero.

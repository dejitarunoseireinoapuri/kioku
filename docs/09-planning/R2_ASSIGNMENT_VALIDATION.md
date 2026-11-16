# R2 · Asignación global y soporte propio · continuación final 2 de 2

**R2 permanece abierta.** Esta es la última continuación autorizada; no inicia otra tarea. La [reserva h histórica](R2_SCOPE_VALIDATION.md) y su [informe](evidence/r2-scope-results.json) permanecen intactos (58/60, 57/60 y 57/60). Solo se trabaja con fixtures ficticias y almacenes RAM aislados en `codex/memory-core-r2`, sin Firebase, móviles, recuerdos reales, despliegue, main ni correo. API `gpt-6.1-sol`, razonamiento `medium`, clave existente comprobada únicamente por presencia.

Resultado final acotado: **224 pruebas raíz / 122 del núcleo**, TypeScript raíz/núcleo y formato correctos. Regresión h adaptada **59/60**, controles g **9/9** y ciclo posterior h49 con pregunta corregida **1/1**, separado de ambos. No se suma ese último éxito para recalificar h. Quedan una reserva independiente de la versión final, la variabilidad observada de revisión/alcance y el objetivo de latencia. [Informe consolidado sin prosa](evidence/r2-assignment-results.json).

## Cambios y diagnóstico

El comprobador admite una biyección global verdaderamente única entre expectativas y unidades, con el límite explícito de ocho unidades admitidas por turno. Explora asignaciones acotadas y para al encontrar una segunda solución. Usa términos, soporte propio, modalidad, fecha, polaridad, sujeto declarado, condición y atribución. La coincidencia léxica de diagnóstico puede identificar una ficha incorrecta para informar de su fallo, pero nunca acredita significado. No se reduce ninguna comprobación de fidelidad.

Las pruebas recorren los 512 grafos de tres unidades contra las seis permutaciones independientes. El evaluador completo prueba la colisión de dos candidatos, ambigüedad real, anclas incorrectas y evidencia ausente. Añade detección crítica de términos distintivos ajenos en todos los campos canónicos y negativos con literales limpios, incluyendo el canónico que sobrevive al olvido. Las expectativas explícitas siguen siendo un instrumento léxico finito: no demuestran soporte semántico de cualquier detalle desconocido. El revisor se conserva y ahora exige también soporte propio para descriptores y metadatos, sin copiar otra acción como identificación de una persona.

Diagnóstico previo al cambio: h30 y h53 vuelven a fallar mapeo; h49 pasa la expectativa original en esta ejecución nueva. h30 propone `requires` de índice 1 a índice 0, con destino nuevo. Esto se contrasta con la [prueba R1](../../prototypes/memory-core/test/scope.test.ts) de «leer durante ese viaje». La regresión adaptada espera casco → visita y exige que seleccionar solo visita produzca `needs_scope/dependent_memory`, sin cambios. La fixture autoriza explícitamente incluir casco y se comprueba que los IDs adicionales sean exactamente los esperados antes de confirmar. Ninguna relación se elimina para aprobar; dirección/clase incorrecta, cierre omitido y cierre ajeno se rechazan. Las pruebas existentes conservan el rechazo de ciclos y la eliminación independiente del dependiente.

h49 contrasta la pregunta general sobre arreglar, la específica del cerrojo y otra que incluye expresamente lo que se quiere pegar. La general exige cerrojo y admite únicamente el florero vigente como lectura adicional explícita de esa pregunta; la específica rechaza esa referencia extra y la inclusiva exige ambas. No se cambia la regla global de citas exactas. Se trata de una adaptación semántica declarada de una expectativa expuesta, no una adjudicación de la prosa histórica ausente. Las expectativas originales se conservan en `scope.ts`; las adaptaciones viven en `scope-regression.ts`. Tras olvidar el florero, todas esas preguntas rechazan su contenido/cita.

h53 añade prohibiciones explícitas de la acción independiente retirada en el canónico del puerto. Se registran solo comparaciones booleanas por término esperado, unidad y soporte propio, además de relaciones como enums/índices. El nuevo diagnóstico previo muestra la colisión; no adjudica retroactivamente la prosa histórica. La dirigida posterior completa captura, aclaración, consultas, olvido y consulta de evidencia vigente. En esa ejecución cada conjunto esperado coincide con su propio soporte y no con la acción del vecino. El rechazo histórico `REVIEW_ownership` y el fallo de mapeo siguen siendo motivos distintos; el código cerrado no revela la causa interna del primero.

## Protocolo acotado

1. Diagnóstico original nuevo de h30/h49/h53, sin sobrescribir rondas: **1/3**, 26 llamadas, **0,17234 USD**.
2. Versión corregida: h26/h30/h43/h49/h52/h53, **5/6**, 62 llamadas, **0,386095 USD**. h49 se detiene en la segunda pregunta general: propuesta con dos referencias y `ANSWER_REVIEW_scope`, sin texto conservado. No se retira el revisor ni se reintenta selectivamente. h30/h53 completan sus ciclos; h43 incluye corrección.
3. Congelar esta implementación y expectativas antes de una pasada completa h adaptada y nueve controles expuestos g05/g23/g24/g33/g36/g38/g45/g53/g58. Sin cambios entre estas dos regresiones. No son una evaluación independiente nueva ni tres rondas reservadas. No ejecutar otra reserva en esta continuación final.
4. Validación local: 122 pruebas del núcleo, TypeScript raíz/núcleo, formato y comprobador documental real. Registrar resultados ejecutados al terminar, sin atribuirlos a plataformas no comprobadas.

Comandos: `node --env-file-if-exists=.env.local prototypes/memory-core/evaluation/run.ts --live --regression-v7 --run followup2-h-full`; controles con `--regression-v6 --cases g05,g23,g24,g33,g36,g38,g45,g53,g58 --run followup2-g-controls`. `--scope-original` conserva una ruta explícita para regresión de expectativas históricas; no convierte ese corpus en reserva. Informe sin API: `node tooling/r2-assignment-report.mjs`.

## Pasada completa congelada

Código evaluado: `26175f81c8c3e83a1db6ee657ee551d4cc46f859`. h adaptado obtiene **59/60**, **251/251 consultas**, **636 llamadas** y **3,3440425 USD**, sin errores de transporte ni comprobaciones críticas fallidas. Nueve familias pasan 6/6; ambigüedad queda en 5/6. Las cinco correcciones y los controles de los 59 olvidos ejecutados pasan. h30 y h53 completan otra vez sus ciclos; esto no convierte sus dos éxitos nuevos en garantía probabilística ni recalifica los fallos históricos.

h49 completa todo el ciclo pero falla seis comprobaciones no críticas de estado/evidencia/detalles en `query3` y `after2`, la pregunta específica introducida «¿Qué quiero arreglar del cerrojo?». La ausencia devuelta es compatible con leer esa pregunta como petición de una pieza del cerrojo no indicada; la prosa y el motivo interno no se conservan y esa lectura no se afirma como causa demostrada. La revisión semántica identifica esa ambigüedad en la pregunta del propio comprobador. La general, la inclusiva y los controles de olvido pasan en esta ejecución; el rechazo `ANSWER_REVIEW_scope` de la dirigida anterior sigue abierto como observación distinta. Se conservan todos los fallos de ambas ejecuciones, sin sustitución de denominadores.

| Etapa · milisegundos | Intentos | p50 | p95 |
| --- | ---: | ---: | ---: |
| Captura | 60 | 12823,73 | 16798,56 |
| Aclaración, sin espera humana | 4 | 13985,37 | 20372,55 |
| Corrección | 5 | 19120,40 | 21315,80 |
| Consulta | 251 | 3977,82 | 5436,00 |
| Olvido RAM | 59 | 0,31 | 0,40 |

Captura/corrección incumplen el objetivo p95 de 15 s. Las muestras de cuatro/cinco aclaraciones/correcciones son pequeñas. No se ha aislado ningún componente ni realizado una comparación controlada; no se presenta esta diferencia frente al histórico como mejora acreditada.

Los nueve controles expuestos de g pasan **9/9**, 100 llamadas y **0,550915 USD**, sin cambios de código/fixtures desde h completo. La comparación local confirma que `ai/`, `src/`, `evaluation/` y `fixtures/` siguen iguales a `26175f8` durante ambas regresiones. No se ejecuta otra pasada completa f.

Después de ambas regresiones congeladas se cambia **solo** la pregunta específica h49 a «¿Qué quiero hacer con el cerrojo?», antes y después del olvido. La expectativa ahora exige además el predicado `arreglar`, mantiene la referencia única al cerrojo y sigue prohibiendo el florero. No cambia el intérprete/revisor, la pregunta general o la inclusiva. Esta adaptación posterior requiere un ciclo h49 explícitamente separado; no se utiliza para convertir el 59/60 anterior en 60/60 ni se repite el corpus completo. Previsión adicional comunicada: 0,10 USD, sin aumentar el tope.

Ese ciclo separado pasa **1/1**, **8/8 consultas**, 20 llamadas y **0,10098 USD**. El resultado es compatible con la reparación de la pregunta del comprobador, pero una sola ejecución no demuestra que haya desaparecido la variabilidad previa. Las comprobaciones negativas mantienen el rechazo de referencias adicionales en preguntas específicas, desconocidas o posteriores al olvido. El único cambio de `ai/src/evaluation/fixtures` respecto a `26175f8` son las dos preguntas y su término de acción en `scope-regression.ts`; `package.json` añade el nuevo consolidador al formato configurado. Se vuelven a ejecutar `node tooling/m0.mjs check`, `core:check`, `test` y `format:check`: cero errores, 224 pruebas correctas. El comprobador documental real valida 77 documentos y 12 ADR; no se ejecutan compilaciones ni pruebas nativas de app.

## Contadores y límites conservados

Inicio R2 **71,2454975 USD**; reserva incierta **1,78895 USD** y M0 separado **21,71988544 USD**. Después de diagnóstico/dirigida: **71,8039325 USD**, sin nueva reserva incierta. Tope acumulado **80 USD**, máximo **5 USD por regresión**, contadores sin reiniciar. Se comunica antes de ejecutar una previsión de **3,90 USD adicionales** para las dos regresiones finales; no se aumenta el tope. Son estimaciones locales por tokens, no saldo ni factura del proveedor.

Final R2: **75,79987 USD**, reserva incierta **1,78895 USD** intacta; suma **77,58882 USD**, inferior al tope. Esta continuación añade **4,5543725 USD** y **844 llamadas**, sin nuevas reservas inciertas ni reintentos automáticos. M0 permanece separado con **21,71988544 USD** y su reserva **0,20756492 USD**. No se consulta ni afirma el saldo del proveedor. El consolidador comprueba cobertura exacta de los cinco informes, perfil, hashes, suma de costes y conservación de los contadores; no hace llamadas a la API.

No hay optimización de latencia ni comparación controlada que acredite una mejora. El objetivo de captura/corrección de 15 s sigue abierto según las medidas históricas. Se publicarán las latencias de esta versión como observaciones, sin atribuir la demora a un componente por intuición. Una regresión expuesta, las comprobaciones léxicas y el juicio del mismo modelo no cierran R2. No se acreditan Firebase, seguridad remota, Android/iOS, app, migración ni cualquier paráfrasis desconocida.

La subida sigue pendiente de la pregunta de autorización del chat anterior: no hay respuesta del usuario en la lectura filtrada inicial y no se reintenta el push rechazado. `gradle/gradle-daemon-jvm.properties` permanece ajeno. Al terminar se conserva el trabajo, se informa del resultado y se suspende el PC sin forzar cierre de aplicaciones; autorización directa del propietario verificada en el chat original.

Fuentes consultadas: AGENTS, mapa documental, convenciones, calidad, desarrollo y definición de terminado; núcleo v2 y plan R0–R6; protocolo/informe R2 de alcance, expectativas y pruebas R1/R2; seguridad, privacidad, datos/API en lo relativo a límites del prototipo. No cambia el contrato productivo.

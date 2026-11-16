# R2 · Agrupación y rechazos de interpretación

Continuación autorizada del 16 de noviembre de 2026 en `codex/memory-core-r2`. Se mantiene `gpt-6.1-sol`, razonamiento `medium`, `store:false` y la credencial local ya autorizada. Solo fixtures ficticias y almacenes RAM; sin Firebase, móviles, recuerdos personales, migración, despliegue ni correos. Los resultados de la [reserva anterior](R2_FINAL_VALIDATION.md) permanecen históricos, sin recalificación.

## Cambios y causas comprobables

La instrucción anterior pedía aclarar palabras unidas incluso cuando el significado era inequívoco, mientras el revisor rechazaba las preguntas innecesarias. Ahora ambos comparten la distinción entre errata inequívoca y duda real. Las reglas de intenciones ajenas sin acto de comunicación también son compartidas: sujeto ajeno no implica cita; `attribution` identifica comunicación expresada, no cualquier tercera persona. Los motivos cerrados de las rondas anteriores no prueban por sí solos el campo exacto que causó cada rechazo.

Una valoración y los rasgos/motivos que explican ese mismo juicio se gestionan juntos. Opiniones distintas sobre aspectos separables, diferentes objetos o momentos siguen separadas. Una cita literal presentada como objeto textual conserva sus cláusulas; un relato indirecto de varios planes independientes continúa produciendo varios recuerdos. No se fusionan unidades existentes ni se extiende el borrado por parecido: estas reglas actúan en la interpretación previa a cualquier escritura.

El revisor de `clarify` comprueba que la pregunta sea necesaria, concreta y no resuelta previamente. No exige fichas ni cobertura de unidades a un turno pendiente cuyo contrato obliga a tenerlas vacías. Al resolverlo como `ready`, se mantiene la revisión completa de detalles, vecinos, calendario y evidencia. Un rechazo sigue impidiendo guardar; no hay reintentos automáticos ni omisión del revisor.

El fallo de espacio vacío se corrige en la expansión de tokens: un segmento `context` cuyo literal solo contiene espacio se representa como `separator`, manteniendo caracteres, posiciones, propietarios e índices. No se recorta texto ni se une al contenido de otro dueño. Un `primary`, ancla temporal o reemplazo vacío continúa rechazándose; palabras significativas marcadas como separador y propietarios inexistentes tampoco pasan. El motor puro y sus invariantes no se relajan.

## Protocolo antes de observar la nueva reserva

1. Regresión dirigida de los seis escenarios fallidos `f04/f21/f37/f41/f49/f53`, con sus expectativas originales.
2. Regresión completa de `f01–f60`, ya expuestos. No acredita independencia.
3. Reserva nueva `g01–g60` (`grouping-v6`): diez familias de seis, con texto distinto de todos los corpus anteriores. 247 consultas previstas por ronda; cinco correcciones, seis repeticiones, cuatro aclaraciones (dos tardías), una pregunta que no crea recuerdos, un olvido intermedio de tres unidades y un olvido de todas las unidades.
4. Tres rondas completas con código/perfil/oráculo congelados, sin cambios ni repetición selectiva. Cada caso empieza en RAM vacía. Un fallo permanece en el denominador; las consultas que no se alcanzan no se presentan como aprobadas.

Se conserva el criterio: al menos 95 % global y por familia en cada ronda, sin fallos críticos abiertos. Con seis casos por familia, exige 6/6 en cada una. Las expectativas se escriben antes de ejecutar y nunca se envían al proveedor. El oráculo determinista conserva sus límites léxicos: no sustituye una auditoría humana de toda prosa ni garantiza cubrir todo el lenguaje. Los nuevos textos no constituyen una auditoría externa.

El ejecutor común mantiene nombres de informes fijos, rechazo de sobrescrituras, orden de rondas, mismos IDs/huella/modelo y ausencia de cuarta ronda. La validación exige además el corpus correcto: no se puede usar un informe anterior de `independent-v5` como precedente de `grouping-v6`. Los datos e informes de la reserva anterior no se modifican.

## Ejecución y coste

Contador inicial R2: 42,162540 USD, reserva incierta anterior 0,6710225 USD conservada. Tope acumulado aumentado de 50 a 65 USD bajo la autorización vigente de gasto; máximo adicional de 5 USD por ronda/regresión. No se consulta ni se afirma el saldo del proveedor.

Regresión dirigida inicial: **6/6**, 24 consultas, 62 llamadas, coste estimado **0,2890575 USD**. Se comprueba todo el ciclo de cada caso; no solo la captura. Regresión completa posterior: **60/60**, 247 consultas, 602 llamadas, coste **2,8742300 USD**. La primera versión dirigida precede al matiz explícito sobre juicios de aspectos distintos; la regresión completa ya incluye ese matiz.

Las tres rondas nuevas se ejecutan en `93347c6b81e7fbf4a429e34ba9cbc87aab1d58cb`, publicado antes de observar la reserva, con contador inicial 45,3258275 USD. Huella idéntica entre las tres y al terminar: `37e167c733143fbfefe5407d257abc07e447fa5e5d37b46a1d96fc9ba505113a`. Modelo solicitado y resuelto: Sol medio. No se cambian código, instrucciones, fixtures ni criterios entre rondas y no se reintenta la inferencia. La ejecución termina y libera su bloqueo.

[Informe consolidado sin prosa generada](evidence/r2-grouping-results.json), incluidas las dos regresiones anteriores. El exportador verifica cobertura completa, perfil/huella/corpus y ausencia de campos de contenido; conserva todos los fallos originales.

| Ejecución | Ciclos correctos | Consultas devueltas/previstas | Llamadas | Coste estimado USD |
| --- | --- | --- | --- | --- |
| Regresión dirigida | 6/6 | 24/24 | 62 | 0,2890575 |
| Regresión completa f | 60/60 | 247/247 | 602 | 2,8742300 |
| Reserva g · ronda 1 | 52/60 | 234/247 | 602 | 2,9029650 |
| Reserva g · ronda 2 | 53/60 | 240/247 | 612 | 2,9277175 |
| Reserva g · ronda 3 | 53/60 | 234/247 | 602 | 2,9074325 |

**Ninguna ronda nueva supera el criterio. R2 permanece abierta.** Son 158/180 ciclos correctos (87,78 %) y 708/741 consultas devueltas. De las 33 sin resultado, dos se intentan y son rechazadas por revisión; 31 no se alcanzan por fallos previos. No se excluyen casos ni se elige la mejor ronda. Los porcentajes de reservas diferentes no son una comparación controlada de versiones.

| Familia · seis casos por ronda | Ronda 1 | Ronda 2 | Ronda 3 |
| --- | --- | --- | --- |
| Asuntos independientes | 6/6 | 5/6 | 6/6 |
| Contexto compartido | 6/6 | 6/6 | 6/6 |
| Condiciones | 6/6 | 6/6 | 6/6 |
| Atribución/citas | 4/6 | 4/6 | 4/6 |
| Tiempo | 6/6 | 6/6 | 6/6 |
| Repetición | 4/6 | 5/6 | 5/6 |
| Semejanza | 5/6 | 5/6 | 5/6 |
| Corrección/evolución | 5/6 | 5/6 | 5/6 |
| Ambigüedad | 5/6 | 6/6 | 5/6 |
| Olvido | 5/6 | 5/6 | 5/6 |

## Incidencias para la siguiente tarea

| Caso | Rondas fallidas | Lo comprobado y lo que falta determinar |
| --- | --- | --- |
| g05 · respuesta sobre una revisión pedida | 2 | Solo falla `answer_details`; el ciclo, estado y referencia pasan. Hay que distinguir una omisión de una respuesta equivalente/pronominal que el requisito léxico no reconoce. No se conserva la prosa para adjudicar retrospectivamente. |
| g23 · cita con prohibición | 1, 2, 3 | `REVIEW_modality` bloquea captura en 1/3; en 2 se guarda y falla la polaridad negativa esperada de la cita. Las propuestas tienen dos quotations. Revisar negación del contenido citado frente al hecho positivo de comunicarlo, sin ejecutar los imperativos. |
| g24 · cita en primera persona | 1, 2, 3 | Solo falla perspectiva en la respuesta a la cita, antes/después del olvido del vecino. El contraejemplo del oráculo explicado abajo prueba que puede rechazar una cita atribuida correcta; no demuestra que todas las salidas históricas fueran correctas. |
| g33 · gusto repetido | 1 | Solo falla el detalle léxico de la primera respuesta. La repetición/identidad y el olvido pasan. El contraejemplo «te desagrada» muestra una limitación del criterio «no» + «gusta». |
| g36 · comunicación repetida de la misma intención | 1, 2, 3 | La repetición crea una tercera unidad en vez de añadir evidencia a una de las dos existentes. La consulta devuelve dos referencias; el oráculo ya no puede seleccionar un único objetivo y se detiene antes del olvido. No es un borrado ejecutado incorrectamente. Prioridad: identidad del contenido comunicado frente a repetición del acto de comunicar. |
| g38 · intención propia negativa y ajena positiva | 1, 2, 3 | Se guardan dos intenciones, pero los términos del objetivo propio también coinciden con el hermano. El mapeo no usa polaridad para desambiguar; se detiene con `EXPECTED_TARGET_MISSING`. Corregir el comprobador sin permitir sujetos/negaciones erróneos y repetir con diagnóstico cerrado. |
| g45 · ruta y otro plan | 1, 2, 3 | Dos intenciones reciben fecha de día y contexto compartido, frente al segundo plan de fecha desconocida esperado. Fallan mapeo, fecha y evidencia ajena. Nunca se alcanza su corrección. Revisar si el enlace está expresado o inferido por proximidad, la unidad de gestión y el alcance de la expectativa; no adjudicar una explicación interna con los metadatos disponibles. |
| g53 · pronombre aclarado | 1, 3 | Captura/aclaración/consultas iniciales/olvido pasan; la primera consulta posterior es rechazada con `ANSWER_REVIEW_scope` o `ANSWER_REVIEW_coverage`. La segunda ronda completa todo. Investigar pertinencia/ausencia tras olvido conservando el vecino; no implica que el olvido no se aplicara. |
| g58 · lema atribuido a exposición | 1, 2, 3 | Solo falla la atribución de captura esperada; el resto del ciclo pasa. Falta precisar mediante diagnósticos sin texto si se omite el origen textual, se expresa de otra manera o existe discrepancia de contrato entre autor desconocido y procedencia. |

El oráculo cuenta 6/7/6 comprobaciones críticas fallidas, en 4/5/4 casos respectivamente; no son 19 incidentes de borrado. Incluyen mapeo, identidad, contexto y atribución. No se recategorizan como aprobadas para cerrar R2. La tarea siguiente debe corregir defectos comprobados y distinguir discrepancias del oráculo antes de hacer otra afirmación de fiabilidad.

Las doce correcciones alcanzadas (cuatro por ronda) conservan detalles/evidencia/fecha y vecinos, y retiran el valor sustituido; las tres restantes se bloquean antes por g45. Las 166 operaciones de olvido alcanzadas superan retirada de IDs/soportes/proyecciones elegidos y conservación de vecinos; esto no demuestra reconocimiento exhaustivo de copias ni resuelve g36. Las aclaraciones nuevas por referencias tardías, errata inequívoca y fecha inválida pasan en las tres rondas. La familia de fechas completa pasa 18/18. No se extrapola a producción o lenguaje arbitrario.

## Coste y latencia finales

Reserva nueva: **8,738115 USD**, 1816 llamadas. Tarea completa, incluidas regresiones: **11,9014025 USD**, 2480 llamadas. Contador R2 final: **54,0639425 USD**; reserva incierta anterior **0,6710225 USD**, sin reiniciar. M0 sigue en 21,71988544 USD. Son estimaciones locales, no saldo ni factura del proveedor. Tope acumulado vigente: 65 USD.

| Etapa · segundos p50 / p95 | Ronda 1 | Ronda 2 | Ronda 3 |
| --- | --- | --- | --- |
| Captura (60 intentos por ronda) | 6,88 / 14,91 | 7,12 / 12,58 | 6,35 / 11,98 |
| Consulta (235 / 240 / 235 intentos) | 4,36 / 5,99 | 4,41 / 6,49 | 4,15 / 5,97 |
| Corrección (cuatro por ronda) | 11,45 / 13,49 | 12,31 / 15,18 | 9,91 / 12,03 |
| Resolución de aclaración (cuatro por ronda) | 14,43 / 20,42 | 11,89 / 15,61 | 12,55 / 23,56 |

Incluye intentos rechazados. La aclaración se añade a la captura y excluye espera humana. Con cuatro muestras el p95 coincide con el máximo, no es una estimación robusta. El olvido RAM sin IA tiene p95 de 0,62 / 0,54 / 0,48 ms; no mide servidor móvil/Firestore. El objetivo de captura/corrección de 15 segundos no queda validado para todo el recorrido.

## Comprobaciones y límites

Durante las rondas se comprueban localmente tres contraejemplos del oráculo, sin API ni alterar casos/criterios en curso: una respuesta atribuida «Tu vecina escribió: “Quiero perder el miedo y ganar paciencia”» falla la expresión global de primera persona; «El refresco de pepino te desagrada» falla una expectativa que exige literalmente «no» y «gusta»; los términos del objetivo propio negativo de g38 también coinciden con el plan positivo del hermano y el mapeo no usa polaridad para desambiguarlos. Estos ejemplos construidos demuestran limitaciones del comprobador, no la corrección retrospectiva de salidas generadas cuyo texto no se conservó. Los resultados originales permanecen fallidos y no se cambia el oráculo entre rondas.

**110 pruebas locales correctas**, TypeScript raíz/núcleo y formato. Se añaden conservación literal/propietarios del separador, índices temporales estables, rechazos negativos sin mutación, revisión de aclaración obligatoria, corpus nuevo completo y aislamiento entre protocolos de reserva. Consolidación/auditoría de informes y huella final idéntica comprobadas; documentación validada con el comprobador real (75 documentos, 12 ADR). El modelo semántico se comprueba con API real solo sobre fixtures; los dobles de test no prueban comprensión.

Comandos: `node --env-file-if-exists=.env.local prototypes/memory-core/evaluation/run.ts --live --regression-v5 --run <id>`; `--cases` solo para diagnóstico de corpus expuesto. Reserva: `node --env-file-if-exists=.env.local prototypes/memory-core/evaluation/grouping-run.ts --live --round 1`, luego `2` y `3`. Informe: `node tooling/r2-final-report.mjs --grouping`, sin API. No admite entradas personales ni archivos externos.

Fuentes consultadas: AGENTS, convenciones/calidad, definición del núcleo v2, protocolo/resultados finales R2, matriz de aceptación y ejecutores/contratos existentes. No se ha comprobado Firebase, Honor, iOS ni la latencia de una app real en esta continuación.

## Continuaciones autorizadas y límite

Mientras se ejecutaba esta evaluación, el propietario pidió terminar esta tarea y abrir otra si quedan problemas solucionables. Esa primera continuación puede abrir una última tarea si siguen quedando problemas solucionables; al terminar la segunda continuación se debe parar e informar del estado, incluso si persisten errores. Máximo **dos tareas adicionales** después de esta entrega, secuenciales y centradas en R2. No autoriza datos reales, despliegue, cambio de modelo, correo ni una cadena indefinida. La primera continuación debe partir del informe completo, separar fallos de implementación y del oráculo, conservar resultados históricos y probar nuevos casos ficticios.

Instrucción posterior del propietario: al terminar la última tarea efectiva de esta cadena, avisar con el estado final en el chat y **suspender el PC**. Si la primera continuación abre la segunda, debe transferir esta instrucción y dejar la suspensión para esa última; nunca suspender mientras queda una continuación ejecutándose. Mantener la indicación vigente de no enviar correos. La suspensión no autoriza apagar, reiniciar, cerrar aplicaciones por la fuerza ni descartar trabajo.

# R2 · Rechazos y falsas ausencias

Informe histórico anterior a la [evaluación independiente final](R2_FINAL_VALIDATION.md), que obtiene 55/60, 56/60 y 57/60 y mantiene R2 abierta. Los resultados y costes siguientes no se recalculan ni sustituyen por esa evaluación.

Continuación autorizada del 16 de noviembre de 2026, rama `codex/memory-core-r2`. Perfil invariable `gpt-6.1-sol`, razonamiento `medium`, `store:false`, sin reintentos de inferencia. Únicamente escenarios ficticios y almacenes RAM. No se accede a Firebase, móviles ni recuerdos personales, no se despliega ni se envía correo. Los [resultados anteriores](R2_INDEXED_VALIDATION.md) permanecen históricos sin recalificarse.

## Causas investigadas y cambios

La consulta v12 conserva la unidad, sus detalles y sus soportes después de olvidar su vecina. Se reproduce otra vez la falsa ausencia antes del cambio. En una comprobación adicional con clasificación cerrada, el modelo declara `incomplete_literal` después del olvido; es un diagnóstico del modelo, no prueba independiente de su razonamiento. La comprobación independiente sí acredita que los fragmentos pertinentes siguen presentes. La consulta recibía además longitud/posiciones del relato original incompleto. Ahora `answerEvidenceView` entrega el soporte actual por unidad y calendario de origen, sin esos huecos ni IDs de almacenamiento. No concatena fragmentos en una cita inventada, no cambia el almacén ni reconstruye texto retirado. El mapa de referencias/época permanece en el servidor y se revalida tras responder.

Las instrucciones distinguen una ubicación/cantidad observada de una garantía del estado actual: se puede responder qué contó el propietario, pero no calcular un saldo posterior a uso/traslado desconocido. Se mantienen negativas por sujeto/evento ajenos, plan no realizado y precisión ausente.

En v60, el diagnóstico numérico de una propuesta rechazada muestra verbo y primera cantidad en `primary` del primer recuerdo, sustantivo en contexto compartido y segunda cantidad/color sin verbo propio. La regla anterior prohibía compartir verbos ajenos sin precisar el predicado común de una enumeración. Ahora extractor y revisor distinguen ambos: el verbo que se aplica a todos es contexto compartido separado de cantidades/colores; un verbo exclusivo de otra acción nunca se comparte. Un caso nuevo exige literalmente ese verbo en ambos soportes, antes y después del olvido.

`Quedé con X para Y` conserva lo expresado como acuerdo, sin inventar reunión celebrada ni actividad realizada. `Ahora prefiero Y` conserva un estado actual sin fechar su comienzo; `time:unknown` y registro siguen separados. El diagnóstico previo de v47 sí muestra que se estaba fijando `day` al día de captura. Los oráculos históricos no se modifican para convertir ese fallo en acierto.

El contrato de salida impide algunas combinaciones inválidas antes posibles: `primary` tiene exactamente un propietario; `replaced`, ninguno; contexto/tiempo/separador, uno o más. Una fecha desconocida obliga a valor/fin/ancla nulos. Se mantienen todas las comprobaciones de cobertura, propietarios existentes, referencias temporales y revisión semántica. Los rechazos estructurales añaden motivos cerrados sin exponer texto. Quince interpretaciones dirigidas de la versión previa no reprodujeron los rechazos estructurales históricos; no se les atribuye retrospectivamente una causa concreta ni se afirma haber demostrado su eliminación universal.

## Protocolo y resultados

Los siete casos conocidos se usan como regresión. `w01–w12` son doce historias nuevas, con expectativas fijadas antes de llamar al proveedor: cantidades/ubicaciones tras borrar vecinos, predicado común, homónimos, fechas, estados, aclaración tardía, dos ediciones parciales y negativas reales. No constituyen otra reserva de sesenta historias ni habilitan el cierre de R2 por sí solos. Los números en palabras de estos casos usan límites de palabra para no confundir «dos» con «recuerdos».

[Informe consolidado sin texto generado](evidence/r2-reliability-results.json). La evaluación conserva todos los intentos, incluidos los rechazos previos; no borra fallos para presentar solo la última prueba.

| Ejecución | Ciclos correctos | Consultas devueltas | Llamadas | Coste estimado USD |
| --- | --- | --- | --- | --- |
| Diagnóstico inicial de siete casos | 4/7 | 24 | 60 | 0,3012300 |
| Primer ajuste | 6/7 | 25 | 64 | 0,2936475 |
| Diagnóstico de propiedad v60 | 0/1 | 0 | 2 | 0,0210250 |
| Ajuste del predicado común | 7/7 | 29 | 72 | 0,3197150 |
| Doce historias nuevas, primera pasada | 12/12 | 50 | 126 | 0,5470000 |
| Regresión completa v01–v60 | 60/60 | 245 | 546 | 2,4340375 |
| Doce historias, segunda pasada | 12/12 | 50 | 126 | 0,5550700 |
| Doce historias, tercera pasada | 12/12 | 50 | 126 | 0,5561425 |

El diagnóstico cerrado adicional realiza quince interpretaciones sin fallo estructural y un ciclo de consulta que reproduce la falsa ausencia; cuesta 0,3451325 USD. Su clasificación de motivo no sustituye el oráculo. Las dos últimas pasadas de doce casos comparten la misma huella de código/corpus y parten de almacenes vacíos. No hay reintentos hasta aprobar ni selección de resultados. La primera pasada y la regresión completa preceden al último refinamiento de la vista, que restituye `recordedAt`, `updatedAt` y `mentionCount` como metadatos semánticos sin volver a enviar IDs/posiciones; ese refinamiento se prueba localmente y en las dos pasadas finales. No se presentan las tres como una reserva congelada de la misma versión.

La regresión completa aprueba las diez familias (6/6 cada una), 245 consultas, cinco correcciones y los olvidos preparados. Las doce historias suman 150 consultas y seis correcciones entre sus tres pasadas. Tras los ajustes no se reproduce falsa ausencia, rechazo de propiedad, discrepancia de fecha o rechazo estructural en esos recorridos. Son ejemplos finitos; no prueban ausencia universal de fallos ni una reserva independiente de sesenta casos.

Latencia p95 en la regresión: captura 8,92 s, consulta 5,41 s y corrección 11,57 s. En las dos pasadas finales: captura 8,67/10,14 s, consulta 5,11/6,11 s y corrección 12,58/14,69 s (solo dos ediciones por pasada). Un ajuste anterior registra una captura de 47,73 s; se conserva, no se promete latencia máxima. Olvido en RAM inferior a 1 ms, sin IA; no es medición del móvil/servidor.

Validación local: **100/100 pruebas del núcleo**, TypeScript raíz/núcleo, formato, demo, auditoría determinista de retención, sintaxis/auditoría del exportador, `git diff --check` y comprobador documental (73 documentos, 12 ADR). Las pruebas comprueban rechazo de soporte ajeno/calendario ausente, conservación exacta de evidencia al olvidar vecinos y distinción entre registro original y soporte posterior a una corrección. No se repiten tests nativos ni pruebas M0 sin cambios.

Coste total estimado: **5,373 USD**. R2 pasa de 28,928 a **34,301 USD**, conservando la reserva incierta anterior de **0,6710225 USD** y el tope de 40 USD. M0 permanece en 21,71988544 USD. Tarifas conservadoras del perfil histórico; no son una factura ni el saldo disponible de la cuenta.

## Alcance y siguiente paso

El trabajo no integra el nuevo núcleo en la app. El almacén de mutaciones sigue limitado a 256 unidades; la búsqueda paginada sigue teniendo cobertura léxica acotada. No se acredita Firestore, Google/App Check, Android o iOS. La puerta completa de R2 sigue exigiendo otra reserva independiente, tres rondas congeladas y los umbrales globales/por familia del [plan](MEMORY_CORE_REBUILD_PLAN.md), además de las limitaciones de latencia y escala ya documentadas.

Documentación consultada: AGENTS, convenciones/calidad, diseño v2 y plan R0–R6, evidencia R2 anterior, modelo de datos, API, privacidad y guía de desarrollo. Se reutiliza la credencial local autorizada sin mostrarla; no se crea una clave nueva ni se consulta el saldo de OpenAI.

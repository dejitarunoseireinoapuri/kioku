# R2 · Evaluación independiente final

Autorizada el 16 de noviembre de 2026. Perfil `gpt-6.1-sol`, razonamiento `medium`, `store:false`. Rama `codex/memory-core-r2`. Solo textos ficticios definidos en el repositorio, almacenes RAM vacíos por escenario y metadatos técnicos en informes locales. Sin Firebase, móviles, recuerdos reales, migración, despliegue ni correo.

## Protocolo fijado antes de ejecutar

Se conserva la interpretación/consulta del último ajuste y se prepara una reserva nueva `f01–f60`, distinta por texto de todos los corpus anteriores. Diez familias de seis: independientes, contexto compartido, condiciones, atribución/citas, tiempo, repetición, semejanza, corrección/evolución, ambigüedad y olvido. Expectativas escritas antes de la API; nunca se envían al modelo. Son pruebas reservadas respecto a los ajustes de implementación, no una auditoría externa ni una muestra aleatoria de todo el lenguaje.

Hay 247 consultas previstas por ronda: 121 iniciales, 121 tras olvido y cinco tras corrección. Seis historias repiten una identidad; cinco corrigen un detalle; tres piden y resuelven una aclaración (dos tardías). Una pregunta de captura no debe crear hechos. Una historia conserva tres asuntos y olvida solo el intermedio. Se incluyen imperativos citados, fecha inválida que necesita aclaración, fechas de evento/registro separadas, cambio de zona cerca de medianoche, precisión de mes/año/cumpleaños, negaciones y cantidades tras borrar otro dato.

Además de los controles previos, el oráculo compara relaciones tipadas por identidades: evolución requerida en f48 y ausencia de relaciones artificiales en los demás. Las relaciones eliminadas al retirar un extremo dejan de esperarse. La comparación de cantidades escritas en palabras usa límites de palabra cuando corresponde; un término presente dentro de «recuerdos» no acredita una cantidad.

El oráculo externo al circuito generador/revisor verifica unidades, contenido esperado, modalidad, condiciones, atribución, fechas, literales propios, ausencia de valores sustituidos, identidad, relaciones, vecinos y referencias citadas. Es determinista y finito: las expresiones léxicas no constituyen una revisión humana exhaustiva de toda prosa ni garantizan detectar toda invención. Las discrepancias se conservan y no se recalifican para aprobar después de observar respuestas.

`core:final --live --round 1`, después `2` y `3`, permite solo tres rondas completas, sin subconjuntos. No sobrescribe informes. La siguiente exige anterior completa, los mismos 60 IDs, perfil/tarifas y huella de todos los archivos TypeScript de `ai/src/evaluation/fixtures` más los casos. Tres trabajadores procesan historias independientes; ninguna llamada se reintenta automáticamente. Fallos semánticos permanecen y no detienen por sí solos la ronda; problemas de credenciales, cuota o presupuesto interrumpen con estado visible. No se ajustan código, instrucciones ni oráculos entre rondas.

## Criterio de aprobación

Cada ronda exige al menos 95 % global y en cada familia y ningún fallo crítico abierto. Con seis ejemplos por familia, la condición por familia exige 6/6. Una negativa incorrecta cuenta como fallo. La evaluación mide tiempo/coste y conserva los bloqueos anteriores al final del ciclo; no los excluye del denominador. Pasar esta reserva no acredita Firebase, dispositivos o rendimiento en producción. Los límites de almacenamiento RAM a 256 unidades y recuperación léxica a 10 000 permanecen según el [plan](MEMORY_CORE_REBUILD_PLAN.md).

## Coste y controles previos

El contador inicial R2 es 34,301 USD y conserva 0,6710225 USD de reserva incierta. Tope acumulado de 50 USD, aumentado desde 40 bajo la autorización vigente de gasto para completar las pruebas, y 5 USD por ronda. No se reinicia M0 ni se consulta saldo del proveedor. Coste esperado orientativo de las tres rondas: 8–10 USD según ejecuciones anteriores, no una factura ni compromiso de gasto.

104 pruebas locales, TypeScript y formato antes de congelar; validación de corpus nuevo, cobertura de familias/consultas, referencias del oráculo, protocolo sin subconjuntos/repeticiones extra y rechazo de cambios entre rondas. El código de interpretación y almacenamiento no se modifica para esta evaluación. Solo cambia el arnés de pruebas, las expectativas de relaciones y el límite contable.

## Ejecución y resultado

Las tres rondas completas se ejecutan en la versión congelada `6eb2ecaa29e3dda1c3133ffcabaf79eb3742c284`, publicada antes de observar sus resultados. Huella común: `0c8605ee6e5662ed8ccf024d7a436070af787445844849957d1826ba22e0cc79`. Modelo solicitado y resuelto: `gpt-6.1-sol`, razonamiento medio. No se modifican código, instrucciones, expectativas ni perfil entre rondas; tampoco se repiten selectivamente los fallos.

[Informe consolidado de metadatos](evidence/r2-final-results.json). El exportador comprueba tres informes completos, mismos 60 IDs, diez familias, huella/perfil idénticos y ausencia de prosa generada o campos de contenido. Los informes locales originales quedan fuera de Git. La ejecución termina sin llamadas pendientes y libera su bloqueo.

| Ronda | Ciclos correctos | Porcentaje | Consultas devueltas/previstas | Llamadas API | Coste estimado USD | Criterio completo |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 55/60 | 91,67 % | 233/247 | 572 | 2,5985050 | No superado |
| 2 | 56/60 | 93,33 % | 235/247 | 578 | 2,6319025 | No superado |
| 3 | 57/60 | 95,00 % | 237/247 | 581 | 2,6311325 | No superado |

Resultado total: 168/180 ciclos correctos y 705/741 consultas devueltas. Las 36 consultas restantes no se alcanzan por fallos previos; no se excluyen sus escenarios ni se presentan como aprobadas. La tercera ronda alcanza el porcentaje global, pero falla familias y controles críticos. La variación entre rondas no representa una mejora de código: se ejecuta exactamente la misma versión.

| Familia (seis casos por ronda) | Ronda 1 | Ronda 2 | Ronda 3 |
| --- | --- | --- | --- |
| Asuntos independientes | 5/6 | 5/6 | 6/6 |
| Contexto compartido | 6/6 | 6/6 | 6/6 |
| Condiciones | 6/6 | 6/6 | 6/6 |
| Atribución y citas | 5/6 | 6/6 | 5/6 |
| Tiempo | 6/6 | 6/6 | 6/6 |
| Repeticiones | 6/6 | 6/6 | 6/6 |
| Datos semejantes | 5/6 | 4/6 | 6/6 |
| Corrección y evolución | 6/6 | 6/6 | 6/6 |
| Ambigüedad | 4/6 | 5/6 | 4/6 |
| Olvido | 6/6 | 6/6 | 6/6 |

## Fallos conservados e interpretación

| Caso | Rondas fallidas | Evidencia observada y límite de la conclusión |
| --- | --- | --- |
| f04 · valoración con motivo | 1, 2 | Se crean dos opiniones y un hecho frente a una opinión con su motivo y un hecho esperados. Tras olvidar la unidad seleccionada queda una unidad de más; en la segunda ronda también difiere la polaridad. La retirada por ID y la conservación del vecino pasan, pero el alcance semántico esperado no queda satisfecho. La cantidad extra no demuestra por sí sola un dato inventado: evidencia una división incompatible con la expectativa fijada. |
| f21 · cita literal compuesta | 1, 3 | Dos unidades de cita frente a una esperada, más la intención independiente. La respuesta cita dos IDs y el oráculo no encuentra una unidad que represente la cita completa: `EXPECTED_TARGET_MISSING` antes de intentar olvidar. Es una discrepancia de agrupación y de correspondencia con el oráculo; no un fallo observado de borrado ni ejecución de los imperativos citados. |
| f37 · intenciones de homónimos | 2 | El revisor rechaza la captura con `REVIEW_modality_attribution`. La propuesta contiene dos intenciones. Los metadatos conservados no permiten atribuir el rechazo a un campo concreto ni reconstruir el razonamiento del modelo. |
| f41 · intención propia negativa y ajena positiva | 1, 2 | Mismo rechazo de modalidad/atribución en captura, con dos intenciones propuestas. No se guarda ni se llega a consultar/olvidar. |
| f49 · aclaración tardía con otro asunto | 1, 3 | Primera ronda: `REVIEW_coverage` rechaza la propuesta inicial de aclaración, antes de responderla. Tercera: la aclaración llega a dos intenciones, pero falla `evidence_invariant:empty_fragment` antes de guardar. La reconstrucción local de los límites registrados sobre el fixture confirma que el segmento 2, token 5, contiene solo espacio y está marcado `context`; el validador exige contenido en un contexto. La segunda ronda sí completa el ciclo. |
| f53 · palabra unida inequívoca | 1, 2, 3 | La captura propone aclarar y la revisión lo rechaza: `REVIEW_clarification` o `REVIEW_clarification_coverage`. La expectativa era aceptar el significado claro sin pregunta. El fallo repetido está en interpretar/revisar, antes de cualquier escritura. |

El oráculo marca 4, 3 y 2 **comprobaciones críticas** fallidas, respectivamente, en dos, uno y un casos. No son nueve incidentes independientes ni nueve borrados indebidos. Incluyen cardinalidad/polaridad y referencias que no coinciden con la agrupación esperada. Se mantienen como fallos sin recalificarlos retrospectivamente. En particular, f04 exige resolver la unidad de gestión y el alcance del olvido; que la consulta posterior diga «no encontrado» no demuestra que todo el contenido previsto haya desaparecido del almacén.

Las quince correcciones aplicadas (cinco por ronda) superan los controles de contenido, evidencia literal conservada, ausencia del valor sustituido, identidad, fechas y vecinos. Las dieciocho repeticiones y los dieciocho casos de la familia de olvido pasan. En las 167 operaciones de olvido alcanzadas, los controles de retirada de IDs/soportes/proyecciones seleccionados y conservación de vecinos pasan; esto no elimina la discrepancia de alcance de f04 ni acredita paráfrasis desconocidas. No se detecta de nuevo la falsa ausencia de cantidades/ubicaciones de f56 después de retirar su vecino. No se afirma garantía universal ni validez en la app desplegada.

## Tiempo, coste y comprobaciones

| Etapa · segundos p50 / p95 | Ronda 1 | Ronda 2 | Ronda 3 |
| --- | --- | --- | --- |
| Interpretación inicial (60 intentos) | 6,12 / 15,39 | 6,47 / 12,32 | 6,27 / 13,62 |
| Consulta (233 / 235 / 237) | 4,15 / 5,61 | 4,10 / 5,62 | 3,98 / 5,54 |
| Corrección (cinco por ronda) | 10,97 / 15,21 | 11,12 / 13,88 | 9,50 / 12,49 |
| Resolución de aclaración (2 / 3 / 3) | 9,08 / 11,87 | 9,66 / 12,37 | 12,03 / 13,38 |

Los tiempos incluyen intentos rechazados. Aclarar es una etapa adicional a la interpretación inicial; no incluye espera humana. Con dos a cinco muestras, el p95 es el máximo observado, no una estimación robusta. El olvido local RAM sin IA tiene p95 de 0,58 / 0,43 / 0,54 ms: no acredita latencia móvil, Firestore o red. El objetivo de guardado p95 de 15 segundos no queda validado de forma consistente, y no se ocultan las etapas de aclaración.

Coste estimado de esta evaluación: **7,861540 USD**, 1731 llamadas. Contador R2: **42,162540 USD** frente a 34,301000 al inicio; reserva incierta anterior **0,6710225 USD**, conservada. Contador histórico M0 sin cambios: 21,71988544 USD. Se mantienen los topes acumulado de 50 USD y de 5 USD por ronda. Son estimaciones del contador local, no el saldo ni la factura de OpenAI.

Antes de congelar: **104/104 pruebas locales**, TypeScript raíz/núcleo y formato correctos. Tras ejecutar: consolidación/auditoría del informe, huella actual idéntica a las tres rondas, formato, `git diff --check` y `pwsh -NoProfile -File tooling/check-docs.ps1` correctos (74 documentos, 12 ADR). El primer intento con Windows PowerShell fue rechazado por su política de scripts; se usa después el PowerShell indicado por la guía, sin cambiar políticas del equipo. No se repiten pruebas móviles/emuladores ajenas al cambio ni se presentan como validadas. No se usa Firebase ni se lee, envía o modifica un recuerdo real.

## Estado y siguiente trabajo

**Evaluación terminada; R2 no cerrada.** No se avanza a R3, migración ni voz. Esta ejecución aporta evidencia favorable a la corrección y al olvido determinista por identidad, pero no justifica dar por fiable toda la interpretación ni reescribir de nuevo el almacenamiento.

La siguiente intervención debe precisar y aplicar una agrupación estable de valoraciones/citas, alinear interpretación y revisión de intenciones ajenas/aclaraciones, y representar correctamente los segmentos solo de espacio sin debilitar las comprobaciones de evidencia. Primero se reproducirán estos fallos como regresión, distinguiendo defectos del sistema y discrepancias de granularidad del oráculo; después se evaluará con otra reserva realmente nueva. Cualquier cambio de criterio se documentará hacia adelante, sin convertir estas rondas fallidas en aprobadas.

`f01–f60` ya se han observado. Si se usan para ajustar el sistema, pasan a regresión y no sirven como nueva evaluación independiente. Los comandos de las tres rondas no permiten sobrescribir sus informes ni añadir una cuarta para elegir el mejor resultado.

Fuentes consultadas: AGENTS, convenciones/calidad, plan del núcleo, informe de fiabilidad R2, contratos y ejecutor de evaluación existentes. No se crea una clave: se reutiliza la credencial local previamente autorizada sin mostrarla.

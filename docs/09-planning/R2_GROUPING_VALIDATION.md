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

Regresión dirigida inicial: **6/6**, 62 llamadas, coste estimado **0,2890575 USD**. Se comprueba todo el ciclo de cada caso; no solo la captura.

Regresión completa y tres rondas nuevas pendientes de registrar. Esta preparación no cierra R2 ni autoriza R3/voz. No se publicará una conclusión de cierre antes de terminar y revisar las tres rondas.

## Comprobaciones y límites

**110 pruebas locales correctas**, TypeScript raíz/núcleo y formato. Se añaden conservación literal/propietarios del separador, índices temporales estables, rechazos negativos sin mutación, revisión de aclaración obligatoria, corpus nuevo completo y aislamiento entre protocolos de reserva. El modelo semántico se comprueba con API real solo sobre fixtures; los dobles de test no prueban comprensión.

Comandos: `node --env-file-if-exists=.env.local prototypes/memory-core/evaluation/run.ts --live --regression-v5 --run <id>`; `--cases` solo para diagnóstico de corpus expuesto. Reserva: `node --env-file-if-exists=.env.local prototypes/memory-core/evaluation/grouping-run.ts --live --round 1`, luego `2` y `3`. Informe: `node tooling/r2-final-report.mjs --grouping`, sin API. No admite entradas personales ni archivos externos.

Fuentes consultadas: AGENTS, convenciones/calidad, definición del núcleo v2, protocolo/resultados finales R2, matriz de aceptación y ejecutores/contratos existentes. No se ha comprobado Firebase, Honor, iOS ni la latencia de una app real en esta continuación.

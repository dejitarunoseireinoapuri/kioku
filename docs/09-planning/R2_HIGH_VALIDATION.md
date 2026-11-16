# R2 · Validación independiente con Sol alto

Autorización directa del propietario del 16 de noviembre de 2026: continuar la validación independiente, corregir los problemas observados y usar Sol alto a partir de ahora, exclusivamente con datos ficticios. Sustituye el perfil medio del prototipo y autoriza este trabajo posterior al cierre de la cadena anterior. No autoriza tocar recuerdos reales, Firebase, móviles, producción, despliegue ni main. No se crean otras tareas. El perfil de producción se activará por separado; no se afirma que la app ya use alto.

## Protocolo previo a las rondas

- `gpt-6.1-sol`, razonamiento `high`, perfil explícito en cada informe, proveedor sin almacenamiento ni reintentos de inferencia. Se reutiliza `.env.local` comprobando solo presencia. Los informes históricos de medio permanecen intactos y sus ejecutores reservados rechazan otro perfil. Las regresiones expuestas sí usan el perfil actual y lo registran.
- Corpus nuevo `high-v8`, i01–i60: diez familias con seis casos cada una, seis correcciones, siete repeticiones, cuatro aclaraciones (dos tardías), una pregunta sin captura, un olvido intermedio, uno total y un cierre de dependencia autorizado expresamente en la fixture. Datos/versiones permanecen en RAM aislada.
- Expectativas independientes del circuito generador/revisor, escritas antes de observar las respuestas: unidades, términos/soportes, clases, fechas, condiciones, atribución, polaridad, relaciones, referencias de consulta, retiradas y vecinos conservados. Los casos no se envían al proveedor junto con sus expectativas. Es un conjunto elaborado en esta tarea, no auditoría externa ni muestra aleatoria; se verifica que los textos difieran de los corpus previos. Algunas estructuras continúan familias anteriores deliberadamente.
- Congelar código, corpus, oráculo y perfil en commit local antes de la primera ronda. Tres rondas completas desde RAM vacía, sin cambios entre rondas, subconjuntos, cuarta ronda ni sobrescrituras. La huella incluye implementación, ejecutores y expectativas. Los fallos se conservan y se analizan después de las tres rondas; un fallo de transporte/presupuesto detiene admisión y conserva las reservas inciertas.
- Criterio: al menos 95 % global y por familia en cada ronda, cero fallos críticos abiertos; con seis casos por familia exige seis éxitos. El objetivo p95 de captura/corrección sigue en 15 s y consulta en 8 s. El olvido medido es RAM, no servidor remoto ni app. No se cierra R2 solo por pruebas locales ni juicio del mismo modelo.
- Si hay correcciones guiadas por i, ese corpus pasa a regresión. Las verificaciones posteriores no recalifican estas rondas ni acreditan una nueva reserva independiente. Si quedan problemas o validación pendiente, se documentan expresamente; no se inventa cierre.

## Precomprobación y ajuste conocido

Sol alto, con las instrucciones anteriores, obtiene 2/3 en h30/h49/h53: h30 y h53 pasan; h49 se detiene por `ANSWER_REVIEW_scope`. 26 llamadas, 0,1987325 USD. No se conserva la prosa ni se afirma el motivo interno del rechazo. El aumento de razonamiento por sí solo no elimina esa incidencia. Se precisa la regla común de respuesta/revisión sobre categorías generales y acciones específicas: una inclusión semántica pertinente no exige igualdad de verbos, pero no permite inventar realización, rotura, sujeto ni incluir un objeto ajeno a una pregunta específica. Las comprobaciones de evidencia exacta permanecen.

Comprobación separada después del ajuste: h49/h53 pasan **2/2**, 32 llamadas y **0,2064325 USD**. No es una comparación controlada medio/alto, pues no se vuelve a ejecutar medio y el ajuste cambia instrucciones. No atribuir a alto las diferencias con informes históricos. Antes de la reserva pasan 226 pruebas raíz (124 del núcleo), TypeScript raíz/núcleo, formato y comprobación de 78 documentos/12 ADR. El corpus incluye dos cruces de fecha/zona (Madrid y Los Ángeles).

## Presupuesto y ejecución

Versión congelada antes de observar i: **`5de2f5f5ac89a39a684914fb944a509f74b25a77`**. Huella **`8acbb1f6a8454b9a73a37b163f852b96843636b0301a93c5f0626b0a005459ef`**, 60 casos y **252 consultas previstas por ronda**. Inicio de las tres rondas: R2 **76,205035 USD**, reserva incierta **1,78895 USD**. Las dos regresiones previas quedan fuera del denominador reservado. El consolidador `node tooling/r2-high-report.mjs` comprueba cobertura/perfil/huella de las tres rondas y exporta sus fallos sin API.

Inicio: R2 **75,79987 USD**, reserva incierta **1,78895 USD**; M0 **21,71988544 USD** y reserva M0 **0,20756492 USD**, separados. Se comunica antes de ejecutar el aumento del tope acumulado de **80 a 120 USD**, con **10 USD por ronda nueva**; las regresiones mantienen su límite de 5 USD. No se reinician contadores, no se eliminan reservas y no se afirma saldo del proveedor. Costes estimados por tokens con las tarifas locales registradas, no factura. La prueba inicial añade 0,1987325 USD, sin nueva incertidumbre.

Comandos de reserva: `node --env-file-if-exists=.env.local prototypes/memory-core/evaluation/high-run.ts --live --round 1`, luego `2` y `3`. Solo entradas ficticias versionadas; no admite textos ni rutas externas. Comprobaciones locales mediante `node tooling/m0.mjs check`, `core:check`, `test`, `format:check` y `pwsh -NoProfile -File tooling/check-docs.ps1`. Registrar resultados efectivamente ejecutados.

El propietario comunica durante la ejecución un saldo de 35 USD y solicita aviso cada 10 USD gastados en pruebas. El contador de avisos empieza en **79,45451 USD** de gasto R2 ya asentado; los avisos corresponden a gasto adicional desde ese mensaje, no a saltos del histórico. Se registra en `local-data/r2/high-spend-notices.json` sin credenciales ni datos. El saldo es el comunicado por el propietario, no una lectura de facturación. Las reservas en vuelo y las inciertas no se confunden con gasto asentado.

Primer aviso entregado al observar **10,140115 USD adicionales** durante la pasada completa de regresión. Se registra un incremento notificado; el siguiente umbral es 20 USD adicionales. No se envían mensajes externos ni se crean automatizaciones.

## Resultado de las tres rondas congeladas

El contraste de Git confirma que implementación, proveedor, ejecutores, oráculo y fixtures no cambiaron durante las tres rondas. [Informe consolidado sin prosa](evidence/r2-high-results.json).

| Ronda | Casos correctos | Consultas devueltas / previstas | Llamadas | Coste USD |
| --- | ---: | ---: | ---: | ---: |
| 1 | 55/60 | 247/252 | 636 | 3,80383 |
| 2 | 55/60 | 247/252 | 636 | 3,81455 |
| 3 | 56/60 | 250/252 | 642 | 3,8041075 |

Las tres incumplen el criterio global y por familia. i08, i12, i13 e i39 fallan en todas; i43 se detiene por `REVIEW_ownership_scope` y `REVIEW_ownership` en las dos primeras y pasa en la tercera. Los fallos críticos registrados no se borran por el diagnóstico posterior. No hay errores de transporte ni incremento de reservas inciertas. La reserva consumida pasa a corpus expuesto; estos resultados no se vuelven a calcular con las expectativas nuevas.

| Etapa · p95 en segundos | Ronda 1 | Ronda 2 | Ronda 3 |
| --- | ---: | ---: | ---: |
| Captura | 15,61 | 16,03 | 14,69 |
| Aclaración, sin espera humana | 28,60 | 26,87 | 24,77 |
| Corrección | 32,41 | 43,61 | 17,77 |
| Consulta | 7,50 | 7,26 | 7,47 |

Las consultas cumplen 8 s en estas muestras; captura/corrección no cumplen consistentemente 15 s. Solo hay cuatro aclaraciones y seis correcciones por ronda. El olvido mide RAM, con p95 inferior a un milisegundo; no acredita latencia remota ni móvil. No hay comparación controlada con medio.

## Diagnóstico y correcciones posteriores

- **i08, alcance:** la pregunta general por estudiar puede incluir el otro aprendizaje vigente. La versión expuesta distingue pregunta específica por oceanografía, general que admite el telar como contexto adicional e inclusiva que exige ambos. Tras olvidar el estudio, la específica exige ausencia y rechaza el telar como sustituto; la inclusiva exige solo el aprendizaje vigente. No se adjudica la prosa histórica ausente ni se cambia la regla global de citas.
- **i12, dependencia:** las tres propuestas omiten `requires`. La arquitectura exige representar una dependencia cuando conservar el plan subordinado necesariamente revela el evento. Se aclara dirección dependiente → base y que el orden de frases no importa, tanto para generación como revisión. Compartir fecha/persona/lugar por sí solo sigue sin crearla. La fixture conserva exactamente sus expectativas y autorización de cierre; las pruebas existentes rechazan dirección, tipo y ampliación incorrectos.
- **i13, condición:** un estado sintético correcto con «encontrar lino sin teñir» reproduce localmente los mismos fallos del oráculo, que solo aceptaba `encuentr`. La expectativa expuesta admite ambas conjugaciones y exige además lino y ausencia de teñido; rechaza requisito invertido, material distinto o detalle omitido. No se afirma haber leído el texto generado históricamente.
- **i39, vocabulario:** un estado sintético correcto reproduce ambas falsas alarmas porque `reserv` coincide dentro de `reservar`. La versión expuesta comparte el mismo patrón léxico, mantiene clase y fecha exactas, exige la fecha en soporte propio y prohíbe la fecha ajena en evidencia y campos canónicos. Negativos de modalidad/fecha equivocada y contaminación siguen fallando.
- **i43, corrección:** los índices y roles registrados muestran que los dos rechazos conservan el «no» de la alternativa descartada como context; el éxito lo incluye en replaced. Esto no revela el razonamiento interno del revisor. Se explicita retirar la alternativa contrastiva completa, preservando las negaciones vigentes reales. La expectativa expuesta de esta cantidad positiva rechaza también un «no» residual en evidencia/campos canónicos; no se elimina el revisor ni se relaja el control de cantidades antiguas. No fue necesaria otra llamada de diagnóstico.

Las adaptaciones viven en `high-regression.ts`, separadas de `high.ts`. Cuatro pruebas nuevas incluyen positivos, negativos y preservación de las expectativas originales. Tras los cambios pasan **230 pruebas raíz / 128 del núcleo**, TypeScript raíz/núcleo, formato y comprobador documental (78 documentos/12 ADR). Regresión dirigida: `node --env-file-if-exists=.env.local prototypes/memory-core/evaluation/run.ts --live --regression-v8 --cases i08,i12,i13,i15,i39,i43,i44,i46 --run high-targeted`: **8/8**, 96 llamadas, **0,605645 USD**, sin nueva incertidumbre. Su resultado se registra por separado; no suma éxitos al denominador reservado.

Versión de los arreglos guardada antes de la pasada completa: **`47009f1bad16c6f224a917b465fe195f0beb6478`**. Huella para i adaptado **`6367ef6fc802c5750408771e20954d57edaf80603efdd54e83d3ca532bf81d77`**. Comandos: `node --env-file-if-exists=.env.local prototypes/memory-core/evaluation/run.ts --live --regression-v8 --run high-full` y controles expuestos de dependencia/alcance/soporte propio con `--regression-v7 --cases h30,h49,h53 --run high-controls`. Sin cambios entre ambas pasadas; ninguna es reserva independiente.

La pasada completa obtiene **60/60**, **255/255 consultas**, cero comprobaciones críticas fallidas, 648 llamadas y **3,90395 USD**. Los tres controles h pasan **3/3**, 38 llamadas y **0,255445 USD**. No se incrementa la reserva incierta. El contraste de Git confirma la versión común. En la pasada de 60, p95: captura **16,11 s**, aclaración **38,94 s** (cuatro muestras), corrección **16,40 s** (seis), consulta **7,16 s**, olvido RAM **0,60 ms**. Captura/corrección siguen por encima de 15 s; no se retira revisión ni se cambia el perfil alto para ocultarlo.

## Precisión final de las negaciones

La revisión estática posterior identifica que el ejemplo «no eran cinco, eran cuatro» se había colocado junto a las negaciones vigentes, aunque es otra alternativa descartada. Se corrige esa explicación: el orden no cambia qué cláusula se excluye; una negación real como «no presté el objeto» debe permanecer cuando solo se edita otro detalle. No cambia el contrato, el revisor ni la política de guardado.

Se añaden dos controles dirigidos expuestos, i61 (orden inverso de la corrección de cantidad) e i62 (conservar la negación al cambiar latón por cobre). El corpus de regresión actual tiene **62 casos**; la pasada anterior de 60 corresponde expresamente al commit anterior y no se presenta como pasada de 62 ni como validación completa posterior. La quinta prueba nueva comprueba que perder la negación del soporte, invertir polaridad o conservar el material antiguo no pase. Resultado local final: **231 pruebas raíz / 129 del núcleo**, TypeScript del núcleo y formato correctos. Se selecciona la comprobación correspondiente al cambio: `--regression-v8 --cases i15,i43,i46,i61,i62 --run high-final-contrast`.

La comprobación final obtiene **5/5**, 68 llamadas y **0,4492375 USD**, sin nueva incertidumbre. i61 excluye la alternativa errónea completa e i62 conserva la negación vigente; ambos completan captura, corrección, consultas y olvido. Se conservan también los controles i15/i43/i46. Este ajuste no se suma a la pasada de 60 ni recalifica la reserva.

## Cierre de esta validación y trabajo pendiente

Gasto de esta tarea: **17,04193 USD**, desde el inicio R2 de 75,79987 hasta **92,8418 USD**. Desde el mensaje de saldo/avisos: **13,38729 USD adicionales**; primer aviso entregado, segundo umbral de 20 no alcanzado. La reserva incierta R2 permanece en **1,78895 USD**; M0 y su reserva histórica permanecen separados. Costes estimados por tokens; no se consulta ni garantiza saldo del proveedor.

Los problemas reproducidos tienen arreglos y regresiones positivas/negativas. **R2 sigue abierta**: falta una reserva nueva de la versión final y cumplir el objetivo de latencia de captura/corrección; las muestras pequeñas y el mismo modelo como generador/revisor no acreditan fiabilidad universal. No se elimina revisión ni se oculta un fallo con reintentos. No se ha probado ni modificado Firebase, recuerdos reales, Android/iOS o producción, ni hecho despliegue, push o integración en main en esta tarea. Se conservan los cambios en commits locales y el archivo Gradle ajeno. Las restricciones de cierre/suspensión de la tarea anterior ya se completaron allí, no se repiten por inferencia.

Fuentes consultadas: AGENTS; convenciones y calidad; desarrollo; plan R0–R6 y criterios de aceptación; núcleo v2 y modelo de datos; informe final R2 de asignación/soporte propio y su evidencia; proveedor, protocolos, oráculo, fixtures y pruebas existentes. Datos/API desplegados, privacidad y límites de acceso real permanecen vigentes. No es un cambio visual.

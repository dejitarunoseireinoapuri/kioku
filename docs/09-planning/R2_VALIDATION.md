# R2 · Evaluación de interpretación del núcleo v2

**Experimento histórico conservado.** La [continuación de R2](R2_RETENTION_VALIDATION.md) corrige la pérdida de soporte al editar y evalúa una reserva nueva. Los resultados de esta página no se sobrescriben; sus casos pasan a regresión.

Fecha: 2026-11-16. Rama: `codex/memory-core-r2`. El propietario autoriza Sol con razonamiento medio y datos exclusivamente ficticios; revoca los avisos por correo. No se autoriza ni ejecuta ninguna lectura de recuerdos reales, migración, llamada Firebase o despliegue.

## Resultado · R2 permanece abierta

Tres rondas reservadas completadas con el código congelado `b6a147e`, modelo resuelto `gpt-6.1-sol` y la misma huella `881fb810927f7afa051e7e41a65e6a2121f60fee31c03562422381af66073f79`. No se alcanza el 95 % acordado ni el criterio por familia; hay alertas sin adjudicar y un defecto de evidencia confirmado sin IA. No se pasa a R3 ni a voz. Los resultados anteriores de [R1](R1_VALIDATION.md) siguen siendo pruebas deterministas y no cubrían la suficiencia semántica de una edición parcial.

| Ronda | Recorridos que pasan todos los controles | Consultas devueltas / previstas | Llamadas API | Coste estimado |
| --- | --- | --- | --- | --- |
| frozen-1 | 44/60 · 73,3 % | 232/244 | 610 | 1,986410 USD |
| frozen-2 | 43/60 · 71,7 % | 212/244 | 568 | 1,8901325 USD |
| frozen-3 | 44/60 · 73,3 % | 219/244 | 584 | 1,9073825 USD |

Total: 60 escenarios diferentes × 3 rondas, 663 consultas devueltas, 1762 llamadas y 5,783925 USD estimados en reserva. No son 180 historias diferentes ni tres intentos por caso hasta conseguir verde. Los errores y recorridos incompletos permanecen incluidos. [Resultados por caso, familia, códigos, consumo y latencias](evidence/r2-results.json), exportados con `node tooling/r2-report.mjs` desde los informes locales sin texto.

| Familia · seis escenarios cada ronda | Ronda 1 | Ronda 2 | Ronda 3 |
| --- | --- | --- | --- |
| Asuntos independientes | 3/6 | 4/6 | 4/6 |
| Marco compartido | 6/6 | 6/6 | 6/6 |
| Condiciones | 5/6 | 4/6 | 4/6 |
| Atribución/citas | 2/6 | 3/6 | 3/6 |
| Tiempo/zonas/precisión | 5/6 | 4/6 | 5/6 |
| Paráfrasis/repeticiones | 5/6 | 4/6 | 5/6 |
| Similitud/homónimos | 5/6 | 5/6 | 5/6 |
| Corrección/evolución | 2/6 | 2/6 | 2/6 |
| Ambigüedad/reformulación | 6/6 | 6/6 | 6/6 |
| Olvido y consulta posterior | 5/6 | 5/6 | 4/6 |

Los casos de ambigüedad y marco compartido pasan las tres rondas. Las dificultades persistentes incluyen evidencia literal tras edición parcial, referentes cuya evidencia no conserva el antecedente, clasificación de citas/preferencias, repetición que sigue pidiendo aclaración y alcance de respuestas posteriores al olvido. Una fecha de unidad correcta no garantiza una consulta correcta: la familia temporal incluye errores de interpretación de la pregunta y rechazos de revisión.

## Rendimiento observado

| Operación del prototipo | p95 ronda 1 | p95 ronda 2 | p95 ronda 3 |
| --- | --- | --- | --- |
| Interpretar/revisar captura, 60 intentos/ronda | 13,543 s | 16,509 s | 15,862 s |
| Interpretar/revisar corrección, 4/3/3 intentos | 10,985 s | 19,173 s | 10,186 s |
| Consulta con revisión/revalidación | 6,251 s | 6,531 s | 5,967 s |

Se incluyen intentos fallidos en tiempos; consultas intentadas 232/213/220, distintas de las devueltas. El objetivo local de consulta ≤8 s se cumple en esta muestra; captura ≤15 s no se cumple en dos rondas. El número de correcciones es pequeño: su p95 prácticamente es el máximo de esos pocos casos. No se mide arranque frío, Firestore, red móvil ni recorrido nativo. El olvido puro ya resuelto tarda hasta ~1 ms p95 en RAM y no usa IA; no acredita los ≤3 s de servidor en producción.

## Protocolo fijado antes de medir la reserva

- 12 escenarios de ajuste independientes y 60 reservados, con seis por familia: asuntos independientes, marco compartido, condiciones, atribución, tiempo, duplicados, semejanza/homónimos, corrección/evolución, ambigüedad y olvido.
- Cada reservado define antes de ejecutarse unidades/modalidades/fechas/detalles, preguntas, objetivo de olvido y vecinos esperados. Seis incluyen repetición y cuatro una corrección explícita; dos más de la familia de corrección comprueban evolución verdadera. No son 60 correcciones ni se evalúan todas las combinaciones posibles.
- Tres rondas desde almacenes RAM vacíos, sin editar código/instrucciones/corpus entre ellas. Cada informe registra una huella del corpus y de fuentes de motor/adaptador/evaluador/fixtures. La reserva nunca se envía como ejemplos ni se incluyen sus expectativas en las solicitudes.
- Dos preguntas iniciales y dos posteriores por caso; cuatro preguntas adicionales tras las correcciones: 244 consultas previstas por ronda. Un fallo previo puede impedir las siguientes; se registran como recorrido no completado, no se eliminan del denominador de escenarios.
- Veredicto estricto por escenario: todas sus comprobaciones correctas y ningún error. Umbral ≥95 % global y por familia, sin fallos críticos. Con seis casos por familia, uno fallido ya impide cumplir ese umbral. No extrapolar los porcentajes a todo el lenguaje natural.
- Extractor y revisión usan `gpt-6.1-sol`, `reasoning.effort=medium`, Responses, servicio estándar, `store:false`, límites de entrada/salida, timeout y cero reintentos de inferencia. Se registra el modelo resuelto real.
- El modelo propone segmentos literales ordenados; el programa calcula posiciones UTF-16 y valida cobertura/propiedad con R1. Una segunda llamada revisa fidelidad antes de admitir el cambio. No escribe ni concede permisos.
- Las respuestas reciben solo unidades y fragmentos actuales con índices explícitos; se revisan y después se revalidan versiones/época. Preguntas y aclaraciones permanecen en RAM. Gestionar/olvidar resuelto siguen sin llamadas de IA.

La aclaración del prototipo combina en RAM entrada original, salto de línea y respuesta, con contexto de la pregunta separado. No es todavía el contrato multintervención de producción: la atribución temporal de una aclaración tardía y la retirada de valores sustituidos durante ella necesitan casos propios antes de R3.

## Evaluador y límites de interpretación

El oráculo independiente del generador comprueba cardinalidad, identidad, modalidad, fecha/precisión, condición, atribución, polaridad, detalles, referencias de respuesta, conservación de vecinos y retirada. Comprueba también detalles literales presentes y si la evidencia de una unidad contiene la firma de otro hecho. Los patrones del corpus están fijados antes de la reserva. Una segunda opinión del propio modelo es una defensa adicional, no el único juez.

Los patrones léxicos no son equivalencia semántica universal: pueden penalizar una paráfrasis válida o no detectar una invención sin marcador previsto. Un fallo requiere clasificar si es del motor, del adaptador o del oráculo. Las adjudicaciones se documentan; no se cambian expectativas de la reserva para obtener verde. No se conservan textos de respuestas, prompts ni datos personales en informes: solo IDs ficticios, códigos, comprobaciones, tiempos y consumo. Esta restricción limita la adjudicación retrospectiva de texto libre; no afirmar revisión humana completa de todas las frases.

Lectura de las alertas: `critical:true` es la categoría automática de una comprobación fallida, no un dictamen de daño confirmado. Más unidades de las esperadas puede ser una separación válida de experiencia y valoración; `fact` frente a `intention` en una cita agendada requiere precisar el estado del evento; una aclaración tras olvidar el referente puede ser legítima aunque el oráculo esperase `not_found`. No presentar la tasa estricta de recorridos como «porcentaje de inteligencia/acierto de Sol». Se conservan los fallos brutos, sin recalcularlos como aprobados por una explicación hipotética.

La consulta de este primer adaptador enumera el catálogo vigente hasta 32 unidades; la detección de repetición recibe el mismo catálogo acotado. Un catálogo mayor se rechaza explícitamente. Esto permite aislar interpretación de selección/retirada, pero **no acredita recuperación con inventarios de 100, 1000 o 10 000**, ni candidatos semánticos no recuperados. Esa puerta sigue pendiente y bloquea el cierre completo de R2, aunque los casos pequeños fueran correctos.

## Coste y aislamiento

Tope adicional de R2: 30 USD estimados. Cada ronda reservada: máximo 5 USD adicionales; cada ajuste: 2 USD. El contador histórico M0 no se reinicia ni se modifica. Se registra como base 21,71988544 USD estimados y 0,20756492 USD reservados pendientes; no es el saldo de OpenAI ni el consumo total de producción.

El contador R2 vive exclusivamente en `local-data/r2/budget.json`, excluido de Git. Contabiliza toda respuesta con usage, también incompleta/rechazada. Reservas inciertas se conservan de forma conservadora. La reserva se persiste antes de enviar la solicitud. Tres escenarios pueden ejecutarse concurrentemente, cada uno con su propio almacén vacío; presupuesto y checkpoints se serializan.

Consumo final de esta ejecución, incluidos tres ajustes y ambos diagnósticos: **7,092565 USD estimados**, 2 296 334 tokens de entrada y 135 173 de salida, en 2152 llamadas registradas. La suma de métricas coincide con el importe del contador. Quedan 0,05491 USD como reserva local incierta conservadora de los primeros ajustes; no se añade a gasto confirmado ni se borra para presentar un número menor. El contador de admisiones marca 2153 porque incluye una reserva sin llamada registrada. El histórico M0 permanece intacto; suma estimada M0 + R2 28,81245044 USD, que no incluye el uso de producción ni representa saldo de créditos.

Estimación conservadora: 2,50 USD/millón de entrada y 10 USD/millón de salida, sin descontar caché. Referencias comprobadas el 16 de noviembre: [modelo Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol), [precios estándar](https://developers.openai.com/api/docs/pricing), [salidas estructuradas](https://developers.openai.com/api/docs/guides/structured-outputs). La tarifa base publicada de entrada es 2 USD; el techo de 2,50 contempla escritura de caché. No se usa caché extendida ni nivel prioritario.

## Ajustes conservados

| Ronda | Recorridos completos correctos | Observación |
| --- | --- | --- |
| dev1 | 7/12 | Contexto compartido, clasificación de opinión atribuida, modalidad y contrato de citas |
| dev2 | 6/12 | Alcance de respuestas, índices de citas implícitos y errores locales del evaluador |
| dev3 | 12/12 | Catálogo con índices explícitos, distinción de realización no confirmada y alcance acotado |

Los tres ajustes se conservan, no sustituyen la reserva. Durante desarrollo se corrigió el oráculo: una actualización de membresía por retirada de relación no cambia contenido/fecha/revisión del vecino; «ahora» puede anclar el estado actual al día local; citar un plan para explicar falta de constancia de realización puede ser pertinente. Se corrigió también un patrón negativo que detectaba una frase incluso dentro de «no consta que…». Esas decisiones se fijaron antes de medir la reserva.

Se endureció la persistencia del contador frente a fallos de escritura local: no cambia estado en RAM hasta persistir; la sustitución del archivo admite tres intentos breves únicamente para bloqueos de archivo de Windows, nunca para inferencia. Los dos `EVALUATION_INTERNAL` de dev2 no se atribuyen a Sol: el informe no guardó detalle suficiente para asegurar su causa; hubo discrepancia entre una reserva en RAM y la persistida. La cota pendiente mayor se conserva al abrir rondas posteriores. Nuevos tests verifican la reserva antes de llamada y los fallos de persistencia.

## Comprobaciones locales

Ejecutadas: TypeScript raíz y `core:check`; 164 tests locales (102 M0 anteriores + 50 R1 + 12 nuevos del adaptador/oráculo/presupuesto); Prettier de ambos prototipos y herramientas; sintaxis Node de las dos herramientas R2; comprobador documental (70 documentos/12 ADR); `git diff --check`. El diagnóstico determinista se ejecuta aparte y **detecta una insuficiencia**, no cuenta como un test funcional aprobado. No se compila ni modifica Android/iOS; no hay backend desplegable, secreto nuevo, correo, APK o cambio del modelo activo de Kioku.

## Hallazgo independiente del modelo · edición parcial

`node tooling/r2-evidence-audit.mjs` ejecuta un diagnóstico ficticio sin red, separado del corpus congelado. Prepara una unidad con cantidad y lugar; corrige solo la cantidad conservando el lugar en el contenido revisado. Resultado comprobado: commit correcto, valor sustituido ausente, lugar intacto en canónico, pero su literal ya no existe entre los soportes. No es prueba de que Sol haya inventado el lugar: el dato venía del objetivo válido. Sí demuestra que la transición de corrección R1 retira demasiado soporte al conservar solamente el temporal.

Consecuencia: antes de R3 hay que preservar explícitamente la evidencia de los detalles no modificados, retirando solo los fragmentos erróneos de la identidad seleccionada. Debe poder trazarse qué campo se hereda del objetivo y cuál procede de la edición. No sirve conservar un fragmento temporal amplio si incluye también el valor que se quiere sustituir. Este diagnóstico no modifica el motor congelado ni datos reales; es un bloqueo documentado de cierre, no un test declarado superado por producir un commit.

La revisión siguiente debe añadir comprobaciones de contenido retirado en **todos** los soportes/derivados, no solo en la tarjeta normalizada, además de aclaraciones tardías con fecha/zona propia y enriquecimiento con detalles nuevos. La reserva actual deberá pasar a regresión si se utiliza para ajustar esos cambios; se necesitará otra reserva antes de afirmar el cierre de R2.

## Diagnóstico posterior y orden de continuación

[Resultados de diagnóstico](evidence/r2-diagnostics.json), separados de las tres rondas y sin modificar su puntuación:

- Dos ediciones parciales reproducen falta de literal para el detalle no modificado; en la comprobación corregida, el valor sustituido no aparece en contenido canónico, fragmentos ni términos derivados.
- Cuatro parejas nuevas, contadas en intervenciones distintas, conservan dos identidades y el primer dato intacto: otra fecha, homónimos con roles diferentes, otro producto y otra ocurrencia del mismo plan. Es una prueba complementaria pequeña; no sustituye recuperación de candidatos a escala ni prueba ausencia universal de falsas fusiones.
- La primera versión del comprobador de valor retirado buscaba también en metadatos y detectaba dígitos de IDs o el nombre del rol `primary`. Esas dos alertas se invalidan como error del instrumento, no como fallos de Sol. Se conservó el informe y se repitieron únicamente las dos ediciones con búsqueda por palabras sobre campos textuales. Ambas repeticiones y su coste están incluidos; no se reemplaza la reserva.

Continuación concreta antes de R3:

1. Precisar y probar el mapa de evidencia de detalles conservados al editar. Una copia de un campo autorizado debe conservar su soporte/linaje explícito, sin arrastrar el valor erróneo ni una fuente completa oculta. Reducir las decisiones del modelo a los cambios semánticos; la conservación/revocación corresponde al motor.
2. Separar claramente tipo de dato y estado de acontecimiento agendado/realizado; revisar límites de unidades para experiencia + valoración, referentes compartidos y las negativas tras olvidar. Adjudicar discrepancias del oráculo sin convertir la tasa anterior en aprobada.
3. Hacer explícita la acción de repetir/enriquecer una identidad existente para no depender de que el modelo reescriba todos sus campos de forma idéntica. Añadir aclaración tardía y edición ambigua como ciclos propios.
4. Implementar/medir recuperación de candidatos con inventarios 100/1000/10 000, falsos negativos de copias, indexación y límites de disponibilidad. El catálogo completo de 32 no supera esta puerta.
5. Tras corregir, convertir casos utilizados en regresión, preparar otra reserva independiente y repetir tres rondas con configuración congelada. Mantener Sol medio durante estos ajustes: el defecto de evidencia comprobado no depende del modelo. No hay en estos datos una comparación que justifique afirmar que Astra lo resolvería.

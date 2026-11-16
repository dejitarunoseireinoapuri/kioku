# R2 · Corrección de evidencia y nueva reserva

Fecha: 2026-11-16. Rama `codex/memory-core-r2`. Continuación autorizada: corregir pérdida de evidencia y fallos pendientes, repetir con historias ficticias nuevas, mantener `gpt-6.1-sol` con razonamiento `medium`. Sin lecturas/escrituras Firebase, recuerdos personales, móvil, claves nuevas ni correo.

## Cambio comprobado

La corrección anterior retiraba los soportes de la unidad salvo el ancla temporal, aunque la ficha heredara detalles como lugar o persona. Ahora el intérprete recibe la evidencia actual del objetivo y propone una partición literal completa de cada fragmento antiguo. El código verifica texto exacto, propiedad, rangos UTF-16, ausencia de solapamientos, límites y versión. La revisión contrasta la ficha con la unión de soportes nuevos y conservados, y con la ausencia del valor sustituido.

El motor divide propiedad compartida sin reescribir palabras de otros recuerdos. Conserva fuente, posiciones, fecha y zona de los fragmentos válidos; no genera una cita desde el resumen. Retira los soportes obsoletos de todas las ocurrencias de la identidad. Conservar una fecha conocida requiere su ancla explícita. Dividir un ancla temporal compartida que afecta a otro recuerdo falla sin cambios, pendiente de resolver el alcance. El olvido posterior sigue sin IA y elimina también la evidencia conservada.

La prueba determinista que antes reproducía la pérdida ahora confirma simultáneamente lugar presente en ficha y literal, valor antiguo ausente y cero llamadas de IA. Las pruebas incluyen edición sucesiva, repeticiones, vecinos con contexto compartido, propiedad ajena, rangos inválidos, Unicode, época obsoleta y ausencia de escrituras tras rechazos.

## Otros ajustes

- Repetición: el modelo propone una identidad; el servidor reutiliza sus descriptores canónicos revisados, sin exigir que el modelo reproduzca un descriptor libre idéntico. Sujeto, modalidad, polaridad, atribución, condición y fecha incompatible siguen bloqueados por comprobaciones deterministas. No se fusiona por parecido. Una fecha conocida puede usar su soporte anterior cuando el nuevo relato la omite.
- Contrato común de extracción/revisión: citas futuras son `intention`, reserva ya hecha es `fact` sin acreditar asistencia; comunicaciones de terceros son `quotation`; rechazo emocional es polaridad negativa aunque no contenga «no». Una duda que califica una observación y las alternativas de un mismo plan condicional permanecen unidas.
- Referentes: un sustantivo compartido puede respaldar varias fichas; la afirmación de la otra ficha no se copia como contexto. Una inspiración sin contenido de la idea acredita un suceso (`fact`); el contenido de una idea relatada es `thought`.
- Consulta: catálogo vacío devuelve ausencia sin IA. Una respuesta `not_found` se presenta con un aviso genérico y sin añadir recuerdos vecinos; la revisión sigue comprobando que realmente falta lo pedido. No oculta fallos del proveedor ni transforma una respuesta incorrecta afirmativa en aprobada. Los índices propuestos se validan antes de normalizar el aviso.
- Oráculo: comprueba también que el valor sustituido no sobreviva en la evidencia, además de la ficha. Los informes añaden estado de respuesta, cantidad de citas y modalidades/recuento de unidades, nunca texto libre ni errores sin filtrar.

## Protocolo y evidencia

El experimento original se conserva íntegro en [R2_VALIDATION](R2_VALIDATION.md) y `evidence/r2-results.json`. Sus casos `r01–r60` pasan a regresión; no vuelven a presentarse como reserva independiente. La nueva reserva `n01–n60` contiene historias distintas de las anteriores y de ajuste, distribuidas en las mismas diez familias; comparte formas lingüísticas con la regresión y no representa una muestra aleatoria de todo el lenguaje.

Cada ronda parte de almacenes RAM vacíos. Son 60 historias × tres rondas, no 180 historias distintas. Dos preguntas iniciales y dos posteriores por caso, más cinco preguntas tras edición: 245 consultas previstas/ronda. Incluye seis repeticiones, cinco correcciones y una evolución en la familia de corrección. Las interrupciones cuentan como recorridos fallidos y no eliminan casos del denominador. El mismo código/corpus/instrucciones permanece congelado entre rondas en `6d4813e`.

| Ronda congelada | Recorridos correctos | Consultas devueltas / previstas | Llamadas API | Coste estimado |
| --- | --- | --- | --- | --- |
| retention-frozen-1 | 54/60 · 90 % | 236/245 | 521 | 2,2162475 USD |
| retention-frozen-2 | 55/60 · 91,7 % | 239/245 | 518 | 2,177125 USD |
| retention-frozen-3 | 54/60 · 90 % | 236/245 | 521 | 2,2675375 USD |

Huella común: `d80d30cdd6958848965bea7e9941274bc833675f2565270c371a0c7cf58e6eb1`. Total de reserva: 711 consultas devueltas, 1560 llamadas y 6,66091 USD estimados. Las 13 correcciones aplicadas de 15 intentadas superaron las comprobaciones de ficha/evidencia; dos ediciones se detuvieron antes de aplicar (`SEGMENT_LITERAL` y `MODEL_INCOMPLETE`, ambas en `n48`). No se elimina ninguna del denominador ni se afirma que la insuficiencia de salida sea pérdida de datos.

Las familias de asuntos independientes, atribución, tiempo y similitud pasaron 6/6 en las tres rondas. Persistieron alertas de revisión (`n15` y `n60`), una repetición representada como dos unidades (`n32`) y discrepancias del oráculo (`n11`, `n45`, `n49`). Se conserva cada fallo y su etapa en [el informe exportable](evidence/r2-retention-results.json). No se supera el criterio global/por familia y **R2 no se cierra**.

Rendimiento observado: p95 de captura 12,58 / 11,79 / 10,92 s; consulta 6,01 / 5,91 / 6,78 s. Corrección 12,01 / 14,16 / 52,69 s con solo cinco intentos por ronda: el último valor incluye la salida incompleta. El olvido en RAM tarda menos de 1 ms p95 y cero llamadas de IA; no es rendimiento de servidor o móvil. La latencia de edición también necesita mejorar antes de integrar.

## Ajuste posterior separado de las rondas congeladas

Después de finalizar las tres rondas, `b7bd0d5` corrige tres fallos del oráculo: los números completos ya no coinciden dentro de un año, y las expectativas declaradas aceptan flexión de color y nominalización de actividad. Pruebas negativas mantienen el rechazo de otro color/deporte. Los [contraejemplos deterministas](evidence/r2-oracle-counterexamples.json) demuestran el defecto del instrumento; no prueban retrospectivamente el texto exacto de las respuestas, que no se almacenó. No se retocan los porcentajes históricos ni se reclasifican esos fallos como aprobados.

También se explicita identidad de ubicación: confirmar que un objeto está donde se guardó enlaza el dato cuando no hay cambio/otra ocasión; un traslado, otra fecha, otra persona/objeto, un nuevo acto de colocación o realización de un plan siguen independientes. Se conserva la comprobación determinista de anclas y la revisión semántica. El replay focalizado `n11,n32,n45,n49` pasa 4/4 con 44 llamadas y 0,2132725 USD estimados; es regresión tras cambios, no una nueva reserva.

Prueba adicional de doce historias nuevas de ubicación/identidad: **12/12 correctas**, seis confirmaciones que enlazan con la identidad anterior y seis eventos/datos que deben permanecer separados. Comprueba admisión de repetición o separación, identidad previa sin reescritura y retirada de los datos ficticios en RAM. 48 llamadas, 0,2964775 USD estimados. No incluye consultas naturales ni sustituye otra reserva completa. Los casos `n01–n60` quedan desde ahora expuestos como regresión v2; `--reserve` falla con `RESERVE_REFRESH_REQUIRED` hasta disponer de una reserva nueva. No se han ejecutado otras tres rondas completas con el ajuste posterior.

## Regresión y límites de adjudicación

Primera regresión completa tras conservar evidencia: 53/60, frente a 44/60, 43/60 y 44/60 históricos. Es una medición de ajuste sobre ejemplos conocidos, no prueba de generalización. Ajuste dirigido posterior: 6/10; se conservan todos los rechazos y fallos, sin repetir hasta verde. La primera ejecución sin permiso de red falló en transporte antes de recibir respuestas; no se atribuye al modelo ni se presenta como evaluación semántica.

El oráculo léxico no es equivalencia semántica universal. Por ejemplo, el histórico `r24` exigía `thought` a un relato de inspiración sin contenido de la idea; el contrato ahora explicita `fact`. `r26` usa «qué vi» para un recuerdo de visita: la interpretación audiovisual o la de lugares visitados no están distinguidas. Se conservan los resultados estrictos originales; no se recalculan como aprobados. Los informes sin texto no permiten afirmar revisión manual completa de cada respuesta ni que toda alerta sea daño confirmado.

## Alcance que continúa pendiente

La conservación estructural no garantiza que toda partición propuesta por IA sea semánticamente suficiente. El cierre requiere superar el umbral global y por familia sin alertas críticas pendientes, resolver las discrepancias de interpretación/oráculo y validar recuperación con inventarios de 100/1000/10 000. El adaptador actual entrega el catálogo completo hasta 32 unidades y rechaza más; no hay recuperación a escala. También siguen pendientes el anclaje de aclaraciones tardías con intervenciones distintas y la edición coordinada de dependencias compartidas.

Este trabajo no acredita persistencia remota, seguridad de proveedores reales, red móvil, Android/iOS, migración o integración R3. No se avanza a voz a partir de una mejora parcial de porcentajes.

## Fuentes consultadas y comprobaciones

Constitución `AGENTS.md`, convenciones, política de calidad y definición de terminado; diseño v2/ADR-012, plan de reconstrucción, validación R2 anterior, modelo de datos y contrato local. La clave existente autorizada se comprueba sin mostrarla; los contadores M0/R2 no se reinician. No se solicita acceso a los recuerdos reales.

Comprobaciones ejecutadas: 179 tests locales (102 del prototipo anterior y 77 del nuevo núcleo), TypeScript raíz y del núcleo, demo y diagnóstico de evidencia sin red, formato, comprobador documental (71 documentos/12 ADR), sintaxis de herramientas Node y `git diff --check`. La demo se adaptó al nuevo contrato explícito del soporte temporal; las rondas de IA no invocaban esa demo. Los informes exportables pasan una inspección de campos prohibidos y patrones de secreto, sin imprimir su contenido. No se compila la app ni se usan emuladores Firebase: esta entrega no incorpora persistencia remota ni adaptadores nativos. Las pruebas de propiedad/autorización y rechazo son del almacén simulado, no acreditan reglas o servicios de producción.

Coste estimado de esta continuación: **9,8438225 USD**, incluyendo ajustes, tres rondas completas y pruebas posteriores. Acumulado R2: 16,9363875 USD; base histórica M0 intacta: 21,71988544 USD. Se conserva una reserva local incierta de 0,6710225 USD, mayoritariamente de las conexiones bloqueadas al iniciar; no se suma como gasto confirmado ni se borra del contador. Estos importes son estimaciones conservadoras por tokens, no el saldo de créditos de OpenAI ni el consumo de la app en producción. No se consulta la cuenta de facturación.

Siguiente trabajo: reducir rechazos de partición/revisión y la edición de salida incompleta, validar el último ajuste con una reserva completa nueva y completar recuperación a escala y aclaraciones tardías. Las mejoras actuales no autorizan conectar este núcleo a los recuerdos reales.

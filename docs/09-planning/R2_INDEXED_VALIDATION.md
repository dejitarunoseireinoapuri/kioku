# R2 · Evidencia por posiciones, aclaraciones y recuperación paginada

Informe histórico conservado. La [continuación de fiabilidad](R2_RELIABILITY_VALIDATION.md) documenta las correcciones posteriores y la evaluación vigente; no recalifica las reservas de este documento.

Continuación autorizada el 16 de noviembre de 2026. Rama `codex/memory-core-r2`; perfil API `gpt-6.1-sol`, razonamiento `medium`. Exclusivamente datos ficticios definidos en el repositorio, sin lecturas/escrituras Firebase, móvil, recuerdos personales, despliegues ni correo. Sustituye el estado actual de la [continuación anterior](R2_RETENTION_VALIDATION.md), cuyos resultados se conservan sin recalcular.

## Contratos que cambian en el prototipo

El modelo ya no vuelve a escribir los literales del relato y de cada soporte conservado. Recibe tokens sin pérdida, indexados por el servidor, y propone límites inclusivos `end` con rol/propietarios o decisión `keep`. El inicio es el siguiente token tras el límite anterior. El código exige límites crecientes, cobertura completa y referencias vigentes; reconstruye exactamente los literales y luego aplica los validadores de propiedad, UTF-16, fidelidad y conservación existentes. No hay reparación aproximada ni reintento automático. La partición por tokens puede rechazar una selección errónea; elimina la necesidad de copiar palabras, no la incertidumbre semántica.

Las aclaraciones conservan hasta cuatro intervenciones con sus instantes y zonas aportados por la capa de admisión, nunca elegidos por IA. La interpretación recibe un calendario por intervención. El motor crea fuentes distintas con posiciones locales, mantiene cada ancla temporal en su fuente y rechaza anclas que crucen intervenciones, huecos, cronología inválida o fechas futuras de registro. Una aclaración no desplaza el «mañana» original; un «mañana» nuevo pertenece a la respuesta. Se retiran las palabras sustituidas también cuando la respuesta las cita para identificar el error. La pregunta del asistente no forma parte de la evidencia. No se implementa persistencia remota de pendientes.

La admisión limita también a 128 los fragmentos propios de cada identidad para que la acumulación de repeticiones no impida editarla con el contrato acotado. Alcanzar esa cota rechaza la nueva operación sin cambiar lo guardado; no crea una identidad duplicada para eludir el límite.

Las salidas incompletas del proveedor distinguen límite de tokens, filtro de contenido y motivo desconocido mediante códigos cerrados. Los tokens consumidos se contabilizan incluso si no hay resultado utilizable. No se guardan motivos libres del proveedor.

## Recuperación y límites de escala

`SearchIndex` construye un índice derivado desde todas las páginas de una misma cuenta y época: máximo 10 000 entradas, 256 por página, 40 páginas y 32 MiB. Rechaza páginas incompletas no resueltas, duplicados, exceso de cotas o cambio de generación; jamás entrega el índice parcial como si estuviera completo. Indexa contenido canónico y evidencia vigente, no el feed ni texto retirado.

Sol propone términos y variantes léxicas; el índice ordena coincidencias por rareza y longitud. No hay embeddings ni recuperación semántica exhaustiva. Se entregan como máximo 32 candidatos, con total, cantidad de coincidencias y estado de truncado visibles en el resultado interno. Una lista exhaustiva que excede la cota pide acotar. Una respuesta de búsqueda se limita a los candidatos recuperados y no acredita ausencia universal. Se comprueban cuenta, época e identidades/revisiones al leer evidencia y después de generar/revisar la respuesta. El reconocimiento de repeticiones usa esos candidatos; no transforma una búsqueda parcial en garantía de haber encontrado todas las paráfrasis.

La prueba de escala usa un catálogo sintético paginado separado del almacén de mutaciones R1. **No eleva la cota de 256 unidades/4096 documentos de ese simulador ni demuestra commits sobre 10 000 recuerdos.** La transacción/adaptador escalable siguen pendientes de R3; la capacidad productiva no está decidida. Los seis objetivos se mezclan con distractores de temas compartidos, repetidos a tres tamaños. Son seis historias de búsqueda, no 18 historias independientes ni una muestra aleatoria.

## Ajuste previo a congelar

- Seis regresiones dirigidas de condición, repetición, cita editada y marco compartido: 6/6; 58 llamadas y 0,278 USD estimados.
- Tres aclaraciones tardías nuevas: primer intento 1/3, con dos fallos de conservación de palabras sustituidas. Tras ajustar extracción/revisión, 3/3. Se mantienen ambos resultados; no se reclasifica el primero. 28 llamadas en cada intento; 0,1605825 y 0,1598175 USD.
- Escala 100/1000/10 000: 18/18 objetivos recuperados, respuestas correctas y repeticiones identificadas; 108 llamadas y 1,5960975 USD. No incluye commits de repetición a esa escala. La huella del informe registra la versión medida, anterior al endurecimiento final de páginas/cobertura; esos límites se verifican también con pruebas negativas deterministas.
- Regresión completa de las 60 historias anteriores: 60/60, 245 consultas devueltas, 526 llamadas y 2,4437475 USD estimados. Sigue siendo regresión conocida, no prueba de generalización.

## Reserva y puerta de salida

`v01–v60` es una tercera reserva: 60 relatos nuevos, diez familias de seis, dos consultas iniciales y dos posteriores por historia, más cinco consultas tras corrección. Incluye tres aclaraciones tardías y una pregunta que no debe guardarse. Las expectativas se escriben antes de llamar al proveedor. Comparte construcciones lingüísticas con regresiones; no representa lenguaje arbitrario.

El protocolo de la versión congelada permitía únicamente `indexed-frozen-1`, `indexed-frozen-2` e `indexed-frozen-3` sin seleccionar subconjuntos. Cada ronda comienza vacía y las siguientes exigen que la anterior termine con la misma huella de código/corpus. Los casos no se modifican entre rondas; después quedan expuestos y no se reutilizarán como reserva nueva. La revisión del mismo modelo no es el oráculo final: la evaluación externa compara unidades, modalidades, fechas, literales, ausencia del valor sustituido, vecinos e IDs citados. Sus límites léxicos siguen siendo explícitos.

Versión de reserva congelada: `e3d03c2969281f125b6e479146d579df253cd899`. Huella común: `06dc014dd66d99397c14e59624d0e5b624634e868cc79b86f9460a11a60950d0`. Se completan las tres rondas sin cambios entre ellas. [Informe consolidado con métricas y fallos por caso](evidence/r2-indexed-results.json).

| Ronda | Recorridos correctos | Consultas devueltas / previstas | Llamadas | Coste estimado |
| --- | --- | --- | --- | --- |
| indexed-frozen-1 | 55/60 · 91,7 % | 232/245 | 517 | 2,4358275 USD |
| indexed-frozen-2 | 54/60 · 90 % | 224/245 | 503 | 2,365715 USD |
| indexed-frozen-3 | 58/60 · 96,7 % | 245/245 | 546 | 2,551825 USD |

Total: 701 consultas devueltas de 735 previstas y 1566 llamadas, 7,3533675 USD estimados. Las interrupciones no se eliminan del denominador. Se ejecutan y aprueban 13 correcciones de 15 previstas; dos casos se bloquean durante la captura anterior, no durante la edición. No hay rechazo de copia literal ni salida incompleta en estas rondas. El olvido de los alcances preparados sigue sin IA; los casos bloqueados antes no acreditan todo el ciclo.

La tercera ronda supera el 95 % global, pero las familias compartida y corrección quedan en 5/6; las anteriores tampoco superan sus puertas. **R2 no está validada y no se pasa a R3 ni voz.** Los 60 casos ya expuestos quedan disponibles mediante `--regression-v3`; `--reserve` vuelve a fallar antes de acceder a la API hasta renovar la reserva. Esta es la única modificación posterior del ejecutor; no se ajusta el intérprete a partir de estos resultados.

Latencia p95: captura 14,55 / 20,44 / 17,62 s; todas las consultas (incluidas posteriores y corregidas) 6,40 / 6,47 / 5,30 s; corrección 14,20 / 19,07 / 15,69 s con solo 4 / 4 / 5 intentos. Captura/corrección no cumplen consistentemente el objetivo de 15 s. Olvido en RAM <1 ms; no es rendimiento Firebase o móvil. En escala, construir el índice tarda aproximadamente 4 / 23 / 220 ms y el ciclo consulta + reconocimiento de repetición tiene p95 19,98 / 26,28 / 24,06 s, con seis muestras por tamaño. Ese ciclo incluye seis llamadas y no es latencia de una sola consulta. R2 permanece abierta hasta superar al menos 95 % global y por familia, sin incidencias críticas pendientes. Con seis casos por familia, eso exige seis correctos en cada familia. No pasar a R3 o voz a partir de los ajustes dirigidos.

## Coste, validación y alcance

Se conserva íntegro el contador R2 (base de esta continuación: 16,9363875 USD) y la reserva incierta anterior de 0,6710225 USD, además del contador histórico M0. El tope local acumulado R2 pasa de 30 a 40 USD al amparo de la autorización vigente para completar las pruebas; cada ajuste sigue limitado a 2 USD, regresión/reserva a 5 y escala a 4. Son límites, no gasto comprometido ni saldo de la cuenta. No se crean claves ni se consulta facturación.

Comprobaciones locales: 93 tests del núcleo y 102 del prototipo histórico, TypeScript raíz/núcleo, demo, auditoría determinista de retención, formato y comprobador documental. El primer lanzamiento conjunto encontró un bloqueo `EPERM` de Windows en una prueba de archivo histórica; esa prueba y después la suite M0 completa pasan sin cambios. No se modifica ni oculta el intento fallido. Una consulta fallida libera también su reserva de evidencia; doce fallos consecutivos no bloquean la siguiente pregunta. El informe exportado conserva todos los intentos, comprueba huella/perfil/modelo resuelto y rechaza campos de texto/credenciales. El test adicional tras las rondas comprueba que no pueda reutilizarse la reserva expuesta como nueva. No se compilan Android/iOS ni se ejecutan emuladores porque solo cambia el prototipo aislado. Las pruebas de aislamiento/época son simuladas y no acreditan Firebase real. Documentación consultada: AGENTS, convenciones/calidad/terminado, diseño v2 y ADR-012, plan R0–R6, evidencia R2 anterior, modelo de datos, API y seguridad/privacidad.

## Incidencias identificadas durante la reserva

Las tres rondas reproducen una respuesta de ausencia sobre un vecino que sí permanece vigente tras olvidar el otro dato (v12). Las comprobaciones de conservación, contenido y evidencia del vecino pasan: es un fallo de recuperación/respuesta en catálogo pequeño, no una eliminación accidental demostrada.

Hay rechazos estructurales antes de escribir (v38 en la primera; v05, v47 y v53 en la segunda) y del revisor de propiedad (v60 en ambas). El código actual devuelve `evidence_invariant` sin distinguir la comprobación concreta. Sin conservar las salidas no se puede atribuir esos fallos a un índice temporal o propietario concreto. La siguiente corrección debe añadir diagnóstico cerrado más específico y reducir elecciones estructurales libres del modelo, sin quitar las comprobaciones.

La revisión de modalidad/aclaración rechaza v44 en ambas rondas. Su redacción «quedé con» admite más de una lectura; esto es una observación del texto ficticio, no una demostración del razonamiento interno del revisor. En la tercera pasan los rechazos estructurales y de revisión anteriores, pero v12 y la discrepancia temporal v47 persisten. v47 también muestra discrepancia con la fecha desconocida exigida por el oráculo a una preferencia «ahora». Debe precisarse si se representa observación vigente o comienzo del estado antes de diseñar la siguiente reserva. No se adjudican retrospectivamente como aprobados ni se presupone que toda discrepancia del oráculo sea daño confirmado.

## Continuación concreta

1. Distinguir con códigos cerrados qué invariante de fragmento/fecha/propietario se rechaza y reducir opciones inválidas en el contrato de salida, manteniendo rechazo atómico. No atribuir el fallo concreto sin esa evidencia.
2. Corregir la falsa ausencia al consultar un vecino vigente tras olvidar y probar tanto respuestas positivas como ausencias reales; no convertir cualquier coincidencia temática en respuesta.
3. Precisar y probar el criterio de cita acordada frente a encuentro realizado, y observación actual frente a comienzo de una preferencia. Resolver el oráculo antes de otra reserva, sin recalificar estas cifras.
4. Validar esos cambios con casos nuevos y después preparar otra reserva independiente. Mantener explícita la limitación de mutaciones RAM a 256 y preparar la transacción escalable en R3 cuando proceda.

Coste total estimado de esta continuación: **11,9916125 USD**. Acumulado R2: **28,928 USD**; reserva incierta conservada: 0,6710225 USD. M0 permanece en 21,71988544 USD, sin reinicio. No son el saldo de créditos ni una factura del proveedor.

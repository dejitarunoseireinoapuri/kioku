# R2 · Evidencia por posiciones, aclaraciones y recuperación paginada

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
- Regresión completa de las 60 historias anteriores: pendiente de resultado en esta preparación documental.

## Reserva y puerta de salida

`v01–v60` es una tercera reserva: 60 relatos nuevos, diez familias de seis, dos consultas iniciales y dos posteriores por historia, más cinco consultas tras corrección. Incluye tres aclaraciones tardías y una pregunta que no debe guardarse. Las expectativas se escriben antes de llamar al proveedor. Comparte construcciones lingüísticas con regresiones; no representa lenguaje arbitrario.

El protocolo permite únicamente `indexed-frozen-1`, `indexed-frozen-2` e `indexed-frozen-3` sin seleccionar subconjuntos. Cada ronda comienza vacía y las siguientes exigen que la anterior termine con la misma huella de código/corpus. Los casos no se modifican entre rondas; después quedan expuestos y no se reutilizarán como reserva nueva. La revisión del mismo modelo no es el oráculo final: la evaluación externa compara unidades, modalidades, fechas, literales, ausencia del valor sustituido, vecinos e IDs citados. Sus límites léxicos siguen siendo explícitos.

Resultados de las tres rondas: pendientes. R2 permanece abierta hasta superar al menos 95 % global y por familia, sin incidencias críticas pendientes. Con seis casos por familia, eso exige seis correctos en cada familia. No pasar a R3 o voz a partir de los ajustes dirigidos.

## Coste, validación y alcance

Se conserva íntegro el contador R2 (base de esta continuación: 16,9363875 USD) y la reserva incierta anterior de 0,6710225 USD, además del contador histórico M0. El tope local acumulado R2 pasa de 30 a 40 USD al amparo de la autorización vigente para completar las pruebas; cada ajuste sigue limitado a 2 USD, regresión/reserva a 5 y escala a 4. Son límites, no gasto comprometido ni saldo de la cuenta. No se crean claves ni se consulta facturación.

Comprobaciones finales e informe consolidado: pendientes al preparar esta versión. No se compilan Android/iOS ni se ejecutan emuladores porque solo cambia el prototipo aislado. Las pruebas de aislamiento/época son simuladas y no acreditan Firebase real. Documentación consultada: AGENTS, convenciones/calidad/terminado, diseño v2 y ADR-012, plan R0–R6, evidencia R2 anterior, modelo de datos, API y seguridad/privacidad.

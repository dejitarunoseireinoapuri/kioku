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

## Estado

Reserva preparada, pendiente de ejecutar las tres rondas. R2 permanece abierta hasta registrar y revisar sus resultados. Si un resultado se usa posteriormente para ajustar el sistema, estos casos pasan a regresión y dejan de ser una reserva nueva.

Fuentes consultadas: AGENTS, convenciones/calidad, plan del núcleo, informe de fiabilidad R2, contratos y ejecutor de evaluación existentes. No se crea una clave: se reutiliza la credencial local previamente autorizada sin mostrarla.

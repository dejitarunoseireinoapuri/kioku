# ADR-012 · Unidades de memoria independientes y mutaciones por identidad

- Estado: **aceptada para el nuevo núcleo** por el propietario el 2026-11-16, incluidas P1–P3. Prototipo con datos ficticios autorizado e implementado en su frontera determinista; integración, migración y despliegue pendientes. [Evidencia R1](../../09-planning/R1_VALIDATION.md).
- Fecha: 2026-11-16.
- Sustituye como dirección de diseño la representación de fuentes/mutaciones selectivas de [ADR-011](ADR-011-memory-control.md) y concreta evidencia/olvido de [ADR-005](ADR-005-memory-evidence-and-deletion.md). Conserva sus garantías de autorización, versiones y no resurrección; el despliegue anterior continúa activo hasta migrar.
- Diseño detallado: [MEMORY_CORE_V2](../MEMORY_CORE_V2.md). Secuencia y aceptación: [plan de reconstrucción](../../09-planning/MEMORY_CORE_REBUILD_PLAN.md).

## Contexto

El núcleo actual separa fichas pero permite que varias compartan el relato completo como cita. Corregir u olvidar una exige recortar/reconstruir fuentes y revisar con IA que ni revela el objetivo ni pierde contexto ajeno. El inventario semántico global de copias añade coste y motivos de rechazo a una acción explícita. El incidente del Honor del 16 de noviembre conserva ambos datos sin cambios: la protección evita pérdida, pero el recorrido básico no resulta fiable. No hay evidencia de un fallo de atomicidad ni del motivo semántico exacto del revisor.

## Decisión aceptada

1. Unidad canónica con identidad estable y revisión, independiente del relato que la contiene. Conservar solo la versión vigente y retirar el contenido sustituido al corregir; conservar historia únicamente cuando se relató una evolución real.
2. Evidencia literal segmentada con procedencia, contexto y propiedad explícitos. No mantener una copia monolítica paralela que obligue a reinterpretar o vuelva a revelar lo olvidado. Comprobar cobertura y significado al admitir.
3. Varias ocurrencias del mismo hecho respaldan una identidad. Las coincidencias dudosas siguen separadas y se resuelven antes de ampliar una mutación. Fechas/personas/condiciones distintas impiden fusiones automáticas por semejanza textual.
4. Separar interpretación, preparación del alcance y commit. La IA interpreta entrada/edición/orden natural; el servidor confirma cambios predeterminados sobre IDs/versiones. Gestionar y olvidar una selección resuelta no llaman al proveedor.
5. Corrección retira soportes erróneos de esa identidad sin reextraer vecinos. Olvido confirmado retira unidad, soportes, derivados y dependencias incluidas; revocaciones mínimas bloquean replays. Mantener atomicidad, límites y ausencia de escrituras directas del cliente.
6. Diagnóstico estructurado sin texto y estados que distinguen no aplicado, procesándose, confirmado e incierto. No pedir reformular al propietario cuando falla una invariante interna.
7. Migración explícita y acotada, con comparación previa y modo de mantenimiento. No doble escritura de memorias reales, restauración ciega de originales o migración durante una lectura ordinaria.

## Alternativas consideradas

| Alternativa | Valoración |
| --- | --- |
| Mejorar solo prompts/modelo de borrado | Puede reducir rechazos; conserva acoplamiento, incertidumbre, coste y dependencia de IA en cada borrado |
| Borrar solo la fila de recuerdo | Rechazada: deja fuentes, copias e índices capaces de revelarlo o recrearlo |
| Eliminar siempre el relato entero | Rechazada: borra datos ajenos a la elección |
| Quitar revisión semántica del flujo actual | Rechazada: facilita éxito aparente sin resolver evidencia compartida ni preservación |
| Mantener archivo original inmutable y un filtro de búsqueda | Rechazada como núcleo: no cumple retirada de fuentes y obliga a aplicar filtros perfectos en cada lectura/trabajo |
| Registro completo de todas las versiones/event sourcing | Rechazado para esta entrega: conserva contenido retirado y añade complejidad de purga; metadatos de operación sin texto sí se mantienen |
| Nueva base de datos de grafos o servicio vectorial | No justificada ahora: el fallo es del modelo de propiedad/significado, no falta de otro proveedor |
| Unidades y evidencia propias con relaciones explícitas | Recomendada; convierte el cambio autorizado en una operación comprobable y conserva contexto, a costa de una admisión/migración más cuidadosa |

## Consecuencias y límites

La partición, identidad semántica y fidelidad siguen siendo falibles. No se cambia una negativa genérica al borrar por guardados que pierdan detalles sin avisar. Las evaluaciones incluyen captura, aclaración, consulta, corrección, olvido y consulta posterior, con casos reservados y revisión contra evidencia.

No se promete descubrir todas las paráfrasis desconocidas. P2 precisa el alcance demostrable; P1 la conservación del original segmentado y P3 corrección frente a evolución. El propietario acepta las tres como contrato objetivo de BR-004/BR-008/BR-009. No se infiere que el servidor anterior haya adoptado ese contrato por aprobar el documento.

Los límites de transacción se mantienen. Un cierre demasiado grande no se divide en borrados parciales silenciosos. Una futura purga asíncrona requeriría otro estado/contrato. La migración requiere autorización concreta antes de enviar recuerdos reales a IA y antes de escribir/retirar datos o desplegar. No se crea un backup histórico como atajo de recuperación.

K4 conserva su aceptación histórica; la incidencia abre esta revisión y aplaza K5 hasta validar el nuevo núcleo en el alcance acordado. iOS nativo sigue pendiente y diferido por el propietario; no se declara validado por pruebas Android.

# ADR-005 · Evidencia, recuperación y olvido

- Estado: aceptada para diseño; proveedor de búsqueda/modelos y esquema físico final pendientes.
- Fecha: 2026-11-11.

Separar relato original, unidades de memoria, afirmaciones/contexto y derivados de búsqueda. Cada derivado conserva propietario, fuente y versión. Una respuesta se apoya en evidencia autorizada vigente; no trata una intención como hecho ni la ausencia de registro como prueba de ausencia.

La búsqueda combina contexto temporal/estructurado y recuperación semántica detrás de un contrato. Una búsqueda solo literal no cumple las preguntas objetivo. El índice/proveedor concreto se decide con una prueba de calidad y límites en la fase de recuperación, sin acoplar Domain a una API vectorial.

Una corrección incrementa versión e invalida derivados anteriores. Olvidar revoca inmediatamente la recuperabilidad del objetivo y limpia su contenido en fuentes compartidas, índices, contexto de conversación y derivados. Los jobs tardíos deben comprobar versión/tombstone para no recrearlo. Recibos de operación y diagnóstico no conservarán el texto eliminado.

En relatos con varios asuntos se requiere alcance por fragmentos: borrar un recuerdo no debe borrar otros asuntos por accidente ni dejar una copia del olvidado dentro del relato original. La limpieza física y el tratamiento de copias de seguridad se documentan sin prometer borrado instantáneo de sistemas externos.

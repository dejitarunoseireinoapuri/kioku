# Requisitos y aceptación

Contrato vigente. Las reglas BR se definen en [BUSINESS_RULES](../00-product/BUSINESS_RULES.md); la evidencia prevista se vincula en [TEST_MATRIX](../06-quality/TEST_MATRIX.md).

| Requisito | Aceptación verificable | Caso |
| --- | --- | --- |
| **FR-001 · Acceso y recuperación** | **AC-001:** la misma cuenta recupera sus recuerdos desde otra instalación; una cuenta ajena no puede leerlos ni operar sobre ellos. | UC-001 |
| **FR-002 · Clave propia** | **AC-002:** configuración administrativa privada desde el PC admite introducir/reemplazar la clave, informa de validación fallida y conserva la anterior válida. El móvil muestra estado seguro y nunca recibe el valor. Formulario móvil fuera del alcance personal actual por decisión del propietario. | UC-002 |
| **FR-003 · Captura voz/texto** | **AC-003:** escribir y enviar o mantener pulsado produce una intervención con intención y canal explícitos. Cancelar no incorpora recuerdos. | UC-003 |
| **FR-004 · Bloqueo** | **AC-004:** deslizar arriba permite retirar el dedo; las pausas no terminan el turno; Terminar inicia procesamiento una vez. | UC-003 |
| **FR-005 · Aclaración** | **AC-005:** «El examen es el 24» con contexto insuficiente pide concretar, sin inventar asignatura/mes ni marcar guardado. La voz recibe aclaración hablada y visible. | UC-004 |
| **FR-006 · Guardado automático** | **AC-006:** un relato claro se conserva sin otro Guardar/Confirmar; un reintento con la misma operación no lo duplica. | UC-003 |
| **FR-007 · Asuntos y contexto** | **AC-007:** un turno con varios asuntos genera unidades recuperables vinculadas al relato; mantiene opiniones, deseos y fechas sin pedir categorías. | UC-003 |
| **FR-008 · Recuperación natural** | **AC-008:** encuentra un dato mediante contexto y paráfrasis; «cuando Gemma se fuera de viaje» no exige título, etiqueta ni fecha exacta. | UC-005 |
| **FR-009 · Respuesta y evidencia** | **AC-009:** ofrece respuesta textual y fuente autorizada; una consulta de voz recibe también lectura de respuesta. Sin evidencia suficiente reconoce que no lo tiene guardado. | UC-005 |
| **FR-010 · Datos nuevos al preguntar** | **AC-010:** ofrece guardar el dato, espera Sí/No en el mismo contexto y solo lo incorpora si se acepta; repetir aceptación no duplica. | UC-006 |
| **FR-011 · Corregir** | **AC-011:** una orden inequívoca cambia el dato recuperable y sus índices; rechaza versiones obsoletas y no deja respuestas basadas en la versión anterior. | UC-007 |
| **FR-012 · Olvidar** | **AC-012:** objetivo inequívoco se elimina sin confirmación redundante; ambigüedad pide aclaración; el dato no reaparece en ninguna fuente ni derivado recuperable. | UC-008 |
| **FR-013 · Online** | **AC-013:** sin red se muestran controles indisponibles y reintento; no se captura para procesar después. Un fallo no muestra éxito. | UC-003, UC-005 |
| **FR-014 · Texto como memoria** | **AC-014:** no existe reproductor de grabaciones guardadas; el audio transitorio se limpia y la voz de una respuesta no se confunde con una fuente original. | UC-003, UC-005 |

**AC-015 · Aislamiento:** cancelación, cierre de sesión, cambio de cuenta, borrado o corrección invalidan resultados tardíos que ya no correspondan. **AC-016 · Contenido no confiable:** texto guardado que ordena ignorar reglas, revelar claves o borrar otros recuerdos no ejecuta instrucciones.

No se considera cumplida una aceptación por existir esta tabla o una captura de Stitch. Su estado se registra con pruebas reales al implementar.

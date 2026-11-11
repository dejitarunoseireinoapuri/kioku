# Matriz de aceptación y evidencia prevista

Todos los casos están **pendientes de implementación/ejecución**. No se incluyen porcentajes ni checks ficticios. Registrar comando, commit, plataforma/entorno, resultado y límites al ejecutar.

| Caso | Cubre | Evidencia requerida |
| --- | --- | --- |
| TEST-EVAL-001 | FR-005, FR-007, FR-008, FR-009, FR-011, FR-012, AC-005, AC-007, AC-008, AC-009, AC-011, AC-012, AC-016 | Evaluación temprana M0 de interpretación, recuperación y respuesta, corpus reservado y tres ejecuciones reales; umbrales y bloqueos definidos en el plan |
| TEST-AUTH-001 | FR-001, AC-001 | Misma cuenta recupera datos en segunda instalación; otra identidad no |
| TEST-KEY-001 | FR-002, AC-002 | Alta/reemplazo inválido/válido; secreto ausente de lecturas, memoria y logs |
| TEST-AUD-001 | FR-003, FR-004, AC-003, AC-004 | Hold/release/lock, silencio, Terminar una vez y Cancelar |
| TEST-AUD-002 | AC-015 | Permiso denegado, interrupción, respuesta tardía y cambio de sesión |
| TEST-AUD-003 | FR-014, AC-014 | Audio temporal privado y limpieza; sin reproductor de archivo original |
| TEST-MEM-001 | FR-005, FR-007, AC-005, AC-007 | Examen ambiguo, varios asuntos, zona temporal, deseo vs hecho |
| TEST-MEM-002 | FR-006, AC-006 | Guardado sin confirmación extra, sin duplicado al recuperar operación |
| TEST-MEM-003 | FR-011, FR-012, AC-011, AC-012 | Corrección/olvido eliminan recuperabilidad, incluidas fuentes mixtas y jobs tardíos |
| TEST-REC-001 | FR-008, AC-008 | Película y Gemma, padre la semana anterior, gustos, examen y deberes |
| TEST-REC-002 | FR-009, AC-009 | Evidencia válida; ausencia reconocida; voz con texto y parada de respuesta |
| TEST-PRO-001 | FR-010, AC-010 | Aceptación/rechazo/replay de propuesta sin cambio de modo |
| TEST-UI-001 | FR-013, AC-013 | Sin red no captura ni consulta ni encola; reintento no declara falso éxito |
| TEST-UI-002 | AC-003, AC-004 | Teclado, insets, texto grande y gestos Android/iOS |
| TEST-UI-003 | AC-009 | TalkBack/VoiceOver, foco, lectura accesible y entrada alternativa |
| TEST-UI-004 | AC-015 | Cambio de cuenta/cancelación invalidan resultados privados viejos |
| TEST-SEC-001 | BR-010, AC-001 | Lecturas y consultas con referencias ajenas denegadas |
| TEST-SEC-002 | BR-010 | Escritura canónica/índice/recibo/secreto directa denegada |
| TEST-SEC-003 | AC-016 | Recuerdo malicioso no ejecuta instrucciones ni obtiene claves |
| TEST-SEC-004 | BR-013 | Errores, logs y diagnósticos sin secretos ni contenido privado |
| TEST-API-001 | AC-006, AC-010 | requestId repetido, entrada distinta, timeout y concurrencia |
| TEST-API-002 | BR-013 | Admisión, límites y rechazo de clave/entorno/destino incorrectos |

La recuperación del ejemplo de una película y la corrección a otra son ramas de fixture distintas. No usar datos reales del propietario como corpus por conveniencia.

TEST-EVAL-001 se ejecuta antes de K0 según [M0](../09-planning/IMPLEMENTATION_PLAN.md#m0--prueba-temprana-de-memoria). Su resultado prueba viabilidad del prototipo, no completa los casos de integración, seguridad, concurrencia, limpieza ni voz de esta matriz. K2/K3/K4 reutilizan y amplían el corpus contra la implementación final.

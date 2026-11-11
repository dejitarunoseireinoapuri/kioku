# Modelo de amenazas inicial

Activos: relatos, memorias derivadas, fuentes, audio temporal, clave API, identidad, integridad del olvido y consumo de pago. Fronteras: dispositivo → backend → Firebase/gestor de secretos/OpenAI; respuestas de IA vuelven como datos no confiables.

| Amenaza | Control exigido | Evidencia prevista |
| --- | --- | --- |
| Cuenta ajena adivina un ID | UID verificado, autorización en canónico y consultas acotadas por propietario | TEST-SEC-001 |
| Cliente evita Functions | Denegación directa de escrituras y colecciones privadas | TEST-SEC-002 |
| Prompt injection en relato recuperado | Separar evidencia de instrucciones; ejecutor tipado con autorización independiente | TEST-SEC-003 |
| Fuga de clave o relato en errores/logs | Exclusiones por diseño, errores normalizados, pruebas de ausencia | TEST-SEC-004 |
| Doble envío/gasto o replay | requestId, admisión, fases y presupuesto de reintento; no promesa de un único cargo externo | TEST-API-001 |
| Job tardío resucita memoria olvidada | Revisión/tombstone comprobados al commit y al leer candidatos | TEST-MEM-003 |
| Cambio de cuenta conserva contexto | Invalidación de generación y estado privado | TEST-UI-004 |
| Audio abandonado o público | Scope de operación, acceso privado, caducidad y limpieza verificada | TEST-AUD-003 |
| Manipulación del reloj | Registro de servidor separado de fechas relatadas; no confiar en reloj cliente como autoridad | TEST-MEM-001 |
| Abuso de endpoints costosos | Cuenta permitida, App Check remoto, límites de tamaño, frecuencia y concurrencia | TEST-API-002 |

Amenazas y controles están pendientes de prueba hasta la fase correspondiente. No incluir evidencias privadas reales ni valores de configuración de Wonderdrop en los tests.

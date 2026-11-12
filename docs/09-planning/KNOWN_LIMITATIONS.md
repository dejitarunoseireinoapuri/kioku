# Estado real y decisiones pendientes

## Disponible

Nombre Kioku, definición funcional del propietario, estética B en Stitch y base documental adaptada de Wonderdrop. M0 incorpora un [prototipo TypeScript por texto](../../prototypes/memory/README.md), persistencia sintética local, extracción/recuperación/respuesta OpenAI y corpus separado de preparación/validación. Hay comprobación de tipos y pruebas locales ejecutables; la evaluación de viabilidad sigue en curso. No hay todavía build KMP, backend/reglas desplegados ni configuración de cuenta móvil. La plantilla Expo local está retirada como dirección, no borrada.

D0 se entregó en `40737a2`. El [plan de fases](IMPLEMENTATION_PLAN.md) concreta entregables, dependencias y criterios de cierre. M0 está en curso y debe validarse antes de K0–K6. La [primera evaluación real](../../prototypes/memory/evidence/2026-11-11.md) completó tres rondas con el evaluador corregido: no se supera el criterio de avance. La [segunda iteración](../../prototypes/memory/evidence/2026-11-12.md) incorpora correcciones y 52 pruebas locales superadas; su evaluación tampoco cierra M0. K0 no ha empezado.

Hallazgos: precisión temporal inventada, identidad/relaciones insuficientes entre fragmentos, interpretaciones no respaldadas y confusión entre contenido citado y datos propios. La rúbrica por palabras también rechaza algunas respuestas válidas. La segunda iteración conserva las fechas parciales y el contexto de identidad, separa citas de datos propios y protege el estado de abstención. Quedan por demostrar la fidelidad de toda extracción, el vínculo de fechas con su asunto y una respuesta suficiente sin rechazos innecesarios. Los corpus v1/v2 expuestos sirven como regresión: debe renovarse la reserva antes de aceptar M0. El informe distingue métricas automáticas, revisión dirigida y alcance no validado.

La clave local de prueba se configuró mediante el flujo seguro y está fuera de Git; no es el gestor de secretos ni el alta móvil de K1. La primera clave creada no pudo guardarse por pérdida del archivo temporal y quedó sin uso: debe revocarse en Platform. La sustitución se creó y guardó con autorización explícita. No se registran aquí sus identificadores ni valores. Límite acumulado estimado actual de M0: 20 USD, ampliado con autorización del propietario sin reiniciar el contador, con contador/reservas persistentes y llamadas reales explícitas; no confirma saldo o cobertura de los créditos.

El propietario ya ha creado un proyecto Firebase. Antes de conectarlo se verificará su identidad, región y papel como entorno; no se presupone que esté configurado ni se crean otros proyectos por documentar el plan.

## Antes de cada fase

| Pendiente | Cuándo resolver | Opciones/impacto |
| --- | --- | --- |
| Versiones y herramientas compatibles | K0 | Catálogo, wrappers y lockfiles verificados; no copiar versiones sueltas |
| Identificadores Android/iOS | K0/K1 | Identidad estable del propietario; no adivinar ni usar los de Wonderdrop |
| Método de acceso y cuenta permitida | K1 | Google/Apple/email u otro acceso Firebase; afecta recuperación y pruebas |
| Proyectos/región y permisos remotos | K1 | Entorno aislado y otro de datos reales; confirmar antes de crear recursos |
| Reutilizar/crear clave y destino privado | M0; integración de alta en K1 | Flujo seguro antes de implementar/probar llamadas; M0 no requiere pantalla de configuración móvil |
| Corpus, rúbrica y separación ajuste/validación | M0 | Datos ficticios, respuestas/fuentes esperadas y criterios fijados antes de medir |
| Procedencia, identidad y precisión temporal | M0 | Corregir hallazgos antes de avanzar; no completar fechas ni atribuir citas como hechos propios |
| Modelos, búsqueda e índices | M0; revisar en K2/K3 | Validar viabilidad temprano y repetir en los adaptadores definitivos; no una búsqueda solo literal |
| Límites de voz/texto/coste/tiempo | M0; ampliar en K2/K5 | Presupuesto y latencia antes de la prueba; límites acotados en cliente/servidor al integrarlos |
| Audio transitorio, limpieza y proveedor | K5 | Transporte/límite/retención verificados; no archivo permanente |
| Segundo plano/interrupción | K5 | No autorizar grabación oculta; decidir comportamiento de la intervención interrumpida |
| Alternativa accesible al gesto | K5 | Acciones nativas equivalentes; validar TalkBack/VoiceOver |
| Retenciones, backups y deshacer | Antes de datos reales | Recuperar en otro móvil no autoriza restaurar datos olvidados |
| Firma, licencia y distribución | Antes de compartir/publicar | Publicación aún no decidida; no fabricar licencia o credenciales |

Las decisiones anteriores no bloquean la creación de documentos. Bloquean únicamente la implementación o acción que dependa de ellas. Pedir la decisión concreta cuando sea necesaria y avanzar con lo independiente autorizado.

No restaurar como requisitos una bitácora navegable, directorios obligatorios, Expo, grabaciones archivadas, cola offline o una confirmación de guardado por turno. Son enfoques excluidos o sustituidos.

Tercera iteración: [evidencia v3](../../prototypes/memory/evidence/2026-11-12-v3.md). 62 pruebas locales, snapshot 3, revisión de captura, estados de evento y citas materializadas desde IDs. Comparación real completada: tres rondas por configuración, 5.4 low frente a Sol medium, cada una desde memoria vacía y con revisión de todas las salidas. Sol responde correctamente 189/192 consultas y 5.4 183/192; recuperación completa en consultas aplicables. Dos fortalecimientos sin respaldo en 5.4; ninguno detectado en Sol. No constituye cierre de M0.

El propietario ha elegido Sol medium como predeterminado del proyecto tras la evidencia v3. Pendientes antes de aceptar M0: corregir la guardia de citas por palabras, aclarar el estado de evento de contenido citado y reducir la latencia de captura (p95 Sol 15,89–19,33 s; objetivo 15 s). La rúbrica estricta conserva dos fallos de clasificación de citas en Sol; no son instrucciones ejecutadas. Al utilizar h para corregir, pasará a regresión y deberá renovarse la reserva. La comparación no valida cuentas remotas, Firebase, voz, dispositivos ni gran escala.


Iteración v4: [correcciones y protocolo](../../prototypes/memory/evidence/2026-11-12-v4.md). Implementadas citas con alcance semántico, estado de cita normalizado, snapshot 4 y revisión sin duplicar salidas correctas. 74 pruebas locales; regresión h y nueva validación j pendientes. M0 sigue abierta.

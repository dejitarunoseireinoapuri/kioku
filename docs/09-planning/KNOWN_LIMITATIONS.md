# Estado real y decisiones pendientes

## Disponible

Nombre Kioku, definición funcional del propietario, estética B en Stitch y base documental adaptada de Wonderdrop. M0 incorpora un [prototipo TypeScript por texto](../../prototypes/memory/README.md), persistencia sintética local y extracción/recuperación/respuesta OpenAI. La [evaluación v4](../../prototypes/memory/evidence/2026-11-12-v4.md) supera el criterio de viabilidad funcional: tres rondas de j desde cero, 96/96 capturas y 192/192 respuestas fieles tras revisión contra fuentes, recuperación completa y cero fallos críticos detectados. 74 pruebas locales y TypeScript strict superados. No hay todavía build KMP, backend/reglas desplegados ni configuración de cuenta móvil. La plantilla Expo local está retirada como dirección, no borrada.

D0 se entregó en `40737a2`. El [plan de fases](IMPLEMENTATION_PLAN.md) concreta entregables y aceptación. La [primera evaluación](../../prototypes/memory/evidence/2026-11-11.md), la [segunda iteración](../../prototypes/memory/evidence/2026-11-12.md) y la [comparación v3](../../prototypes/memory/evidence/2026-11-12-v3.md) se conservan con sus fallos; no permitían entonces avanzar. La nueva evidencia v4 permite continuar hacia K0, que no ha empezado.

Las correcciones v4 separan citas y datos personales por alcance semántico, materializan citas desde evidencia autorizada, normalizan su estado/tiempo y conservan origen y realización como ejes distintos. Las expectativas automáticas no sustituyen la revisión semántica: se mantienen sus falsos negativos y las adjudicaciones explícitas. Los corpus anteriores son regresión; j no se usó para ajustar entre rondas. Una corrección que use j exige renovar la reserva.

**Pendiente de rendimiento:** el objetivo p95 de guardado de 15 segundos no se cumple consistentemente: 17,25/14,79/19,09 s en las tres rondas. Mediana 6,98/7,44/7,26 s; consultas p95 7,02/6,83/6,64 s. El tiempo incluye los turnos automáticos de aclaración, sin espera humana; no incluye voz ni red móvil. La aceptación funcional es la del criterio previo del plan, separada de este objetivo. Mantenerlo abierto para optimización y repetir la medida en K2/K3 sin presentar el prototipo como producto perfecto.

**Alcance de la evidencia:** 32 relatos y 64 consultas sintéticas repetidos tres veces, revisión por el agente de desarrollo fuera del circuito de respuesta/verificación, sin auditor humano externo ni garantía universal. No valida volumen grande, aislamiento remoto, Firebase, concurrencia distribuida, dispositivos o voz. Las integraciones de K2/K3/K4 repetirán y ampliarán la evaluación.

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
| Procedencia, identidad y precisión temporal | M0 comprobado en j; ampliar en K2/K3 | Mantener la evidencia vigente sin completar fechas ni atribuir citas como hechos propios |
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

El propietario ha elegido Sol medium como predeterminado del proyecto tras la evidencia v3. Sus bloqueos de citas y estados se corrigieron en v4 usando h como regresión y j como reserva nueva; el informe v3 permanece histórico. Reducir la latencia de guardado sigue pendiente. La comparación no valida cuentas remotas, Firebase, voz, dispositivos ni gran escala.


La [evidencia v4 por caso](../../prototypes/memory/evidence/2026-11-12-v4.json) conserva las tres rondas de aceptación, diagnósticos automáticos, revisión contra fuentes, tiempos y costes estimados. Snapshot 4; los almacenes anteriores se preservan y rechazan sin migrarlos silenciosamente. No contiene claves, recuerdos reales ni saldo de la cuenta.

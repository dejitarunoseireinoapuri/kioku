# Estado real y decisiones pendientes

## Disponible

**K2 en curso:** rama `codex/k2-text-memory`; captura/clarificación/recuperación idempotentes implementadas y comprobadas localmente según [K2_VALIDATION](K2_VALIDATION.md). No hay callables K2 activados ni aceptación real de este build todavía. Consulta K3, corrección/olvido K4 y voz K5 siguen pendientes. Decisión del propietario: conservar recuerdos hasta borrarlos, preguntas solo de sesión y sin backups históricos adicionales; la configuración remota debe comprobarse antes de datos reales. El nuevo puente iOS necesita Mac/Xcode.

**Marca y acceso 憶 (13 de noviembre):** login/carga implementados en Compose para Android/iOS, iconos nativos preparados, APK Android y controles móviles correctos; 17 pruebas de lógica y 13 de interfaz API 36 con fixtures. [Evidencia y capturas](../01-functional/BRAND_PROPOSAL.md). No se actualizan móviles personales. iOS requiere compilar/verificar este build en Mac, aunque el propietario confirmó el acceso con el anterior; no se valida una versión nueva por extrapolación.

Nombre Kioku, definición funcional del propietario, estética B en Stitch y base documental adaptada de Wonderdrop. M0 incorpora un [prototipo TypeScript por texto](../../prototypes/memory/README.md), persistencia sintética local y extracción/recuperación/respuesta OpenAI. La [evaluación v4](../../prototypes/memory/evidence/2026-11-12-v4.md) supera el criterio de viabilidad funcional: tres rondas de j desde cero, 96/96 capturas y 192/192 respuestas fieles tras revisión contra fuentes, recuperación completa y cero fallos críticos detectados. 74 pruebas locales y TypeScript strict superados. K0 añade la base KMP/Compose; K1 conecta adaptadores de cuenta y prepara recursos remotos. Android compilable y probado con fixtures; iOS requiere Mac. La plantilla Expo local está retirada como dirección, no borrada.

D0 se entregó en `40737a2`. El [plan de fases](IMPLEMENTATION_PLAN.md) concreta entregables y aceptación. La [primera evaluación](../../prototypes/memory/evidence/2026-11-11.md), la [segunda iteración](../../prototypes/memory/evidence/2026-11-12.md) y la [comparación v3](../../prototypes/memory/evidence/2026-11-12-v3.md) se conservan con sus fallos; no permitían entonces avanzar. La evidencia v4 permitió iniciar K0.

**K0 actual:** [evidencia](K0_VALIDATION.md), nueve pruebas de lógica y seis de interfaz Android, controles de calidad y APK de vista previa. Los estados son ficticios; el catálogo no es memoria local del producto ni autorización remota. Cuenta/clave, voz, red real, persistencia y mutaciones no están conectadas. iOS tiene host SwiftUI y framework arm64, pero necesita compilación/navegación/tema en Mac con Xcode; no se declara K0 validada en ambos sistemas. No se probó Android API 29/37 ni dispositivo físico; el emulador usado es API 36. TalkBack y VoiceOver completos siguen pendientes.

Las correcciones v4 separan citas y datos personales por alcance semántico, materializan citas desde evidencia autorizada, normalizan su estado/tiempo y conservan origen y realización como ejes distintos. Las expectativas automáticas no sustituyen la revisión semántica: se mantienen sus falsos negativos y las adjudicaciones explícitas. Los corpus anteriores son regresión; j no se usó para ajustar entre rondas. Una corrección que use j exige renovar la reserva.

**Pendiente de rendimiento:** el objetivo p95 de guardado de 15 segundos no se cumple consistentemente: 17,25/14,79/19,09 s en las tres rondas. Mediana 6,98/7,44/7,26 s; consultas p95 7,02/6,83/6,64 s. El tiempo incluye los turnos automáticos de aclaración, sin espera humana; no incluye voz ni red móvil. La aceptación funcional es la del criterio previo del plan, separada de este objetivo. Mantenerlo abierto para optimización y repetir la medida en K2/K3 sin presentar el prototipo como producto perfecto.

**Alcance de la evidencia:** 32 relatos y 64 consultas sintéticas repetidos tres veces, revisión por el agente de desarrollo fuera del circuito de respuesta/verificación, sin auditor humano externo ni garantía universal. No valida volumen grande, aislamiento remoto, Firebase, concurrencia distribuida, dispositivos o voz. Las integraciones de K2/K3/K4 repetirán y ampliarán la evaluación.

La clave local de prueba se configuró mediante el flujo seguro y está fuera de Git; no es el gestor de secretos ni el alta móvil de K1. La primera clave creada no pudo guardarse por pérdida del archivo temporal y quedó sin uso: debe revocarse en Platform. La sustitución se creó y guardó con autorización explícita. No se registran aquí sus identificadores ni valores. Límite acumulado estimado actual de M0: 20 USD, ampliado con autorización del propietario sin reiniciar el contador, con contador/reservas persistentes y llamadas reales explícitas; no confirma saldo o cobertura de los créditos.

**K1 en curso:** rama `codex/k1-account-configuration`, [evidencia actual](K1_INTEGRATION_VALIDATION.md). Android real confirma Google/App Check válidos, estado de IA y recuperación de sesión; clave activada en Secret Manager mediante referencia revisión 1. Backend: revocación, admisión, reglas y CAS/rechazos de credenciales comprobados en emuladores. Producción `kioku-9454f`: Blaze, apps/Google, Firestore/Secret Manager en Bélgica, identidad autorizada, Play Integrity y callable activo. El propietario confirma que funciona en otro Android; no acredita aún recuerdos compartidos, que pertenecen a K2/K3. El propietario confirma también funcionamiento en iOS desde su Mac. Quedan cierre/revocación y sustitución reales y recopilar evidencia detallada de firma/App Attest/recorridos iOS. El propietario acepta la gestión de clave desde PC como recorrido personal actual de UC-002, sin formulario móvil. El texto genérico de error debe distinguir mejor acceso/dispositivo/red. Runtime K1 solo consulta metadatos; permisos de lectura del payload del secreto se concretarán con IA en K2. No hay recuerdos personales persistidos ni inferencia nueva. K1 sigue abierta; no se crean otros proyectos.

## Antes de cada fase

| Pendiente | Cuándo resolver | Opciones/impacto |
| --- | --- | --- |
| Versiones y herramientas compatibles | K0 Android comprobado; iOS pendiente | Catálogo, wrapper y lockfiles fijados; comprobar Mac según ADR-006 |
| Identificadores Android/iOS | Resuelto en K0; registros remotos en K1 | Base aprobada: `io.github.dejitarunoseireinoapuri.kioku`; debug Android `.dev` |
| Método de acceso y cuenta permitida | Decidido; integración K1 pendiente | Google y cuenta seleccionados; correo en configuración privada, sin copiar a fixtures |
| Proyectos/región y permisos remotos | Decidido; provisión K1 pendiente | Único proyecto remoto de producción `kioku-9454f`, Bélgica; pruebas demo locales sin crear otro proyecto |
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

# Cambios

## Fuentes compartidas · primera base local · 2026-11-17

- Rama `codex/shared-sources`: extractores deterministas TXT/MD/PDF/DOCX/HTML, localizadores y cobertura; solo texto extraído, sin conservar binarios o sincronizar.
- Almacén por cuenta/generación con replay, deduplicación, cancelación, caducidad y retirada; recuperación textual con citas. Pruebas solo en emuladores, sin nuevos endpoints exportados.
- Contratos/estado/pantalla KMP y recepción/lectura Android con fixtures. Receptor deshabilitado hasta completar transporte autenticado e integración; descarga web, Drive privado, preguntas e iOS pendientes. [Evidencia y límites](docs/09-planning/SHARED_SOURCES_VALIDATION.md). Cero API y ningún recuerdo real utilizado.

## Fuentes compartidas · planificación · 2026-11-17

- Plan de archivos, Drive y webs mediante Compartir → Kioku, con fuentes de referencia versionadas, citas, eliminación y fases I0–I7. Dirección técnica propuesta en ADR-016; no hay implementación/activación.
- Preparación sin API ni datos reales: corpus ficticio, extracción/recuperación deterministas y pruebas con emuladores/dobles; evaluación de IA e integración real separadas. [Plan y decisiones pendientes](docs/09-planning/SHARED_SOURCES_PLAN.md).

## Asignación global y soporte propio · 2026-11-16 · Continuación final R2 2 de 2

- Comprobador con biyección única acotada y soporte propio; rechazo de canónicos contaminados, anclas incorrectas y ambigüedad real. Dependencias con clase/dirección comprobadas y cierre explícitamente autorizado en fixtures. Revisor conservado y reforzado sobre todos los campos normalizados.
- 224 pruebas raíz, 122 del núcleo, TypeScript y formato correctos. Regresión h adaptada 59/60, controles g 9/9; una pregunta específica ambigua del comprobador se corrige después y pasa un ciclo separado h49 1/1. Históricos y fallos intactos; sin fusionar denominadores.
- R2 sigue abierta por evaluación independiente, variabilidad de revisión y latencia. Coste R2 75,79987 USD más reserva incierta 1,78895 USD; sin aumento del tope. Última continuación terminada, sin otra tarea; subida pendiente de autorización y suspensión del PC solicitada. [Evidencia final y límites](docs/09-planning/R2_ASSIGNMENT_VALIDATION.md).

## Polaridad, identidad y alcance · 2026-11-16 · Continuación R2 1 de 2

- Citas negativas conservan polaridad; la procedencia textual no exige inventar autor. Reiteraciones del mismo contenido vinculan evidencia y los planes sin enlace expreso mantienen su propio alcance temporal. La consulta distingue el predicado solicitado de otro hecho sobre el mismo sujeto.
- Comprobador con polaridad/atribución/sujeto, citas literales atribuidas y variantes explícitas de rechazo; positivos y negativos, sin cambiar los informes históricos. 117 pruebas locales correctas; dirigida 9/9 y regresiones g/f 60/60 cada una.
- Nueva reserva h congelada: 58/60, 57/60 y 57/60. R2 abierta por mapeo/relaciones/alcance/propiedad y latencia. Queda una continuación final autorizada; sin Firebase, app, recuerdos reales, despliegue ni correo. [Evidencia, coste y límites](docs/09-planning/R2_SCOPE_VALIDATION.md).

## Corrección y reevaluación aislada · 2026-11-16 · Continuación R2

- Ediciones parciales conservan rangos literales de detalles vigentes y su fecha/procedencia; retiran el valor sustituido sin reescribir vecinos. Repeticiones de ubicación enlazan la identidad, distinguiendo traslados, ocasiones, personas y modalidades diferentes.
- 179 tests locales; reserva nueva de 60 historias × tres rondas: 54/60, 55/60 y 54/60. Ajuste posterior del oráculo/identidad: 4/4 regresiones y 12/12 historias adicionales. Resultados históricos intactos, sin convertir esos ajustes en otra reserva. R2 sigue abierta por rechazos, nueva validación completa y escala pendiente.
- Todo en el prototipo RAM, Sol medio, sin recuerdos reales, Firebase, app o correo. [Evidencia y costes](docs/09-planning/R2_RETENTION_VALIDATION.md).

## Evaluación aislada · 2026-11-16 · Interpretación R2

- Adaptador Sol medio con salida estructurada, materialización literal, revisión de fidelidad, consultas de evidencia actual y presupuesto separado sin reiniciar M0. Solo corpus ficticio/RAM; no se toca Firebase, la app o recuerdos reales.
- 12 escenarios de ajuste y 60 reservados × 3 rondas congeladas: 44/60, 43/60 y 44/60 pasan todos los controles; 663 consultas devueltas. Fallos preservados y resultados por caso, costes/latencias/limitaciones documentados. No se declara cerrada R2.
- Diagnóstico sin IA confirma pérdida de evidencia de detalles no modificados al editar parcialmente. Catálogo pequeño sin validación de búsqueda a escala y oráculo con adjudicaciones pendientes; R3/voz siguen bloqueadas por estos criterios. [Evidencia R2](docs/09-planning/R2_VALIDATION.md).

## Prototipo aislado · 2026-11-16 · Núcleo de memoria R1

- P1–P3 aceptadas expresamente por el propietario. Motor determinista local con identidad estable, evidencia segmentada, corrección, enriquecimiento temporal limitado, olvido, tickets/recibos y revocaciones; sin Firebase, proveedor de IA ni modificación de recuerdos reales.
- 50 pruebas ficticias, incluidas 80 secuencias y 1600 pasos con oráculo independiente; fallos antes/después del commit, evidencia/dependencias compartidas, replays, límites y soportes obsoletos. Demo reproducible solo con contadores; tareas de calidad integradas sin dependencias nuevas.
- Interpretaciones semánticas preparadas, sin evaluación de lenguaje natural o búsqueda real. Contrato HTTP, R2–R6 y la app instalada pendientes. [Guía](prototypes/memory-core/README.md), [evidencia](docs/09-planning/R1_VALIDATION.md).

## Propuesta documental · 2026-11-16 · Revisión del núcleo de memoria

- Diseño v2 de unidades con identidad estable, evidencia original segmentada, repeticiones/contexto explícitos y cambios por IDs/versiones; lectura de gestión y olvido explícito resuelto sin nuevas llamadas de IA. Decisiones de producto P1–P3 propuestas, todavía sin aceptar.
- ADR-012, plan R0–R6 y criterios de ciclos completos antes de K5; migración con ensayo previo, mantenimiento, revocaciones y límites de reversión sin backups históricos. Contratos actuales conservados y mapa/estado documental enlazados.
- Documentación únicamente: no cambia el comportamiento instalado, no soluciona todavía el incidente, no ejecuta pruebas del nuevo motor ni modifica/envía recuerdos reales. [Diseño](docs/02-architecture/MEMORY_CORE_V2.md), [plan](docs/09-planning/MEMORY_CORE_REBUILD_PLAN.md).

## Sin versión publicada · 2026-11-16 · Lluvia bajo el contenido

- Lluvia Matrix al 30 % bajo mensajes, editor, cabecera, tarjetas, grupos de lectura y controles propios; conserva la intensidad del fondo en las zonas libres. Texto, iconos y bordes mantienen su contraste. Las superficies anidadas no acumulan atenuación y los menús conservan su propia capa. Misma animación y selección de modos.

## Sin versión publicada · 2026-11-15 · Matrix Terminal

- Fondos transparentes en mensajes, editor, cabecera, tarjetas, cargas, menús y botones propios: la misma lluvia Matrix continúa bajo todos ellos. Acciones principales/envío con contorno y texto/icono verde; modo activo subrayado. Google conserva su botón oficial. Se mantienen las confirmaciones y el funcionamiento de teclado, feed y gestión.

- Refinamiento de la lluvia a petición del propietario: más columnas y colas largas, distinta velocidad/desfase, cabeza que avanza por filas, símbolos que mutan en su sitio y reflejos, y transición continua entre verde vivo y tono tenue. Bases de lectura sobre el fondo más luminoso; pausa y reducción de animaciones conservadas.

- El propietario elige A de las tres propuestas Matrix. Tema compartido negro/verde fósforo, logo 憶 e iconos Android/iOS, acceso centrado, transcripción sin burbujas, modos compactos y gestión con tarjetas rectas. Google conserva su marca. Ajustes real muestra cuenta/estado de IA sin recorridos ficticios.
- Fondo con lluvia de glifos sintéticos, intensidades de verde y cabezas claras: sin entrada de datos, gestos ni red; se detiene fuera de primer plano y respeta la escala de animación. Los mensajes usan una base legible sobre el fondo. Conserva teclado, confirmaciones, feed y autoridad de los recuerdos.
- Rama `codex/matrix-terminal`; sin cambios de servidor o API. Referencia y límites en [STITCH_SOURCE](docs/01-functional/STITCH_SOURCE.md). Validación iOS nativa pendiente de Mac.

## Sin versión publicada · 2026-11-14

- Corrección activa de captura con dos fechas en una oración: evidencia temporal literal por asunto, sin debilitar el validador. App distingue fallo confirmado, procesamiento y transporte desconocido; consulta recibos sin reenviar, permite continuar y conserva tarjetas pendientes en RAM entre modos. Concesiones caducadas dejan de figurar como processing y no pueden confirmar tarde. Pruebas locales/IA real/Honor correctas; cinco funciones actualizadas con autorización y recorrido nativo productivo correcto, con datos ficticios retirados. iOS pendiente. [Evidencia](docs/09-planning/K4_VALIDATION.md).

- Confirmación de todo olvido por petición posterior del propietario: popup con objetivo, alcance y advertencia desde Gestionar o conversación. Cancelar/cerrar no aplica; confirmar mantiene la operación y espera al servidor. El aviso «He olvidado «recuerdo»» solo vive en RAM, fuera de historial/contexto. Pruebas locales y en Honor, estética B compartida y backend sin cambios; iOS pendiente. [Evidencia](docs/09-planning/K4_VALIDATION.md).

- Olvido de copias entre relatos activo: inventario completo acotado, paráfrasis del mismo hecho/sujeto, revisión de preservación y retirada conjunta de fuentes/índices/pendientes. Dato y texto completo conservan alcances distintos; fallo, cuota o copia concurrente no dejan borrado parcial.
- 84 pruebas de emuladores, 77 host, 41 de interfaz Honor y reserva final IA real correctas; se conserva el intento intermedio con conflicto de reconstrucción y se mejora su aclaración. Tres funciones existentes actualizadas con autorización; recorrido nativo productivo Honor correcto para olvido conversacional y desde la fuente, conservando datos ajenos. Datos ficticios retirados; sin nuevos permisos/índices/claves. Este bloque queda validado en Android/backend; iOS pendiente. [Evidencia y cotas](docs/09-planning/K4_VALIDATION.md).

- Continuación K4 preparada: interpretar órdenes explícitas de corrección/olvido y ofrecer guardar afirmaciones nuevas desde Preguntar, con aceptación/rechazo sin cambiar de modo. Tickets sin texto, versiones/época/caducidad y un único hijo; fecha relativa anclada al mensaje original.
- Chat compartido y cargas por fase, recuperación estable tras giro, limpieza de contenido antiguo antes de nuevas respuestas y protección de aclaraciones aceptadas frente a cambios. 74 host tests y 41 recorridos Honor con fixtures correctos. Dos nuevos endpoints y cuatro actualizaciones activados con autorización; recorrido conversacional productivo nativo en Honor correcto y sus datos ficticios retirados. Nuevo build iOS pendiente. [Evaluación con IA real y límites](docs/09-planning/K4_VALIDATION.md).

- K4 en `codex/k4-memory-control`: retirada/corrección selectivas desde «Texto original» → «Gestionar», fuente conservada y corrección distinguidas; preservación de otros asuntos, versiones, revocación y proyecciones atómicas. Dos callables nuevos y cinco adaptados activados con autorización; índice READY y rechazo HTTPS sin sesión.
- Revisión de memoria antes de restaurar contenido/enviar, limpieza de chat/contexto/fuentes después del éxito y recuperación de cambios sin duplicarlos. Corrección conserva borrador tras error/rotación; cargas y confirmaciones se desplazan a la zona visible. Teclado con poca altura prioriza campo/envío.
- Pruebas sintéticas locales y siete casos con Sol medio real (0,13151104 USD estimados), más aceptación nativa productiva en Honor correcta. Datos sintéticos de producción retirados al terminar. [Evidencia y límites K4](docs/09-planning/K4_VALIDATION.md): iOS, órdenes naturales/ofertas pendientes; K4 no cerrada.

## Sin versión publicada · 2026-11-13

- Integración K1: entrada Google con marca oficial, estado de cuenta/IA, cancelación y limpieza de conversación al cerrar sesión; adaptadores Android compilados e iOS preparados, pendiente Mac.
- Frontera administrativa de clave: validar, crear versión privada y activar referencia por revisión, preservando la anterior ante rechazo/conflicto e incertidumbre. Alta real personal completada (revisión 1); sin clave en APK o Git.
- Registros Android/iOS y Google habilitado; propietario activa Blaze. Firestore/Secret Manager en Bélgica, reglas deny-by-default, identidad con roles concretos aprobados y Play Integrity. Callable activo; Google/App Check, estado de IA y recuperación de sesión confirmados en Android real. Corregidos permiso HTTP inicial y número público de proyecto necesario para atestación.
- Formato móvil acotado a archivos de código/Gradle, evitando recorrer descargas y dependencias; APK r2 y `mobileCheck` final superados.
- 17 host tests, nueve instrumentados Android con fixtures, 14 unitarios backend y 13 de emuladores superados. gRPC de pruebas corregido; cero avisos altos, 13 moderados de herramientas pendientes y cero en dependencias de ejecución. K1 continúa abierta.

- K1 iniciada en rama aparte: primera frontera backend local para Google personal, UID vinculado, revocación/deshabilitación, admisión transaccional y respuesta segura sin secretos. Reglas Firestore deniegan acceso directo cliente; pruebas Auth/Functions/Firestore solo con fixtures en emuladores.
- Decisión del propietario: un único proyecto Firebase de producción, Bélgica; ningún proyecto remoto de desarrollo. La entrega inicial fue solo local; la integración posterior anterior detalla los recursos reales autorizados. Sin inferencia OpenAI nueva; K1 no cerrada.

- Ajuste visual solicitado tras revisar K0: bloque inicial sin hueco fijo, botón «Explicar» (preferencia final del propietario) y etiquetas en una línea; los controles se apilan si el texto ampliado no cabe en paralelo.

- K0 en rama independiente: base KMP/Compose, hosts Android/iOS, Koin, navegación tipada y recursos con estética B revisada en Stitch.
- Vista previa explícita con ocho estados ficticios, acceso a fuente/corrección y ajustes; no conecta credenciales, proveedores, almacenamiento personal o micrófono.
- Catálogo, wrapper verificado y lockfiles; JDK 21, SDK/target Android 37 y mínimo 29; mínimo iOS 16 y targets arm64.
- Android compilado, nueve host tests y seis recorridos instrumentados superados. Detekt, ktlint, arquitectura y Android Lint sin hallazgos; contraste corregido tras inspección real y comprobado por test.
- Host/esquema iOS preparados, compilación y revisión nativas pendientes de Mac. K0 no se declara validada en ambas plataformas.

## Sin versión publicada · 2026-11-12

- M0 v2: fechas con precisión explícita y evidencia literal, descriptores de identidad/contexto completo de fuentes seleccionadas, procedencia personal/relatada/citada y verificación de respuestas.
- Protección de credenciales en relatos, aclaraciones y preguntas; snapshots v2 aislados y escrituras locales atómicas con reintento acotado solo ante bloqueo de archivos.
- Una ronda reservada nueva completa, no superada; segunda interrumpida por conexión. Se conservan todos los intentos y los resultados históricos.
- Correcciones posteriores: impedir que una fecha de otro tema date un recuerdo y que una abstención ascienda a dato encontrado; 52 pruebas locales superadas. Los casos v2 pasan a regresión y se bloquea la aceptación hasta renovar la reserva.
- M0 continúa sin validar y K0 pendiente; sin configuración Firebase ni cambios de interfaz.

## Sin versión publicada · 2026-11-11

- Nombre elegido: Kioku (記憶).
- Primera versión funcional definida con el propietario: voz/texto, pulsación mantenida y bloqueo, guardado automático, recuperación por preguntas, corrección y borrado conversacionales.
- Android e iOS; publicación en tiendas pendiente.
- Arquitectura de Wonderdrop adoptada y adaptada: KMP, Compose Multiplatform, MVVM, Clean Architecture y fronteras Firebase nativas.
- La dirección Expo anterior queda retirada; se preserva localmente como historial, sin migración de código en esta entrega.
- Documentación y políticas iniciales; no se declara implementada ni validada ninguna funcionalidad de la app.
- Fases D0–K6 detalladas con alcance, dependencias, entregables y criterios de cierre; comprobaciones Android/backend/iOS separadas y validaciones en Mac explícitas.
- Integraciones y distribución posteriores separadas de la V1 personal. K0 continúa pendiente; documentar el plan no inicia implementación ni configuración remota.
- M0 añadida antes de K0 como prueba obligatoria de viabilidad de memoria: corpus ficticio reservado, evaluación separada de guardado/recuperación/respuesta, tres ejecuciones reales y criterios de avance o corrección. Matriz, estrategia y estado actualizados; prueba todavía no implementada ni ejecutada.
- Prototipo M0 TypeScript implementado: fuente original, recuerdos tipados, aclaraciones, búsqueda híbrida y respuestas con evidencia; CLI y almacén sintético aislado, borrado por fuente, validación de datos, control de gasto y errores sin contenido privado.
- Herramientas/dependencias fijadas, pruebas locales y corpus de ocho relatos de preparación y 32 reservados para validación. Conexión real iniciada; M0 no se da por validada por las pruebas locales ni por puntuación automática.
- Primera evaluación M0 registrada: tres rondas reales completas tras corregir el evaluador de retiradas; intentos anteriores conservados. 18 pruebas locales superadas. Fallos semánticos y falsos negativos de rúbrica documentados; M0 no superada y K0 pendiente. Consumo estimado al terminar la validación: 0,54759806 USD.

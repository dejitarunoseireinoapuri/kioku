# Fases de Kioku

Este documento define el alcance y el cierre de las fases. Los [requisitos](../01-functional/FUNCTIONAL_REQUIREMENTS.md) gobiernan el comportamiento; las [limitaciones](KNOWN_LIMITATIONS.md) registran las decisiones pendientes. Planificar no equivale a implementar.

## Vista general y estado

| Fase | Resultado visible | Estado |
| --- | --- | --- |
| D0 · Base documental | Producto, arquitectura y normas definidos | Entregada en `40737a2` |
| M0 · Prueba temprana de memoria | Evidencia de que interpretar, guardar y recuperar funciona antes de construir la app | En curso; comparación v3 completada, correcciones y aceptación pendientes |
| K0 · Base técnica | App navegable con estética B y datos ficticios | Pendiente |
| K1 · Cuenta y configuración | Acceso privado y configuración segura de la clave propia | Pendiente |
| K2 · Contar por escrito | Separar asuntos, aclarar dudas y guardar automáticamente | Pendiente |
| K3 · Preguntar por escrito | Encontrar recuerdos y responder con sus fuentes | Pendiente |
| K4 · Control de memoria | Ofrecer guardar un dato, corregir y olvidar conversando | Pendiente |
| K5 · Voz | Contar y preguntar hablando, con pulsación y bloqueo | Pendiente |
| K6 · V1 de uso personal | Recorrido completo comprobado en Android e iOS | Pendiente |

M0 está en curso y K0 todavía no ha empezado. La primera versión completa para uso personal llega en K6; las entregas anteriores permiten revisar avances concretos. No se fijan fechas sin conocer herramientas, dependencias y resultados.

Implementación y comandos de M0: [guía del prototipo](../../prototypes/memory/README.md). Su estado de validación y límites se mantienen en [KNOWN_LIMITATIONS](KNOWN_LIMITATIONS.md).

Primera evaluación: [informe del 11 de noviembre de 2026](../../prototypes/memory/evidence/2026-11-11.md). Prototipo y pruebas preparados, 18 pruebas locales superadas y tres rondas reales completadas con la versión corregida del evaluador; se conservan intentos anteriores. Hay fallos semánticos confirmados y discrepancias de rúbrica. M0 no está validada y K0 no puede empezar. Si los casos revisados se usan para ajustar el núcleo o la rúbrica, pasan a regresión y se prepara una nueva reserva de validación.

Segunda iteración: [evidencia del 12 de noviembre de 2026](../../prototypes/memory/evidence/2026-11-12.md). Precisión temporal, contexto/identidades, procedencia y abstenciones corregidos; 52 pruebas locales superadas. La evaluación v2 completó una ronda, falló el criterio de avance y se interrumpió en la segunda por conexión. Los ajustes posteriores se comprueban como regresión; exigen una reserva nueva y tres rondas antes de cerrar M0.

Tercera iteración: [comparación v3](../../prototypes/memory/evidence/2026-11-12-v3.md), 62 pruebas locales y tres rondas completas por configuración con la misma reserva h, desde cero. Se recomienda Sol medium frente a 5.4 low por respuesta, tiempo y coste medidos. M0 sigue sin validarse: bloqueos de citas compartidos, clasificación de eventos citados y latencia pendientes. Las correcciones usarán h como regresión y exigirán una reserva nueva antes de cerrar M0. K0 no ha empezado.

## Ejecución y criterios comunes

- Al comenzar, concretar fase o parte de fase, resultado revisable, dependencias y comprobaciones. No ampliar silenciosamente el alcance.
- Estados de implementación: **pendiente**, **en curso**, **implementada con validación pendiente** y **validada**.
- Al cerrar, registrar alcance, commit, comandos/resultados, plataforma/entorno y límites abiertos; actualizar este documento y KNOWN_LIMITATIONS.
- Aplicar la [definición de terminado](../07-development/DEFINITION_OF_DONE.md) y la [matriz de pruebas](../06-quality/TEST_MATRIX.md). La autoridad de las mutaciones se implementa en backend antes de presentar un cliente que las dé por hechas.
- Separar pruebas compartidas, Android, backend e iOS. Una demo ficticia no valida una integración real. Un resultado Android no prueba iOS.
- En Windows puede avanzar el trabajo independiente de un Mac. Si falta compilar o probar iOS, marcar esa validación pendiente; revisar iOS en cada fase afectada, sin acumular todo hasta K6. La fase siguiente respeta las dependencias y comprobaciones pendientes relevantes.
- El plan no autoriza por sí mismo recursos de pago, claves, despliegues, datos reales ni publicación. Resolver cada acción cuando corresponda sin volver a pedir autorizaciones ya concedidas.

## D0 · Base documental

**Resultado y entrega:** contrato de producto, AGENTS.md, mapa documental, requisitos y casos de uso, arquitectura/ADR, datos/API, seguridad, privacidad, calidad y flujo de trabajo adaptados de Wonderdrop.

**Cierre:** revisión semántica y comprobador documental operativo para enlaces, referencias e integridad. Entregada en `40737a2`; este documento concreta su secuencia. No contiene app compilable, backend ni llamadas reales de IA.

## M0 · Prueba temprana de memoria

**Resultado:** comprobar la viabilidad del núcleo de memoria antes de invertir en la app móvil. M0 debe validarse antes de empezar K0–K6; si no cumple los criterios, ajustar el enfoque y repetir la evaluación sin continuar con la app completa.

**Entrega:** un prototipo ejecutable por texto del núcleo TypeScript, sin interfaz móvil ni dependencia de K0/K1. Recibe relatos, conserva su texto original y recuerdos/contexto derivados, resuelve aclaraciones y permite consultar lo guardado. Usa almacenamiento de prueba aislado y sustituible; no exige desplegar Firebase. Las consultas se evalúan desde sesiones nuevas, tras recargar lo almacenado, sin pasar al modelo todo el historial ni las respuestas esperadas. Los componentes útiles podrán reutilizarse a través de las fronteras previstas; no se crea otra arquitectura de app.

**Corpus y casos:** al menos 30 intervenciones ficticias y 60 consultas con respuestas, fuentes y comportamientos esperados definidos antes de ejecutar. Reservar parte del corpus para validación, sin usarla para ajustar instrucciones. Incluir los cinco ejemplos del propietario y, con varios casos por categoría:

- Paráfrasis y relaciones entre personas, acontecimientos y recuerdos contados en momentos distintos.
- Varios temas en una entrada, detalles que se perderían al resumir, fechas relativas con fecha/zona de referencia y fechas desconocidas.
- Personas con el mismo nombre, pronombres y referencias ambiguas que requieran aclaración.
- Intención frente a hecho, negaciones, gustos, cambios de planes, correcciones y aparente contradicción frente a evolución temporal.
- Preguntas sin respuesta en los recuerdos, preguntas que no se convierten en hechos e instrucciones maliciosas dentro del texto almacenado.
- Retirada de recuerdos y exclusión de versiones obsoletas en el prototipo; no sustituye la limpieza y concurrencia completas de K4.

**Evaluación separada:**

| Etapa | Qué medir |
| --- | --- |
| Interpretar/guardar | Proporción de intervenciones con todos los datos y relaciones requeridos conservados fielmente; clasificación y aclaración correctas, sin hechos añadidos |
| Recuperar | Proporción de consultas respondibles que recuperan todas las fuentes vigentes necesarias entre los candidatos; registrar también candidatos irrelevantes y tamaño del conjunto |
| Responder | Proporción de consultas con resultado correcto y completamente respaldado, incluida la abstención/aclaración cuando corresponde; la fuente debe sostener la afirmación |

**Criterio inicial de viabilidad:** al menos 90 % en cada una de las tres etapas, tanto en total como por categoría aplicable del conjunto de validación. Es un objetivo de aceptación del prototipo, no un porcentaje de fiabilidad ya observado ni una garantía para datos futuros. En los casos críticos se exige cero fallos: inventar un hecho sin evidencia, convertir una intención en acción realizada, afirmar que algo no ocurrió solo porque no consta, usar contenido retirado/obsoleto o ejecutar instrucciones de un recuerdo. Un fallo crítico bloquea el avance aunque la media sea alta.

**Antes de ejecutar:** fijar corpus y rúbrica de puntuación, separación de ajuste/validación, modelo/configuración, número de candidatos, límites de entrada, presupuesto máximo y objetivo de latencia. Usar el flujo seguro de credenciales antes de implementar/probar acceso API; una credencial de ejecución privada del prototipo no adelanta el flujo de alta móvil de K1. No usar recuerdos reales. La documentación actual no crea claves ni consume créditos.

**Cierre:** ejecutar el conjunto de validación completo tres veces con la configuración fijada y cumplir los criterios en cada ejecución; no escoger solo el mejor intento ni reintentar hasta acertar. Guardar informe reproducible por caso y categoría, fuentes esperadas/recuperadas por identificador, fallos, latencia y consumo/coste medidos, commit y comandos. Revisar las respuestas contra las fuentes; una autoevaluación del mismo modelo no basta. Si se ajusta usando un caso reservado, deja de contar como validación independiente y se añaden casos nuevos. Los dobles sirven para comprobar la herramienta, pero el cierre de M0 requiere llamadas reales y evaluación del circuito completo de guardado, recuperación y respuesta.

**Alcance de la conclusión:** decidir continuar o corregir el núcleo según la evidencia. No valida todavía autenticación, aislamiento remoto, reglas Firebase, voz, dispositivos Android/iOS, retención del proveedor o comportamiento a gran escala. K2/K3/K4 conservarán y ampliarán esta evaluación contra sus implementaciones reales; un cambio de modelo, búsqueda o extracción exige repetir las comprobaciones afectadas.

## K0 · Base técnica Android/iOS

**Resultado:** primera app navegable con estética B y datos ficticios. Permite recorrer Contar, Preguntar y los accesos previstos, sin conservar recuerdos reales.

**Entrega:** estructura Kotlin Multiplatform/Compose Multiplatform y hosts nativos; MVVM/Clean Architecture; Koin y navegación tipada; tema carbón/coral/IBM Plex y recursos. Herramientas, versiones compatibles, catálogo, wrappers y bloqueo de dependencias cuando proceda. Comprobaciones reales de arquitectura, formato, Detekt y Android Lint, y pruebas significativas de estados/navegación.

**Antes de empezar:** M0 validada; inspeccionar las pantallas pertinentes de Stitch, revisar herramientas disponibles y resolver los identificadores necesarios. No recuperar Expo como aplicación paralela.

**Cierre:** compilar Android y comprobar el recorrido; compilar el host iOS en Mac y revisar navegación/tema. Si falta Mac, entregar con validación iOS pendiente e instrucciones reales para ejecutarla. Documentar los comandos disponibles.

**Fuera:** Firebase conectado, clave OpenAI, consumo de créditos, micrófono real y memoria real.

## K1 · Cuenta y configuración privada

**Resultado:** acceder con la cuenta autorizada, recuperar sesión e introducir o sustituir la clave propia de OpenAI. Cubre UC-001 y UC-002.

**Entrega:** autenticación y aislamiento de entornos/cuentas; adaptadores Firebase nativos; backend protegido y reglas. Configuración inicial y sustitución de clave mediante la frontera privada del servidor, separada de Firestore y los recuerdos. El cliente solo recibe su estado. Una sustitución rechazada conserva la configuración anterior válida. Cerrar/cambiar cuenta limpia el estado privado anterior.

**Antes de empezar:** decidir método de acceso/cuenta, entorno, región, registros nativos y reutilización/creación de clave mediante el flujo seguro. El propietario ya ha creado un proyecto Firebase: verificar identidad y asignarle entorno antes de configurarlo; no deducir que hace falta crear otros proyectos.

**Cierre:** pruebas positivas/negativas de acceso, aislamiento, configuración rechazada y recuperación de sesión; recorrido en ambos sistemas. Separar emuladores de comprobaciones reales de proveedor y atestación. No afirmar que los créditos funcionan sin una comprobación real autorizada.

**Fuera:** recuerdos personales y memoria conversacional completa. La operación de Firebase tiene facturación independiente de los créditos OpenAI.

## K2 · Contar por escrito

**Resultado:** escribir un relato, recibir una aclaración solo cuando haga falta y ver la confirmación después de guardar. Cubre UC-003 y UC-004 por texto.

**Entrega:** interpretar y separar varios asuntos conservando fuente y contexto; distinguir hechos, intenciones, opiniones y preguntas. Resolver fechas sin inventar información. Vincular las aclaraciones a su operación. Guardado automático sin dudas; versiones, identificador de petición e idempotencia contra duplicados. Errores recuperables sin declarar éxito anticipado ni crear cola offline.

**Antes de empezar:** K1 y las fronteras de autorización necesarias; partir de los resultados de M0 y verificar modelos y límites de texto, tiempo y coste en la implementación real. Resolver las decisiones de datos/API necesarias.

**Cierre:** corpus ficticio con entradas claras, ambiguas y mezcladas; probar aclaración, duplicados, fallos y concurrencia. Verificar autorización/persistencia con casos positivos y negativos; distinguir integración IA real de dobles de prueba. Revisar el flujo Android/iOS.

**Fuera:** búsqueda natural completa, corrección/borrado conversacional y voz.

## K3 · Preguntar por escrito

**Resultado:** preguntar con palabras naturales y obtener el dato con su fuente, o una respuesta honesta si no consta. Cubre UC-005 por texto.

**Entrega:** recuperación por significado, personas, contexto y fechas sin organización manual. Respuestas con evidencia propia vigente y acceso a su procedencia. Aclarar ambigüedades sin inventar recuerdos; no guardar preguntas como hechos. Corpus ficticio basado en los ejemplos del propietario: película cuando Gemma viajó, llamada al padre, gusto por un alimento, examen y deberes de japonés.

**Antes de empezar:** K2; trasladar y ampliar la evaluación de M0 para la búsqueda, índices y modelos reales. Fijar criterios de recuperación, evidencia, latencia y coste antes de medir; el prototipo no valida automáticamente los adaptadores definitivos.

**Cierre:** evaluación reproducible de paráfrasis, contexto, fechas, ausencia de datos y fuentes; aislamiento, versiones actuales y resistencia a instrucciones dentro de recuerdos. Registrar resultados y límites separando pruebas sintéticas e integración real; revisar ambos sistemas.

**Fuera:** no declarar que recuerda cualquier cosa por resolver un ejemplo. El control conversacional completo llega en K4.

## K4 · Control conversacional de memoria

**Resultado:** controlar lo guardado sin abandonar la conversación. Cubre UC-006, UC-007 y UC-008 por texto.

**Entrega:** ofrecer guardar un dato nuevo durante una consulta y aceptar/rechazar sin cambiar de modo. Corregir con objetivo y versión resueltos, distinguiendo corrección de evolución temporal. Olvidar con alcance claro sin confirmaciones redundantes; aclarar solo ambigüedades. Retirar lo olvidado de fuentes, índices, contexto y trabajos pendientes preservando datos ajenos al alcance.

**Antes de empezar:** K2/K3 y estrategia consistente de versiones, derivados y limpieza.

**Cierre:** probar aceptación/rechazo, ofertas caducadas, referencias ambiguas, versiones antiguas, cambios concurrentes y trabajos tardíos. Comprobar que lo olvidado no reaparece y no se borra información no solicitada. Verificar backend con casos positivos/negativos y recorrido Android/iOS.

**Fuera:** órdenes por voz, que reutilizarán estos contratos en K5.

## K5 · Voz Android/iOS

**Resultado:** contar y preguntar hablando, además de escribir, con los dos modos explícitos.

**Entrega:** micrófono/permisos nativos; mantener para grabar, soltar para terminar, deslizar arriba para bloquear y continuar sin mantener el dedo, acciones explícitas para terminar/cancelar. Alternativa accesible al gesto. No interrumpir antes de terminar ni finalizar por silencio una grabación bloqueada. Audio/transcripción transitorios con limpieza definida; recuerdos en texto. Aclaraciones por voz para entradas habladas; respuestas habladas con texto visible y opción de detener lectura. Corrección y olvido también por voz.

**Antes de empezar:** K1–K4; decidir modelos, duración/tamaño, transporte, retención, coste y comportamiento ante segundo plano/interrupciones. No deducir autorización para grabación oculta.

**Cierre:** pruebas nativas Android/iOS de permisos denegados, mantener/soltar/bloquear/terminar/cancelar, interrupciones, red y limpieza; accesibilidad con TalkBack/VoiceOver y texto grande. Distinguir eliminación local de condiciones de retención del proveedor.

**Fuera:** escucha permanente, funcionamiento offline y archivo de grabaciones.

## K6 · V1 de uso personal

**Resultado:** Kioku utilizable de extremo a extremo por el propietario en Android e iOS.

**Entrega:** recorrido completo de configuración, contar, aclarar, preguntar, aceptar un dato, corregir y olvidar por texto y voz. Recuperación desde otra instalación con la misma cuenta. Errores, interrupciones, límites/coste, privacidad y limpieza comprobados en conjunto. Instrucciones de instalación/mantenimiento y evidencias reproducibles.

**Antes de empezar:** dependencias anteriores validadas; resolver y autorizar entorno para datos reales, retenciones/backups y firma/instalación. Recuperar cuenta no implica restaurar información olvidada.

**Cierre:** aceptación real en ambos sistemas, seguridad y coste revisados, límites explícitos. Identificar por separado pruebas ficticias y reales. No declarar la V1 completa con funciones esenciales o validación nativa pendientes.

**Fuera:** publicar en tiendas, monetizar o conectar otras aplicaciones no es necesario para uso personal.

## Después de la V1

| Posible fase | Cuándo se define | Alcance por concretar |
| --- | --- | --- |
| F1 · Integraciones | Si el propietario las solicita | Samsung Reminder, Google Calendar u otras; permisos y acciones antes de conectar/escribir |
| F2 · Distribución | Si decide compartir o publicar | Firma, acceso, privacidad, licencia y requisitos de distribución/tiendas |

Estas opciones no comprometen fechas ni autorizan conexiones, escrituras externas o publicación.

Actualización M0 v3: [configuración y protocolo](../../prototypes/memory/evidence/2026-11-12-v3.md), 60 pruebas locales y reserva nueva h01–h32 con facetas de metadatos. El cierre conserva tres rondas completas y revisión independiente por caso, con métricas semánticas separadas del diagnóstico automático. K0 continúa pendiente.

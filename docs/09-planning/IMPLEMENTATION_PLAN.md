# Fases de Kioku

Este documento define el alcance y el cierre de las fases. Los [requisitos](../01-functional/FUNCTIONAL_REQUIREMENTS.md) gobiernan el comportamiento; las [limitaciones](KNOWN_LIMITATIONS.md) registran las decisiones pendientes. Planificar no equivale a implementar.

## Vista general y estado

| Fase | Resultado visible | Estado |
| --- | --- | --- |
| D0 · Base documental | Producto, arquitectura y normas definidos | Entregada en `40737a2` |
| K0 · Base técnica | App navegable con estética B y datos ficticios | Pendiente |
| K1 · Cuenta y configuración | Acceso privado y configuración segura de la clave propia | Pendiente |
| K2 · Contar por escrito | Separar asuntos, aclarar dudas y guardar automáticamente | Pendiente |
| K3 · Preguntar por escrito | Encontrar recuerdos y responder con sus fuentes | Pendiente |
| K4 · Control de memoria | Ofrecer guardar un dato, corregir y olvidar conversando | Pendiente |
| K5 · Voz | Contar y preguntar hablando, con pulsación y bloqueo | Pendiente |
| K6 · V1 de uso personal | Recorrido completo comprobado en Android e iOS | Pendiente |

K0 todavía no ha empezado. La primera versión completa para uso personal llega en K6; las entregas anteriores permiten revisar avances concretos. No se fijan fechas sin conocer herramientas, dependencias y resultados.

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

## K0 · Base técnica Android/iOS

**Resultado:** primera app navegable con estética B y datos ficticios. Permite recorrer Contar, Preguntar y los accesos previstos, sin conservar recuerdos reales.

**Entrega:** estructura Kotlin Multiplatform/Compose Multiplatform y hosts nativos; MVVM/Clean Architecture; Koin y navegación tipada; tema carbón/coral/IBM Plex y recursos. Herramientas, versiones compatibles, catálogo, wrappers y bloqueo de dependencias cuando proceda. Comprobaciones reales de arquitectura, formato, Detekt y Android Lint, y pruebas significativas de estados/navegación.

**Antes de empezar:** inspeccionar las pantallas pertinentes de Stitch, revisar herramientas disponibles y resolver los identificadores necesarios. No recuperar Expo como aplicación paralela.

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

**Antes de empezar:** K1 y las fronteras de autorización necesarias; elegir modelos y límites de texto, tiempo y coste. Resolver las decisiones de datos/API que requiera la implementación.

**Cierre:** corpus ficticio con entradas claras, ambiguas y mezcladas; probar aclaración, duplicados, fallos y concurrencia. Verificar autorización/persistencia con casos positivos y negativos; distinguir integración IA real de dobles de prueba. Revisar el flujo Android/iOS.

**Fuera:** búsqueda natural completa, corrección/borrado conversacional y voz.

## K3 · Preguntar por escrito

**Resultado:** preguntar con palabras naturales y obtener el dato con su fuente, o una respuesta honesta si no consta. Cubre UC-005 por texto.

**Entrega:** recuperación por significado, personas, contexto y fechas sin organización manual. Respuestas con evidencia propia vigente y acceso a su procedencia. Aclarar ambigüedades sin inventar recuerdos; no guardar preguntas como hechos. Corpus ficticio basado en los ejemplos del propietario: película cuando Gemma viajó, llamada al padre, gusto por un alimento, examen y deberes de japonés.

**Antes de empezar:** K2; concretar búsqueda, índices y modelos con el corpus y restricciones reales. Fijar criterios de recuperación, evidencia, latencia y coste antes de medir.

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

# Alcance de V1

**Dirección vigente de fuentes, 18 de noviembre:** un único chat para recuerdos y fuentes. La sección **Fuentes** solo admite URL y gestión; los archivos llegan exclusivamente mediante Compartir desde Drive u otras apps. Se conserva únicamente texto extraído, con citas y atribución diferenciada, sin sincronización automática. [ADR-017](../02-architecture/ADR/ADR-017-unified-source-chat.md) sustituye el selector y chat documental anteriores. Activado en servidor/Honor y probado con PDF ficticio sin API: [estado](../09-planning/UNIFIED_SOURCES_VALIDATION.md). TikTok/Instagram/YouTube, OCR y acceso privado OAuth quedan fuera; compartir un enlace no garantiza leer un vídeo. Las descripciones del piloto siguientes son históricas.

## Incluido

- Contar por voz o escribir cualquier dato personal que se quiera conservar.
- Dos intenciones: **Contar un recuerdo** y **Preguntar**.
- Tocar el micrófono para dictar localmente; X cancela y Stop deja el texto como borrador editable para envío manual. Transcripción visible en el campo mientras se habla, sin fallback remoto. Escribir oculta el micrófono; vaciar el campo lo restaura.
- Aclaraciones escritas posteriores a la intervención, con respuesta por voz o texto en el editor normal. Guardado automático al quedar claro el contenido.
- Separación de asuntos y conexiones automáticas sin clasificación manual.
- Consultas contextuales y temporales, respuesta siempre escrita, con gestión de fuentes vigentes accesible.
- Corrección y borrado por conversación; aclaración de borrado solo si su alcance es ambiguo.
- Oferta de guardar un dato nuevo surgido durante una consulta, sin cambiar de modo y sin guardarlo antes de aceptar.
- Configuración inicial y sustitución de la clave API propia desde el PC del propietario; el móvil consulta su estado. Recuperación de recuerdos al cambiar de móvil.
- Android e iOS, operaciones de memoria con internet y conservación permanente solo de texto. Transcribir localmente no crea cola offline. Disponibilidad nativa y estado por plataforma en [K5](../09-planning/K5_VALIDATION.md).

## Fuera de V1

Calendarios y recordatorios externos, avisos programados, importación de fotos/OCR y documentos aún no implementada, captura offline con cola, archivo permanente de audios, perfiles sociales, administración multiusuario, compras, planes, monetización, analítica de contenido y publicación automática en tiendas.

## Ampliación solicitada · fuentes compartidas

Disponible para pruebas ficticias en una instalación Android separada: [Kioku · pruebas](../09-planning/SHARED_SOURCES_PILOT.md), conectada a un servidor del PC, sin IA ni cambios en la cuenta habitual. Permite cargar/compartir/seleccionar documentos, revisar texto, buscar citas literales y eliminar con confirmación. La web está limitada al fixture reservado. No es activación de fuentes en Kioku productivo ni búsqueda semántica; siguen pendientes web arbitraria, Drive privado, iOS y los casos de integración real indicados en la evidencia.

El propietario autoriza implementar archivos, Drive y webs recibidos mediante Compartir → Kioku y selector de archivos para preguntar sobre su contenido. El [plan I0–I7](../09-planning/SHARED_SOURCES_PLAN.md) diferencia fuentes de referencia y recuerdos personales. La [primera base local](../09-planning/SHARED_SOURCES_VALIDATION.md) incorpora extracción, persistencia en emuladores y receptor Android aún deshabilitado; no acredita el recorrido integrado. Decisión explícita: conservar solo texto extraído y aplazar sincronización. Solo casos ficticios y cero llamadas/gasto de API. Vídeos, redes sociales, OCR y archivo de binarios quedan fuera de esta primera ampliación.

La cuenta necesaria para recuperar datos no transforma V1 en un producto abierto al público. Google y el entorno personal están decididos; el [estado por plataforma](../09-planning/KNOWN_LIMITATIONS.md) distingue lo comprobado de lo pendiente. Los mínimos de plataforma siguen la [decisión ADR-001](../02-architecture/ADR/ADR-001-platform-strategy.md).

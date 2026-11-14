# Privacidad, datos y permisos

## Qué necesita Kioku

Identidad de acceso, textos que el usuario decide recordar, contexto temporal y datos mínimos derivados para encontrarlos. Las personas mencionadas son contenido del recuerdo, no una autorización para acceder a contactos, mensajes o calendario.

La clave API se maneja mediante la frontera de secretos. Un relato puede contener datos sensibles: no usarlo para publicidad, analítica de contenido, fixtures o ejemplos publicados.

## Voz y reproducción

Pedir micrófono en contexto al primer uso de voz, con alternativa escrita si se deniega. No solicitar cámara, galería, contactos, ubicación, notificaciones ni escucha en segundo plano para V1. Acceso a internet y reproducción de respuesta respetan controles del sistema.

Solo el texto constituye el archivo de memoria. La transcripción y la respuesta pueden procesarse en servidores externos: no afirmar que todo ocurre en el dispositivo ni confundir borrar el audio temporal de Kioku con la retención del proveedor.

## Controles y retención

Corregir y olvidar por conversación. Confirmar el alcance antes de borrar únicamente si es ambiguo. Borrado de cuenta, exportación completa y recuperación de un estado anterior no se añaden por copiar funciones de Wonderdrop; deben definirse si se requieren antes de distribución.

Audio transitorio, recibos, propuestas, contexto, backups y metadatos necesitan retenciones concretas antes de conectarse a datos reales. La recuperación en otro móvil usa la misma cuenta; no deben entrar recuerdos en backups locales del sistema por accidente.

Este documento es una política de ingeniería inicial, no una política legal lista para publicar. Antes de distribución se revisarán procesadores, transferencias, retención, contacto y declaraciones de privacidad conforme al despliegue real.

Decisión personal para K2: recuerdos sin caducidad hasta borrado, preguntas solo en la sesión y sin backups históricos/PITR adicionales. Los pendientes y metadatos operativos tienen los plazos de [STORAGE_POLICY](../03-data/STORAGE_POLICY.md); fuentes/recuerdos no están sujetos a TTL. OpenAI recibe el texto necesario para extraer/revisar y crear embeddings; Responses usa `store:false`, lo que no equivale a afirmar retención cero del proveedor. La clave permanece en Secret Manager y el cliente solo muestra el resultado confirmado. K3/K4 conectarán consulta y controles conversacionales; no se presentan como disponibles al entregar K2.

K3 permite seguimientos en Preguntar enviando hasta cuatro preguntas previas junto con la actual, siempre dentro del límite total de 2000 caracteres. Este contexto está solo en RAM de la sesión; pasa al servidor/proveedor como parte de la consulta para resolver referencias, sin crear recuerdos, transcripciones persistentes ni un historial Firestore. No se envían respuestas anteriores como evidencia. Reiniciar, cambiar de intención o salir de la cuenta limpia el contexto; una recreación nativa lo conserva en memoria. La retención del proveedor mantiene los límites declarados arriba. K4 deberá retirar también ese contexto al olvidar contenido; no se presenta el olvido como implementado por este cambio.

Presentación posterior: hasta 40 mensajes de Preguntar, incluidos los resultados, permanecen visibles en RAM para releer durante la sesión de consulta. No se persisten en disco/Firestore ni se añaden a backups, tampoco se envían las respuestas previas como hechos. Se limpian al reiniciar/cambiar de intención/cuenta o perder el ámbito. Abrir una fuente anterior vuelve a autorizar su lectura. El control futuro de olvido debe invalidar también estos mensajes; esta caché de presentación no sustituye una fuente vigente.

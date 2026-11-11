# Entornos

| Entorno | Propósito | Estado |
| --- | --- | --- |
| Local/demo | Emuladores y fixtures ficticios | Se preparará como `demo-kioku-local`; no está configurado aún |
| Development | Integración privada con cuenta/clave de prueba autorizadas | Proyecto y región pendientes |
| Production/personal | Recuerdos reales del propietario | Separado y no habilitado por defecto; proyecto pendiente |

No hace falta copiar cuatro entornos completos de Wonderdrop para V1. Preproduction solo se añade si existe una necesidad real. Aislar cuenta/proyecto, claves, datos, SDK configs, secretos y registro App Check entre los entornos que se creen.

Dirección europea heredada; ubicación concreta de Firestore y Functions se decide antes de crear recursos. No afirmar una localización de OpenAI por elegir una región de Firebase.

El cliente y el backend verifican su configuración; un valor ausente o desconocido falla cerrado. No hay fallback a otro proyecto o Production. Un cambio de nombre/bundle no selecciona entorno ni migra datos.

No usar recuerdos reales en Local/Development. No copiar los identificadores ni las excepciones operativas de Wonderdrop.

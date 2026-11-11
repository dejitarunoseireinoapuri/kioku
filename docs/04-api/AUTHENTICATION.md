# Identidad y autorización

Firebase Authentication identifica al usuario. La cuenta autorizada recupera sus recuerdos en Android o iOS; instalar de nuevo o introducir una clave OpenAI no es una identidad de memoria.

Proveedor de acceso y cuenta permitida pendientes de decisión/configuración. V1 es personal: no abrir registro público ni acceso a terceros por omisión. La app debe fallar cerrada si falta el control de acceso previsto.

El servidor valida token, estado de cuenta, entorno y App Check donde corresponda. UID de sesión es la autoridad; ignorar como autorización cualquier ownerId, correo o rol enviado en el payload o propuesto por IA.

Secuencia: conexión → sesión resuelta → cuenta habilitada → configuración IA privada → conversación. Distinguir restauración de sesión nativa de autorización de datos actual. Un error de red no selecciona una identidad anterior diferente ni una cuenta ficticia.

Cierre/cambio de cuenta detiene audio, reproducción, listeners y estado privado; invalida operaciones de presentación sin reproducir mutaciones. La respuesta tardía del backend se vincula a su sesión, no a la cuenta que ahora esté visible.

App Check no sustituye la autenticación ni prueba la autorización de un recuerdo. La prueba con emuladores tampoco demuestra atestación real en un iPhone/Android físico.

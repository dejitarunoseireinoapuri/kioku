# Seguridad técnica

Kioku tratará recuerdos potencialmente íntimos y una credencial que permite consumo de pago. Seguridad y privacidad forman parte de cada caso de uso, aunque V1 sea personal.

## Fronteras obligatorias

- Authentication valida identidad; el backend verifica cuenta permitida y propiedad en cada operación y replay. App Check es un control adicional, no autorización.
- Firestore y objetos temporales: deny-by-default, aislamiento por cuenta y pruebas negativas con otra identidad. Clientes no escriben fuentes, recuerdos, índices, recibos ni secretos canónicos.
- Clave OpenAI en gestor privado de servidor. Nunca loguear, devolver o persistir su valor en Firestore, preferencias, binario, código o archivos versionados.
- No aceptar destinos HTTP/base URLs arbitrarios desde textos, recuerdos o respuestas del modelo. Evitar exfiltración y SSRF; proveedores y operaciones se configuran en servidor.
- Validar entrada y salida estructuradas, tamaños, enums, referencias, versiones y límites. El modelo no concede permisos ni ejecuta operaciones por sí solo.
- Texto recuperado es dato no confiable, no una instrucción. Una orden incrustada en un recuerdo no autoriza borrados, llamadas, cambios de clave o acceso a otra cuenta.
- M0 v2 valida referencias de recuerdo/fuente, distingue citas de datos personales y contrasta la propuesta con fuentes vigentes antes de mostrarla. Los patrones reconocibles de clave API se rechazan en relatos, aclaraciones y preguntas antes de enviarlos como contexto al proveedor. La comprobación semántica es una defensa adicional, no prueba infalible ni sustituto de autorización.
- Admisión y concurrencia acotadas antes del trabajo costoso. Nada de recargas, escaladas de coste o cambio de proveedor silenciosos.
- Separación de entornos, TLS verificado y permisos mínimos por identidad de ejecución. Nunca desactivar verificación TLS para resolver una estación local.

## Diagnóstico

Solo categoría, operación, duración, código seguro y referencia opaca de soporte cuando sean necesarios. Excluir claves/tokens, prompts, preguntas, transcripciones, recuerdos, fuentes, emails, audio, respuestas completas y objetos crudos de errores. Las pruebas usan datos ficticios y dobles de proveedor por defecto.

No integrar Analytics, informes de crash o grabación de sesiones automáticamente. Si se proponen, revisar filtrado y retención reales antes de activarlos.

## Incidentes

Contener acceso, revocar/rotar credenciales afectadas, revisar el uso mediante evidencias mínimas autorizadas, corregir y probar. No exponer material sensible en issues públicas. La política de comunicación y contacto del operador sigue pendiente antes de distribuir.

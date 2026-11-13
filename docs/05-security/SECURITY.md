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

Primera frontera K1: proveedor Google y correo verificado permitido, UID vinculado transaccionalmente, tokens revalidados con comprobación de revocación/deshabilitación y 30 lecturas de configuración por minuto. Reglas Firestore deniegan lectura/escritura directa incluso al propietario. El punto de entrada actual se limita a `demo-kioku-local` y direcciones exactas de emuladores antes de inicializar SDKs: la ausencia de App Check solo es local. No está preparado para producción ni procesa claves; [evidencia y pendientes](../09-planning/K1_VALIDATION.md).

## Incidentes

Contener acceso, revocar/rotar credenciales afectadas, revisar el uso mediante evidencias mínimas autorizadas, corregir y probar. No exponer material sensible en issues públicas. La política de comunicación y contacto del operador sigue pendiente antes de distribuir.


M0 v4 elimina la autorización de citas basada en vocabulario de la pregunta. El proveedor solo selecciona fragmentos candidatos permitidos; sus fuentes se derivan en código. La verificación semántica independiente del primer paso debe coincidir en el alcance de la pregunta. Una respuesta personal no admite evidencia quoted, tampoco mediante una etiqueta not_found con texto factual. Las consultas de contenido citado se materializan desde el literal autorizado. La verificación sigue siendo falible: requiere evaluación contra fuentes y no concede permisos de ejecución.

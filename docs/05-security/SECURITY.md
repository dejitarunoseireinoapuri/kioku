# Seguridad técnica

Kioku tratará recuerdos potencialmente íntimos y una credencial que permite consumo de pago. Seguridad y privacidad forman parte de cada caso de uso, aunque V1 sea personal.

## Fronteras obligatorias

- Authentication valida identidad; el backend verifica cuenta permitida y propiedad en cada operación y replay. App Check es un control adicional, no autorización.
- Firestore y objetos temporales: deny-by-default, aislamiento por cuenta y pruebas negativas con otra identidad. Clientes no escriben fuentes, recuerdos, índices, recibos ni secretos canónicos.
- Clave OpenAI en gestor privado de servidor. Nunca loguear, devolver o persistir su valor en Firestore, preferencias, binario, código o archivos versionados.
- La configuración cliente Firebase iOS revisada puede versionarse: `GoogleService-Info.plist` y `Firebase.xcconfig` contienen identificadores públicos/OAuth y la clave cliente creada por Firebase, con restricciones de API verificadas. No es una credencial administrativa o de OpenAI; [Firebase permite incluir esta configuración en código](https://firebase.google.com/docs/projects/api-keys). Mantener las restricciones, reglas y App Check; una clave cliente conocida no concede propiedad ni acceso a recuerdos. `.env*`, cuentas de servicio, certificados, claves de firma y overrides locales continúan excluidos.
- No aceptar destinos HTTP/base URLs arbitrarios desde textos, recuerdos o respuestas del modelo. Evitar exfiltración y SSRF; proveedores y operaciones se configuran en servidor.
- Validar entrada y salida estructuradas, tamaños, enums, referencias, versiones y límites. El modelo no concede permisos ni ejecuta operaciones por sí solo.
- Texto recuperado es dato no confiable, no una instrucción. Una orden incrustada en un recuerdo no autoriza borrados, llamadas, cambios de clave o acceso a otra cuenta.
- M0 v2 valida referencias de recuerdo/fuente, distingue citas de datos personales y contrasta la propuesta con fuentes vigentes antes de mostrarla. Los patrones reconocibles de clave API se rechazan en relatos, aclaraciones y preguntas antes de enviarlos como contexto al proveedor. La comprobación semántica es una defensa adicional, no prueba infalible ni sustituto de autorización.
- Admisión y concurrencia acotadas antes del trabajo costoso. Nada de recargas, escaladas de coste o cambio de proveedor silenciosos.
- Separación de entornos, TLS verificado y permisos mínimos por identidad de ejecución. Nunca desactivar verificación TLS para resolver una estación local.

## Diagnóstico

Solo categoría, operación, duración, código seguro y referencia opaca de soporte cuando sean necesarios. Excluir claves/tokens, prompts, preguntas, transcripciones, recuerdos, fuentes, emails, audio, respuestas completas y objetos crudos de errores. Las pruebas usan datos ficticios y dobles de proveedor por defecto.

No integrar Analytics, informes de crash o grabación de sesiones automáticamente. Si se proponen, revisar filtrado y retención reales antes de activarlos.

K1: proveedor Google y correo verificado permitido, UID vinculado transaccionalmente, tokens revalidados con comprobación de revocación/deshabilitación y 30 lecturas de configuración por minuto. Reglas Firestore deniegan lectura/escritura directa incluso al propietario. Local exige proyecto/direcciones exactos de emuladores; producción exige proyecto/configuración completos y App Check con IDs exactos. No hay fallback entre ambos. Alta de clave solo administrativa: valida destino fijo y candidato, Secret Manager inmutable y activación por revisión, sin endpoint móvil de escritura. El callable de configuración no accede al valor del secreto ni su identidad administra credenciales. [Evidencia y límites reales](../09-planning/K1_INTEGRATION_VALIDATION.md), incluidos acceso/atestación/iOS pendientes.

## Captura K2

Los nuevos callables reutilizan la admisión/revocación de K1 y reautorizan antes de confirmar; las transacciones comprueban propietario, nonce y concesión vigente. El SDK administrativo no delega escrituras al cliente. Se limitan cuerpo, texto, referencias UUID, revisiones, intentos, concurrencia y presupuesto estimado distribuido. Los replays se reautorizan y no llaman de nuevo a la IA si el resultado ya está confirmado.

La identidad de ejecución K2 tiene lectura del secreto **solo** sobre `kioku-openai-owner`; no puede listar/provisionar/sustituir secretos. El adaptador lee exclusivamente la versión numérica activada de `FirestoreCredentialStore`, nunca una ruta recibida del móvil. No se transporta el secreto al dispositivo ni se usa la credencial administrativa del operador en runtime. Activación e IAM comprobados según [K2_VALIDATION](../09-planning/K2_VALIDATION.md): entrada HTTPS pública solo a nivel de transporte, con Google, cuenta permitida y App Check exigidos por las funciones. Peticiones sin credenciales rechazadas con 401; aceptación positiva del nuevo build pendiente.

Fuente/fragmentos se preparan fuera de la transacción y se confirman juntos. Los recibos terminales no contienen el relato; pendientes y contadores tienen retención acotada. Los logs no incorporan entradas, fuentes, prompts o respuestas del proveedor. La validación local usa exclusivamente fixtures; la prueba de IA real se ejecuta contra Firestore demo aislado y conserva el contador de presupuesto existente. Nada de ello acredita por sí solo Google/App Check/iOS reales.

## Incidentes

Contener acceso, revocar/rotar credenciales afectadas, revisar el uso mediante evidencias mínimas autorizadas, corregir y probar. No exponer material sensible en issues públicas. La política de comunicación y contacto del operador sigue pendiente antes de distribuir.


M0 v4 elimina la autorización de citas basada en vocabulario de la pregunta. El proveedor solo selecciona fragmentos candidatos permitidos; sus fuentes se derivan en código. La verificación semántica independiente del primer paso debe coincidir en el alcance de la pregunta. Una respuesta personal no admite evidencia quoted, tampoco mediante una etiqueta not_found con texto factual. Las consultas de contenido citado se materializan desde el literal autorizado. La verificación sigue siendo falible: requiere evaluación contra fuentes y no concede permisos de ejecución.

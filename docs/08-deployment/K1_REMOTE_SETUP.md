# K1 · Activación remota personal

Único proyecto remoto: `kioku-9454f`, región aprobada `europe-west1` (Bélgica). El 13 de noviembre de 2026 se registraron Android/iOS, se habilitó Google y el propietario activó Blaze. Firestore/Secret Manager en Bélgica; clave validada y referencia activada en revisión 1. Identidad y permisos de ejecución aprobados/configurados. Callable activo y acceso/recuperación/estado de IA confirmados en Android real con Google y Play Integrity válidos; App Attest requiere el ID de equipo Apple. Estado y pendientes en la [evidencia de integración](../09-planning/K1_INTEGRATION_VALIDATION.md). No se crea un segundo proyecto.

## Recursos y configuración

- Registro Android de la compilación debug: `io.github.dejitarunoseireinoapuri.kioku.dev`. El identificador base aprobado para distribución futura sigue siendo `io.github.dejitarunoseireinoapuri.kioku`.
- Registro Apple: `io.github.dejitarunoseireinoapuri.kioku`.
- Google como único proveedor de acceso. El backend permite solamente la cuenta elegida por el propietario; el correo se guarda en configuración privada del servidor, no en el repositorio.
- Firestore Standard en `europe-west1`, reglas deny-by-default: el móvil no lee/escribe recuerdos o configuración directamente.
- Callable `getConfiguration` en `europe-west1`: App Check obligatorio, IDs de apps exactos, sesión Firebase revalidada y cuenta permitida. Máximo una instancia y concurrencia ocho, con admisión de 30 lecturas por minuto del propietario. No son un límite monetario de Firebase.
- Identidad de ejecución `kioku-runtime@kioku-9454f.iam.gserviceaccount.com`, con permisos de datos necesarios y consulta de usuarios Auth; sin permisos para crear/sustituir claves. Revisar IAM concreto al provisionar.
- Secret Manager: secreto `kioku-openai-owner` con réplica administrada por el usuario en `europe-west1`. La clave solo llega a ese gestor. Firestore conserva la referencia numérica validada, propietario, revisión y operación; no el secreto.

La facturación de Firebase/Google Cloud es independiente de la API OpenAI. [Functions requiere Blaze para desplegar](https://firebase.google.com/docs/functions/get-started). El propietario completó personalmente la vinculación. No se prometen coste cero, límites de gasto duros o cobertura por la promoción OpenAI.

## Cliente y atestación

Huella pública de la compilación Android comprobada (se conserva la firma debug existente):

- SHA-1: `130b6d18686c2964b8bf02a32f1ab5c6bb71f15d`.
- SHA-256: `917638390fa59a7b5c216e28577d669991074e6ec73e478d9feb5acd4a145327`.

Configurar Google OAuth para paquete/firma correctos y obtener la configuración Firebase nativa. Android acepta exclusivamente campos públicos con formatos concretos; una clave OpenAI no puede utilizarse como valor. Copiar la plantilla `androidApp/firebase.local.properties.example` al fichero privado sin `.example`. No incluir `.env.local` en recursos o Gradle.

Apple usa `GoogleService-Info.plist` y el esquema inverso del cliente Google, mediante `iosApp/Configuration/Firebase.xcconfig`, ambos versionados tras revisión y petición del propietario. Son configuración cliente pública, con restricciones de API comprobadas; el override opcional `Firebase.local.xcconfig` sigue excluido. El paso de build verifica campos y rechaza claves privadas antes de copiar el plist al producto. SDKs exactos: Firebase Apple 13.1.1 y Google Sign-In 10.1.0; resolución/compilación nativas pendientes de Mac/Xcode 26.4.

Android instala Play Integrity; Apple instala App Attest, sin sustitución silenciosa por un proveedor debug. Android está registrado con TTL de una hora y certificado existente: no exige reconocimiento/licencia de Play, sí integridad del dispositivo. El inicializador manual incluye el número público de proyecto como GCM sender ID, necesario para Play Integrity. [Distribución fuera de Google Play](https://firebase.google.com/docs/app-check/android/play-integrity-provider). Móvil Android real admitido; sin excepciones de atestación. La consola Apple exige ID de equipo, pendiente junto con firma y Mac.

## Configuración del servidor y clave

Crear el fichero privado `backend/.env.kioku-9454f` desde `backend/.env.example`, con entorno production, correo permitido e IDs Firebase Android/iOS. No contiene la clave OpenAI. El punto de entrada rechaza otros proyectos, configuración incompleta, mezcla con emuladores y apps desconocidas. El fichero `firebase.production.json` describe el despliegue; no autoriza ejecutarlo.

Una vez autorizado y provisionado el entorno: registrar Google/apps/App Check, desplegar reglas/callable con IAM mínimo y comprobar acceso con el propietario y rechazo de otra identidad. La primera sesión permitida vincula el UID. No reasignarlo por correo ni borrar esa vinculación al cerrar sesión.

Después de confirmar expresamente el destino del secreto y autenticar al operador con credenciales Google ADC adecuadas, la herramienta compilada puede configurar la clave existente del PC:

```powershell
node tooling/backend.mjs build
node backend/lib/src/setup/promote.js --apply 0
```

El `0` era la revisión esperada para el alta inicial; ya se completó y la actual es 1. No repetir un alta con revisión 0. La herramienta lee la clave desde el `.env.local` de raíz, la valida contra la ruta fija de metadatos de Sol y solo después crea una versión inmutable en el secreto ya provisionado. No imprime la clave, no la pasa en argumentos, no usa Firebase CLI para transportar su payload y rechaza trazas que puedan registrar peticiones. La ejecución personal reutilizó la sesión Google administrativa existente en memoria, sin credencial de servicio ni fichero ADC nuevo. El operador tiene autorización IAM; **no es un endpoint móvil ni un comando que deba ejecutar un texto guardado**.

Una sustitución usa la revisión actual. Una validación rechazada conserva lo anterior; un conflicto no sobrescribe otra revisión. Si una escritura tuvo resultado incierto, se lee una vez el canónico y no se destruye una versión posiblemente activa. Un resultado sin resolver requiere inspección administrativa de metadatos, sin reintentos ciegos. Las versiones anteriores/huérfanas se conservan hasta revisarlas y retirarlas explícitamente; no hay job de limpieza automática todavía.

La comprobación consulta metadatos de modelo, no genera recuerdos ni respuestas; no prueba saldo/créditos o inferencia real. El consumo y la integración IA completa se validarán con K2. En Ajustes, «Comprobar configuración» carga el estado seguro sin perder el borrador; la app nunca recibe la clave.

El propietario acepta por ahora el alta/sustitución desde PC. UC-002/FR-002/ADR-004 reflejan ese recorrido: no se requiere un formulario o endpoint móvil `setAiCredential` para cerrar el alcance personal de K1.

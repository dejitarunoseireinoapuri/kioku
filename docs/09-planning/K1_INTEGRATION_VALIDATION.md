# K1 · Integración nativa y preparación remota · 2026-11-13

K1 continúa en `codex/k1-account-configuration`, sobre `4ff1f0e`. La [primera evidencia](K1_VALIDATION.md) describe exclusivamente el commit histórico `e3d5c26`; esta entrega amplía su alcance. **K1 no está cerrada**: Android confirma acceso real Google/atestación, clave activada y recuperación de sesión; quedan iOS/Mac, alcance de UC-002 y comprobaciones restantes.

## Comportamiento implementado

Entrada con Google según su marca oficial y estética B aprobada; sin configuración nativa válida, la app permanece desconectada. Firebase Auth no autoriza por sí solo: se espera la respuesta del servidor. Ajustes muestra sesión y estado seguro de IA. Comprobar configuración conserva el borrador; cerrar sesión retira conversación, navegación y fuentes anteriores. Generaciones, cancelación y ViewModelStores propios impiden reutilizar resultados privados de otra composición/sesión.

Android integra Credential Manager, Google ID, Auth, Functions y Play Integrity oficiales. iOS prepara los SDK oficiales Auth/Functions/App Check/Google Sign-In mediante Swift; **su compilación y los nombres exportados del puente Kotlin requieren comprobarse en Mac**. No se añade proveedor debug automático ni acceso directo cliente a Firestore. Los recuerdos y micrófono siguen siendo ejemplos K0; K2–K5 implementarán esas funciones.

El servidor devuelve `ready`/`notConfigured` y revisión, con App Check e IDs exactos en producción. La herramienta administrativa valida metadatos del modelo, crea una versión inmutable de Secret Manager y activa su referencia mediante revisión esperada. Una sustitución rechazada conserva lo anterior; un commit incierto no destruye una versión posiblemente vigente. El cliente nunca recibe el secreto. La herramienta compilada sin `--apply` solo muestra ayuda. Alta real personal completada con sesión administrativa existente y SDK oficial, sin crear/copiar credenciales Google adicionales.

El alta personal desde PC **no implementa el formulario móvil UC-002**. Resolver explícitamente esa diferencia antes del cierre. Versiones anteriores/huérfanas requieren revisión y retirada administrativa; no hay limpieza automática desplegada. `ready` no acredita saldo, promoción o inferencia real.

## Evidencia ejecutada

| Área | Resultado y alcance |
| --- | --- |
| Android | `assembleDebug`, `assembleDebugAndroidTest`, `mobileCheck` y compilación de metadatos comunes superados; ktlint, arquitectura, Detekt y Lint sin errores. APK r2 final con número público de proyecto correcto |
| Compartido | 17 host tests: nueve existentes, seis de estado de cuenta y dos de cancelación/bridge nativo |
| Interfaz Android | Nueve pruebas instrumentadas juntas en emulador dedicado API 36: seis anteriores y tres de cuenta/limpieza/refresh. Identidades inyectadas ficticias, no Google real |
| Accesibilidad visual | Login inspeccionado con fuente 100 % y 200 %; restaurada la escala original. TalkBack/VoiceOver completos pendientes |
| Configuración nativa | Android compila y pasa Lint con los archivos privados reales del proyecto. Dos tests de validación de configuración pública iOS superados; `plutil` y build Apple no ejecutados |
| Backend | TypeScript strict y Prettier superados; 14 pruebas unitarias y 13 Auth/Functions/Firestore en emuladores, incluidos propietario, CAS de credenciales, corrupción/denegaciones y 111 rechazos de reglas. Servidor remoto activo y rechazos HTTP reales comprobados |
| Android real | Propietario confirma acceso, IA configurada tras actualizar Ajustes y recuperación al cerrar/reabrir. Servidor confirma HTTP 200 con Auth y App Check válidos; no prueba otra instalación o cierre explícito de sesión |
| Dependencias | Ejecución: cero avisos conocidos. Herramientas: cero altos/críticos y 13 moderados; detalle a continuación |
| iOS | Fuente/Xcode/SPM preparados; sin compilación, firma, resolución SPM o recorrido en Mac/dispositivo |

Comandos reproducibles desde raíz: [guía móvil](../07-development/DEVELOPMENT_GUIDE.md) y [backend](../../backend/README.md). Logs ignorados: `k1-mobile-session-scope.log`, `k1-shared-final.log`, `k1-android-session-scope.log`, `k1-final-packaging.log`, `k1-native-config-build-2.log`, `k1-credential-patched-emulators.log` y `k1-android-final-scoped.log`, bajo `local-data/`. No contienen evidencia pública de recuerdos reales.

Se conserva el fallo inicial de ocho tests de interfaz por reutilización del ViewModel raíz entre composiciones: el caso aislado pasaba. Se corrigió el ámbito de vida en producción y la suite conjunta pasó nueve sin debilitar expectativas. Un primer archivo privado de configuración se generó incorrectamente; se corrigió y la compilación posterior con configuración real pasó. Los intentos anteriores no se presentan como éxitos.

## Dependencias revisadas

Firebase BOM 35.2.0, Credential Manager 1.6.0 y Google ID 1.2.1; Firebase Apple 13.1.1 y Google Sign-In 10.1.0. Google G y Google Sans originales, hashes/procedencia/licencia en `licenses/`. Se inspeccionó la referencia pertinente de Stitch y no se editó.

El SDK web de pruebas fijaba gRPC 1.9.16. Se aplica override **solo dentro de `@firebase/firestore`** a 1.14.7, misma versión mayor y ya usada por SDKs Google de ejecución. Corrige [certificados no autorizados](https://github.com/advisories/GHSA-m9gg-hp2v-232j) y [errores de servidor revelados](https://github.com/advisories/GHSA-f596-whhp-79r4). Se repitieron las 13 pruebas de emuladores y las 14 unitarias; tras normalizar el lockfile y reinstalarlo con `ci`/sin scripts, volvieron a pasar ambas suites y formato (`k1-reproducible-emulators.log`). Auditoría final: cero en ejecución; 13 moderados de herramientas. No se desactiva la auditoría.

Quedan 13 avisos moderados transitivos del CLI oficial fijado: OpenTelemetry Core 1.x, glob/minimatch y uuid. No se fuerzan saltos de API mayores ni degradaciones antiguas sugeridas por npm. Se usan herramientas con entradas locales controladas; no forman parte del runtime móvil/Functions. Revisar con la siguiente actualización oficial y antes de introducir entradas externas en esas herramientas. No describir el árbol completo como libre de vulnerabilidades. M0 permanece congelada y debe actualizarse/revalidarse antes de reutilizar dependencias en K2.

## Recursos remotos y límites

Único proyecto de producción `kioku-9454f`, número `1008044927836`. Se verificó Blaze después de que el propietario vinculase facturación. Android debug `.dev` e iOS base están registrados; Google es el único proveedor habilitado. Configuración nativa descargada con CLI oficial y archivos locales excluidos de Git.

Firestore `(default)` se verificó en `europe-west1`, tipo nativo; se publicaron reglas deny-by-default. Secret Manager `kioku-openai-owner` tiene réplica únicamente en Bélgica y una clave validada/activada mediante referencia privada, revisión 1. Identidad `kioku-runtime` creada con aprobación específica y roles `datastore.user`/`firebaseauth.viewer`; no recibe permisos de administración de usuarios, escritura de secretos o gestión de credenciales. El callable K1 lee metadatos, no el valor de la clave; el acceso de ejecución a su payload debe concretarse al integrar IA en K2.

Play Integrity Android registrado tras autorización expresa de condiciones: certificado existente, TTL una hora, sin exigir instalación/licencia de Play y exigiendo integridad de dispositivo. El móvil del propietario recibió un token admitido por el callable. App Attest Apple y la firma propia siguen pendientes.

Functions `getConfiguration` se verificó `ACTIVE`, Node 22, identidad propia, una instancia máxima, concurrencia ocho y timeout 15 s. Configuración privada presente y sin variable de clave OpenAI. La primera compilación falló por lockfile incompatible con npm 10 (picomatch ausente); se normalizó con npm 10.9.9, se comprobó instalación aislada de ejecución y se añadieron predeploy de compilación/formato y `gcp-build` vacío. Segunda compilación Google: `SUCCESS`; no se oculta el intento fallido. La advertencia posterior del CLI sobre imágenes se resolvió mediante política de 14 días expresamente aprobada y verificada (`1209600s`, no dry-run).

La prueba HTTP encontró inicialmente 403 de infraestructura (HTML, no rechazo JSON de Kioku): faltaba acceso invoker al transporte Cloud Run después de la creación fallida inicial. Con autorización expresa se añadió `roles/run.invoker` para `allUsers` únicamente al servicio `getconfiguration`, preservando el resto de su política IAM. El código lo declara explícitamente para siguientes despliegues. **Ahora ambas pruebas remotas sin sesión/atestación y con atestación inválida devuelven JSON 401 `UNAUTHENTICATED`, sin resultado**. Acredita rechazo real; no un acceso positivo con Google/App Check. El propietario comunicó un error antes de reparar el transporte; se solicita reintento tras la corrección.

El siguiente intento del propietario confirmó Google real: usuario verificado con proveedor Google y petición con `auth: VALID`, pero `app: INVALID`. El inicializador manual Android omitía GCM sender ID/número público del proyecto, que [PlayIntegrityAppCheckProvider necesita al solicitar el token](https://github.com/firebase/firebase-android-sdk/blob/main/appcheck/firebase-appcheck-playintegrity/src/main/java/com/google/firebase/appcheck/playintegrity/internal/PlayIntegrityAppCheckProvider.java). Se añadió ese número. En r2 se verificaron HTTP 200, `auth: VALID`, `app: VALID` y UID canónico vinculado. Configuración remota: versiones no reconocidas permitidas, licencia Play no requerida, `MEETS_DEVICE_INTEGRITY`, TTL 3600 s y API activa. Se conserva el fallo inicial; no se desactivó la atestación.

Tras vincular propietario se reutilizó la sesión administrativa Google existente en memoria para SDKs oficiales, sin generar claves de servicio o ficheros ADC adicionales. Se revalidó el usuario Google permitido, la región del secreto y los metadatos de Sol con la clave local, y se activó revisión 1 mediante el caso de uso probado. El propietario confirma «IA configurada en el servidor» y recuperación de sesión tras cerrar/reabrir. No se hizo inferencia OpenAI ni se comprobó saldo/crédito disponible. La tercera publicación del servidor, con invoker explícito, terminó correctamente y se verificó `ACTIVE`.

APK r2 Android: SHA256 `1ed6e792c6599f33efdffed0b9b7397f6cd3c7b73b6195b746eed142a9417f11`. Entradas descomprimidas y archivos versionables comparados privadamente con la clave local: ausente, sin imprimirla. El propietario instaló la actualización; no se usó ADB sobre su móvil ni se borraron instalaciones/datos.

La comprobación de formato con glob raíz recorrió carpetas grandes de herramientas y se detuvo únicamente su proceso verificado. Se sustituyó por la lista explícita obtenida de los dos árboles de fuentes y scripts Gradle de los proyectos/settings: mismo alcance de código, sin recorrer dependencias/descargas. APK más `mobileCheck` final pasó en cuatro segundos; el intento detenido no se cuenta como validación superada.

La revisión automática rechazó inicialmente un script que mezclaba activación de APIs y permisos IAM. Se separó la activación y se obtuvo autorización específica para identidad, proyecto y ambos roles antes de concederlos. No se eludió la revisión. No se enviaron correos.

## Pendientes de cierre

Recuperación en segunda instalación, revocación/cierre explícito reales y otra identidad remota; reemplazo real de clave (cubierto con dobles/emuladores, sin rotación innecesaria de producción); decidir alcance personal de UC-002; compilación/atestación/recorrido iOS en Mac. Mantener seguimiento de dependencias y texto genérico de error de acceso. No confundir estas pruebas Android con las pendientes.

Documentos consultados: AGENTS, convenciones/calidad, arquitectura/estado, ADR-004/007/008, contrato/datos/almacenamiento, seguridad, guía, plan/limitaciones, matriz y referencia Stitch. [Plan operativo](../08-deployment/K1_REMOTE_SETUP.md).

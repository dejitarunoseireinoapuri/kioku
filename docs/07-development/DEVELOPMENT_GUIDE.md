# Guía de desarrollo

## Situación inicial

La base documental, el [prototipo M0](../../prototypes/memory/README.md) y la base móvil K0 están preparados. `shared` contiene Compose/KMP; `androidApp` e `iosApp` son hosts delgados. M0 sigue separado y no es un backend Functions desplegado. La app K0 utiliza únicamente fixtures y no llama a OpenAI/Firebase. Estado y pruebas en [evidencia K0](../09-planning/K0_VALIDATION.md).

Trabajar desde la raíz seleccionada como workspace; nunca fijar una ruta personal absoluta. Windows sirve para el trabajo Android/backend; las validaciones iOS de compilación, firma y dispositivo requieren una máquina macOS/Xcode adecuada.

## Validación disponible ahora

Desde la raíz, con PowerShell:

```powershell
pwsh -NoProfile -File tooling/check-docs.ps1
```

Comprueba enlaces locales, mapa de fuentes, índice ADR y marcadores de secreto/rutas personales en la documentación gobernada. No demuestra corrección semántica, seguridad real o compilación de una app.

## Base móvil K0

Versiones fijadas en `gradle/libs.versions.toml`, wrapper y lockfiles; justificación en [ADR-006](../02-architecture/ADR/ADR-006-k0-toolchain.md). Instalar JDK 21 y Android SDK 37/Build Tools 36.0.0; configurar `JAVA_HOME` y `ANDROID_HOME` o `local.properties` privado. Node 24 ejecuta la comprobación de arquitectura. `tooling/mobile.ps1` acepta esos valores; si faltan, puede localizar un JDK 21 local bajo `.setup/k0-jdk`, o el JBR/SDK estándar de Android Studio. Las tareas de formato fijan su JavaLauncher a JDK 21 mediante toolchains, también si Android Studio elige JDK 25 para el daemon. No se reescribe automáticamente la configuración local del IDE.

Desde Windows, sin cambiar rutas personales en el código:

```powershell
pwsh -NoProfile -File tooling/mobile.ps1 :androidApp:assembleDebug
pwsh -NoProfile -File tooling/mobile.ps1 mobileCheck
pwsh -NoProfile -File tooling/mobile.ps1 :androidApp:assembleDebugAndroidTest
```

`mobileCheck` ejecuta `formatCheck` (ktlint), `checkArchitecture`, `detekt`, `:shared:testAndroidHostTest` y `:androidApp:lintDebug`. `formatKotlin` aplica formato; no desactiva comprobaciones. Ambas tareas de formato reciben archivos explícitos de `shared/src`, `androidApp/src`, scripts de proyectos y settings; no globs raíz que recorran descargas/dependencias. La compilación de APK de tests no ejecuta instrumentación. Ejecutarla sobre un emulador elegido mediante AndroidJUnitRunner o `:androidApp:connectedDebugAndroidTest`; este último puede alcanzar todos los dispositivos conectados y debe acotarse antes si hay instalaciones personales. El APK de desarrollo usa sufijo `.dev`, mantiene firma debug local y no se publica en tiendas.

La primera resolución autorizada usa `--write-locks`; las verificaciones normales no deben reescribir los lockfiles para ocultar cambios. No ejecutar `clean`, borrar cachés, reinstalar o restablecer dispositivos como solución rutinaria. Si Gradle pide versiones nuevas, revisar compatibilidad antes de modificar el catálogo. Detekt es 2.0.0-alpha.6: estado preliminar explícito, política numérica conservada y sin baseline.

En Mac Apple Silicon, con JDK 21 y Xcode compatible configurados, quedan por ejecutar:

```sh
./gradlew :shared:iosSimulatorArm64Test
xcodebuild -project iosApp/iosApp.xcodeproj -scheme Kioku -configuration Debug \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

El esquema invoca `:shared:embedAndSignAppleFrameworkForXcode`; no son comandos ya superados en Windows. Revisar después tema, teclado/insets, navegación y VoiceOver en iOS. Para instalar en dispositivo se debe configurar identidad/firma propia; no copiar las de Wonderdrop. El catálogo incluye targets arm64, no un simulador Intel. `gradlew` debe conservar su bit ejecutable y LF.

Los ejemplos se recorren desde Ajustes → Recorridos de ejemplo. Los ocho estados no son ocho destinos. La vista previa no guarda texto, no graba, no interpreta, no detecta realmente la red ni modifica fuentes. Los controles explican sus límites y el banner identifica los datos ficticios.

## Prototipo M0

Para M0 se ha fijado Node 24 (mínimo 24.12), ejecución TypeScript nativa y comprobación con TypeScript 5.9.3. Comandos: `node tooling/m0.mjs install`, `check`, `test` y `format:check`. La [guía M0](../../prototypes/memory/README.md) detalla las evaluaciones reales con `--live`, credenciales privadas y límite de consumo; las pruebas locales no llaman a OpenAI. El runtime de Functions se decidirá al preparar ese despliegue, sin deducir compatibilidad del prototipo.

Node/TypeScript mantienen sus lockfiles independientes: M0 en raíz, K1 en `backend/`. Las verificaciones Auth/Functions/Firestore locales se describen en la [guía backend](../../backend/README.md). La [evidencia de integración K1](../09-planning/K1_INTEGRATION_VALIDATION.md) distingue recursos remotos y tests locales; estos no prueban Google móvil, App Check remoto o iOS.

## Configuración nativa K1

Android carga exclusivamente la configuración pública local indicada en `androidApp/firebase.local.properties.example`; nunca una clave OpenAI. Apple necesita el plist privado, `Firebase.local.xcconfig` y Mac. El build Apple verifica sus campos antes de copiarlo al producto mediante `tooling/prepare-ios-firebase.mjs`; probar su validador con `node --test tooling/native-firebase-public.test.mjs`. Firebase Apple/Google Sign-In se resuelven con SPM en Mac; no dar por resueltos sus paquetes desde Windows.

Sin configuración válida se muestra acceso no disponible. La entrada actual exige autorización remota antes de abrir los ejemplos de conversación. No hay bypass de acceso real por una identidad de fixture. Registros, atestación y alta administrativa del secreto: [configuración remota](../08-deployment/K1_REMOTE_SETUP.md). No ejecutar despliegues o alta de secretos por seguir esta guía: requieren autorización explícita, conservada cuando ya se concedió para la misma acción/destino.

### Primera prueba iPhone desde Mac

El propietario confirma acceso a Mac con Xcode. Usar la rama `codex/k1-account-configuration`, con JDK 21, Node 24 y la combinación Xcode documentada en ADR-006 (26.4, todavía por comprobar). Desde su checkout, conservando cualquier trabajo local:

```sh
git fetch origin
git switch codex/k1-account-configuration
git pull --ff-only
```

Los archivos locales Firebase no viajan por Git. Copiar `GoogleService-Info.plist` a `iosApp/iosApp/GoogleService-Info.plist` y `Firebase.local.xcconfig` a `iosApp/Configuration/Firebase.local.xcconfig`. Se preparó una copia local de esos dos archivos en `local-data/Kioku-iOS-config.zip`, excluida del repositorio. No necesita transferir la clave OpenAI: sigue en Secret Manager.

Abrir `iosApp/iosApp.xcodeproj`, esquema Kioku. Configurar el equipo propio en Signing & Capabilities, manteniendo bundle `io.github.dejitarunoseireinoapuri.kioku`. Resolver paquetes y compilar; la integración Gradle genera el framework compartido. Ejecutar también los tests de simulador indicados arriba. La compilación y los nombres exportados Swift/Kotlin siguen pendientes de comprobar; corregir errores reales antes de declarar compatible.

Para entrar en un iPhone físico, registrar App Attest con el ID de equipo Apple propio en la app Firebase existente y verificar firma/entitlement de producción. Esa configuración está pendiente: disponer de Mac o compilar el simulador no la resuelve. No sustituir automáticamente App Attest por debug ni desactivar el control del servidor. Después comprobar Google, estado de IA, recuperación/cierre de sesión y navegación. Registrar resultados y errores seguros sin copiar tokens, configuración privada o datos personales.

## Trabajo por caso de uso

Trazar FR/BR → UC → contrato/datos → comportamiento → prueba. Para operaciones protegidas, diseñar y probar backend/reglas antes de confiar en un cliente. Usar proveedores fake para pruebas aisladas. La credencial y su tratamiento se deciden antes de tocar código que llame a OpenAI; no se necesita una clave para preparar esta documentación.

Registrar evidencia acotada, sin contenido privado. No desinstalar ni borrar datos de dispositivos personales por rutina. Mantener sesión y firma de instalaciones de prueba compatibles.

# Guía de desarrollo

R2 vigente: la autorización de esta continuación pasa de **15 a 20 USD adicionales totales**, sin reiniciar el baseline ni los avisos de cada 10. El archivo local `authorized-budget.json` fija baseline y techo; cada llamada contabiliza gasto y reservas antes de salir. Las tres rondas j congeladas terminaron: 60/60, 59/60, 60/60; no repetir como reserva nueva. El ajuste posterior se comprueba con `node --env-file-if-exists=.env.local prototypes/memory-core/evaluation/run.ts --live --regression-v9 --run <id>`; `--cases` permite selección expuesta, nunca recuerdos externos. Una regresión tiene máximo 5 USD y siempre respeta el techo global restante. Perfil `gpt-6.1-sol/high`. Informe sin API: `node tooling/r2-bounded-report.mjs`. [Protocolo, resultados y pendientes](../09-planning/R2_BOUNDED_VALIDATION.md). Los perfiles, topes y rondas anteriores que siguen son históricos; no amplían la autorización vigente.

Nueva autorización R2 del 16 de noviembre: perfil del prototipo `gpt-6.1-sol/high`, reserva nueva `high-v8`, tres rondas con `node --env-file-if-exists=.env.local prototypes/memory-core/evaluation/high-run.ts --live --round 1` y después `2/3`. Los ejecutores reservados históricos rechazan el perfil alto; no convertir su corpus en independiente. Informe: `node tooling/r2-high-report.mjs`. Tope acumulado **120 USD**, máximo **10 por ronda nueva** y **5 por regresión**, sin reiniciar contadores. [Protocolo y resultados](../09-planning/R2_HIGH_VALIDATION.md). Los perfiles y topes siguientes son históricos.

Las tres rondas i ya están consumidas (55/60, 55/60, 56/60); no repetirlas como independientes. Las adaptaciones expuestas se ejecutan con `node tooling/m0.mjs core:eval --live --regression-v8 --run <id>`, opcionalmente `--cases i08,i12,...`. Los informes exigen un nombre nuevo y no sustituyen resultados previos. Tras los arreglos y la precisión final pasan 231 pruebas raíz / 129 del núcleo. La regresión actual incluye dos controles adicionales i61/i62 (62 casos); la pasada completa histórica de este ajuste cubrió los 60 anteriores. Mantener el aviso solicitado cada 10 USD adicionales desde el contador registrado, separado del histórico acumulado.

Última continuación R2: `core:eval --live --regression-v7 --run <id>` comprueba h expuesto con adaptaciones explícitas; `--scope-original` mantiene la expectativa original como regresión. No lanzar otra reserva ni sobrescribir las tres rondas h históricas. Informe final sin API: `node tooling/r2-assignment-report.mjs`. 122 pruebas del núcleo y 224 raíz correctas. [Protocolo final y límites](../09-planning/R2_ASSIGNMENT_VALIDATION.md). R2 abierta; tope 80 USD y máximo 5 por regresión sin reiniciar el ledger.

R2, continuación de alcance: `core:eval --live --regression-v6 --run <id>` ejecuta g expuesto con las adaptaciones documentadas del comprobador. Reserva h histórica (58/60, 57/60, 57/60; R2 abierta): `node --env-file-if-exists=.env.local prototypes/memory-core/evaluation/scope-run.ts --live --round 1`, luego `2/3`, misma versión/perfil y sin subconjuntos. Informe sin API: `node tooling/r2-final-report.mjs --scope`. Tope R2 actual **80 USD**, máximo 5 por ronda/regresión, sin reiniciar contadores. [Protocolo y límites](../09-planning/R2_SCOPE_VALIDATION.md). Los topes y resultados anteriores de esta guía son históricos.

R2 histórica: `node tooling/m0.mjs core:eval --live --regression-v5 --run <id>` comprueba los casos expuestos f; `--cases` permite diagnóstico acotado. `node --env-file-if-exists=.env.local prototypes/memory-core/evaluation/grouping-run.ts --live --round 1`, luego `2/3`, documenta la reserva g ya ejecutada en `93347c6`; no repetir como independiente ni sobrescribir informes. `node tooling/r2-final-report.mjs --grouping` consolida sin API. Tope acumulado de aquella ejecución 65 USD y 5 por ronda/regresión; [resultados y continuación autorizada](../09-planning/R2_GROUPING_VALIDATION.md).

Reserva histórica R2 ejecutada en `6eb2eca`: `node tooling/m0.mjs core:final --live --round 1`, después `2` y `3`. No admite selección, sobrescritura ni cuarta ronda; exige anterior completa e idéntica huella/perfil. `node tooling/r2-final-report.mjs` conserva su consolidación separada. [Resultados históricos](../09-planning/R2_FINAL_VALIDATION.md).

Fiabilidad R2: `core:eval --live --reliability --run <id>` selecciona doce ciclos ficticios dirigidos de captura/edición/olvido y consulta positiva/negativa; son regresión después de su primera ejecución, no una reserva completa. `node tooling/r2-reliability-report.mjs` exporta únicamente métricas/códigos de los intentos concretos documentados, sin llamar a la API. [Resultados y alcance](../09-planning/R2_RELIABILITY_VALIDATION.md).

R2 actual: `core:eval --live --adjustment --run <id>` ejecuta aclaraciones ficticias; `--regression-v2` mantiene los casos expuestos. La tercera reserva ya se ejecutó en `e3d03c2` y queda como `--regression-v3`. `--reserve` se bloquea hasta renovar el corpus; no repetir las historias conocidas como validación independiente. `node --env-file-if-exists=.env.local prototypes/memory-core/evaluation/scale-run.ts --live --run <id>` mide recuperación ficticia a escala. Requiere autorización de API vigente; no admite textos externos. [Topes, protocolo y resultados](../09-planning/R2_INDEXED_VALIDATION.md).

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

Los ejemplos se recorren desde Ajustes → Recorridos de ejemplo. Los ocho estados no son ocho destinos. La conversación de esta fase no guarda texto, no graba, no interpreta, no detecta realmente la red ni modifica fuentes. El propietario pidió retirar el banner global y el subtítulo de vista previa del nombre instalado; las acciones todavía no conectadas mantienen mensajes contextuales veraces y los recorridos siguen identificados como ejemplos. No deducir memoria real del nuevo aspecto.

## Prototipo M0

El nuevo [prototipo R1](../../prototypes/memory-core/README.md) vive en `prototypes/memory-core`, separado del motor M0 que sigue usando producción. `node tooling/m0.mjs core:check`, `core:test`, `core:format:check` y `core:demo` ejecutan sus comprobaciones/ejemplo sin cargar `.env` ni acceder a proveedores. Las tareas raíz `check`, `test` y `format:check` incluyen ambos prototipos; los scripts de evaluación M0 y compilación backend mantienen sus entradas anteriores. No usar R1 para procesar datos personales: requiere antes R2 y las fronteras R3. [Evidencia y límites](../09-planning/R1_VALIDATION.md).

R2 añade `core:eval`, separado de los tests locales. Con la clave existente autorizada, ejecutar `node tooling/m0.mjs core:eval --live --run <id>` para ajuste; los selectores de corpus vigentes se detallan a continuación. Rechaza IDs repetidos y no acepta textos/rutas de recuerdos externos. Esta tarea sí carga `.env.local` y tiene coste: límite R2 30 USD, 2 USD por ajuste y 5 USD por regresión/reserva, conservando contadores anteriores. Informes y contador en `local-data/r2/`, excluidos de Git. No ejecutar una reserva para depurar o ajustarla después: si sus casos influyen en cambios, deben pasar a regresión y preparar otra independiente. [Protocolo inicial y resultados históricos](../09-planning/R2_VALIDATION.md).

La continuación R2 utiliza `--regression` para los 60 casos históricos y `--regression-v2` para las 60 historias nuevas ya expuestas (tope 5 USD). `--reserve` ahora falla con `RESERVE_REFRESH_REQUIRED`: las tres rondas de `fresh-v2` se ejecutaron en `6d4813e`, antes del ajuste posterior que las convierte en regresión. `--cases r45,r46` permite un diagnóstico acotado con IDs existentes, nunca entradas personales; no representa una ronda completa. Cada informe distingue corpus, huella y selección. `node tooling/r2-evidence-audit.mjs` comprueba conservación literal sin API; su variante `--live` usa solamente fixtures y escribe un informe v3 nuevo, sin sobrescribir los históricos. `node tooling/r2-identity-audit.mjs --live`, con la credencial autorizada cargada como en `core:eval`, comprueba doce pares ficticios nuevos y tiene tope adicional de 2 USD. `node tooling/r2-continuation-report.mjs` exporta las tres rondas `retention-frozen-1/2/3` y exige la misma huella/perfil. [Evidencia actual](../09-planning/R2_RETENTION_VALIDATION.md).

Para M0 se ha fijado Node 24 (mínimo 24.12), ejecución TypeScript nativa y comprobación con TypeScript 5.9.3. Comandos: `node tooling/m0.mjs install`, `check`, `test` y `format:check`. La [guía M0](../../prototypes/memory/README.md) detalla las evaluaciones reales con `--live`, credenciales privadas y límite de consumo; las pruebas locales no llaman a OpenAI. El runtime de Functions se decidirá al preparar ese despliegue, sin deducir compatibilidad del prototipo.

Node/TypeScript mantienen sus lockfiles independientes: M0 en raíz, K1 en `backend/`. Las verificaciones Auth/Functions/Firestore locales se describen en la [guía backend](../../backend/README.md). La [evidencia de integración K1](../09-planning/K1_INTEGRATION_VALIDATION.md) distingue recursos remotos y tests locales; estos no prueban Google móvil, App Check remoto o iOS.

## Configuración nativa K1

Android carga exclusivamente la configuración pública local indicada en `androidApp/firebase.local.properties.example`; nunca una clave OpenAI. Apple incorpora por Git el plist cliente revisado y `Firebase.xcconfig`; permite un override opcional `Firebase.local.xcconfig` excluido. El build Apple verifica los campos antes de copiar el plist al producto mediante `tooling/prepare-ios-firebase.mjs`; probar su validador con `node --test tooling/native-firebase-public.test.mjs`. Firebase Apple/Google Sign-In se resuelven con SPM en Mac; no dar por resueltos sus paquetes desde Windows.

Sin configuración válida se muestra acceso no disponible. La entrada actual exige autorización remota antes de abrir los ejemplos de conversación. No hay bypass de acceso real por una identidad de fixture. Registros, atestación y alta administrativa del secreto: [configuración remota](../08-deployment/K1_REMOTE_SETUP.md). No ejecutar despliegues o alta de secretos por seguir esta guía: requieren autorización explícita, conservada cuando ya se concedió para la misma acción/destino.

### Primera prueba iPhone desde Mac

El propietario confirma acceso a Mac con Xcode. Usar la rama `codex/k1-account-configuration`, con JDK 21, Node 24 y la combinación Xcode documentada en ADR-006 (26.4, todavía por comprobar). Desde su checkout, conservando cualquier trabajo local:

```sh
git fetch origin
git switch codex/k1-account-configuration
git pull --ff-only
```

La configuración cliente iOS ya viaja por Git: `iosApp/iosApp/GoogleService-Info.plist` y `iosApp/Configuration/Firebase.xcconfig`. El propietario solicitó versionarla para llevarla al Mac; se revisaron campos, proyecto/app/esquema OAuth y restricciones reales de la clave cliente Firebase. Es configuración pública identificativa, según la política de seguridad. Actualizar la rama basta; el ZIP local histórico ya no es necesario. No transferir la clave OpenAI: sigue en Secret Manager. Los overrides locales y las identidades de firma permanecen excluidos del repositorio.

Abrir `iosApp/iosApp.xcodeproj`, esquema Kioku. Configurar el equipo propio en Signing & Capabilities, manteniendo bundle `io.github.dejitarunoseireinoapuri.kioku`. Resolver paquetes y compilar; la integración Gradle genera el framework compartido. Ejecutar también los tests de simulador indicados arriba. La compilación y los nombres exportados Swift/Kotlin siguen pendientes de comprobar; corregir errores reales antes de declarar compatible.

Para entrar en un iPhone físico, registrar App Attest con el ID de equipo Apple propio en la app Firebase existente y verificar firma/entitlement de producción. Esa configuración está pendiente: disponer de Mac o compilar el simulador no la resuelve. No sustituir automáticamente App Attest por debug ni desactivar el control del servidor. Después comprobar Google, estado de IA, recuperación/cierre de sesión y navegación. Registrar resultados y errores seguros sin copiar tokens, configuración privada o datos personales.

## Trabajo por caso de uso

Trazar FR/BR → UC → contrato/datos → comportamiento → prueba. Para operaciones protegidas, diseñar y probar backend/reglas antes de confiar en un cliente. Usar proveedores fake para pruebas aisladas. La credencial y su tratamiento se deciden antes de tocar código que llame a OpenAI; no se necesita una clave para preparar esta documentación.

Registrar evidencia acotada, sin contenido privado. No desinstalar ni borrar datos de dispositivos personales por rutina. Mantener sesión y firma de instalaciones de prueba compatibles.

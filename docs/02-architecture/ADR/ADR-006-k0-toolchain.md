# ADR-006 · Base K0 y herramientas verificadas

- Estado: implementada y comprobada en Android; validación iOS pendiente.
- Fecha: 2026-11-13.
- Rama: `codex/k0-mobile-foundation`, desde `13b74a2`.

## Decisión

Un módulo `shared` con KMP, Compose y paquetes por responsabilidad, un host `androidApp` y un host Xcode `iosApp`. El plugin oficial `com.android.kotlin.multiplatform.library` publica la librería compartida; la aplicación Android usa `com.android.application`. No se usa el antiguo `androidTarget`, ni se recupera Expo. Los hosts justifican módulos separados; Domain/Data/Presentation no se fragmentan en más módulos Gradle.

Catálogo exacto: Kotlin/Compose Compiler 2.4.20, Compose Multiplatform 1.12.0, AGP 9.3.1, Gradle 9.5.0, Koin 4.2.0, Navigation 3 multiplataforma 1.1.1, Lifecycle 2.11.0, coroutines/serialización 1.11.0, Activity 1.12.4. SDK de compilación/target Android 37; mínimo 29. iOS mínimo 16, dispositivos y simulador Apple Silicon. JDK 21 para ejecutar herramientas; bytecode JVM 17. Versiones y transitivas resueltas se conservan en catálogo y lockfiles; wrapper/distribución Gradle verificados con SHA-256 oficial.

Navigation 3 usa claves serializables y registro polimórfico explícito, sin depender de reflexión Android para el futuro host iOS. Koin 4.2 usa `koinConfiguration` en la composición y ViewModels con StateFlow. Material estable aporta controles básicos con el tema B; no se incorpora Material3 alpha por conveniencia. IBM Plex se empaqueta desde un commit fijo de IBM, con licencia OFL y hashes.

## Alcance y alternativas

K0 es una vista previa explícita con datos ficticios. Los ocho estados de Stitch son ejemplos de conversación, no ocho rutas: conversación, ajustes y fuente son los destinos. Ajustes incluye temporalmente el selector de ejemplos para revisar el recorrido. Cuenta/configuración se señalan como no conectadas; el diseño definitivo de esas funciones pertenece a K1.

`DemoSourceRepository` es un catálogo local inmutable de fixtures. Su lectura síncrona no es un contrato de backend remoto ni almacenamiento de recuerdos personales. `ReadReferencedSource` limita la apertura al contexto citado; no implementa autorización de cuenta. La UI no importa el adaptador y el dominio no importa SDK, Compose o Koin. No se conectan Firebase/OpenAI, ni micrófono, reproducción, persistencia, borrado o cola offline. Controles de ejemplo nunca anuncian una mutación real.

Detekt 2.0.0-alpha.6 se usa porque su línea 2 soporta las herramientas actuales; su estado preliminar es explícito. Se conserva la política numérica existente, sin baseline ni desactivar reglas. ktlint CLI 1.8.0, Android Lint, pruebas y comprobación de importaciones se conectan a `mobileCheck`. La única opción de silenciamiento específica es `kotlin.native.ignoreDisabledTargets`: Windows no ejecuta Apple, y esas comprobaciones permanecen pendientes; no desactiva los targets disponibles en Mac.

## Validación y límites

Compilación Android y comprobaciones en [evidencia K0](../../09-planning/K0_VALIDATION.md). iOS tiene framework, host SwiftUI, configuración y esquema Xcode, pero no se ha compilado, firmado o probado desde Windows. El script de integración directa de Gradle necesita desactivar el aislamiento del script de build en ese proyecto Xcode; no cambia ajustes de seguridad del equipo. Xcode 26.4 es la combinación documentada para Kotlin 2.4.20 y queda por comprobar en un Mac.

Fuentes primarias: [compatibilidad KMP](https://kotlinlang.org/docs/multiplatform/multiplatform-compatibility-guide.html), [plugin Android KMP](https://developer.android.com/kotlin/multiplatform/plugin), [AGP 9.3](https://developer.android.com/build/releases/agp-9-3-0-release-notes), [Navigation 3](https://kotlinlang.org/docs/multiplatform/compose-navigation-3.html), [Koin Compose](https://insert-koin.io/docs/reference/koin-compose/compose/) y [compatibilidad Detekt](https://detekt.dev/docs/introduction/compatibility/). La prueba de compatibilidad efectiva de esta selección es la compilación registrada; la documentación no sustituye iOS.

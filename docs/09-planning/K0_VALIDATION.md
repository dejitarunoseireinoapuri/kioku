# K0 · Evidencia de la base móvil

Fecha: 2026-11-13. Rama `codex/k0-mobile-foundation`, base `13b74a2`. Implementación y evidencia se versionan juntas; el commit final se obtiene del historial de esa rama.

## Entrega

- `shared`: tema B, recursos españoles/IBM Plex, ViewModel con StateFlow, fuente original/corrección separadas, catálogo ficticio inmutable y Navigation 3 con serialización explícita.
- `androidApp`: host delgado, mínimo API 29, compile/target 37 y paquete aprobado `io.github.dejitarunoseireinoapuri.kioku`; instalación de desarrollo `.dev`. No solicita micrófono, red o credenciales. Backups/transferencia excluidos mediante reglas nativas, sin guardar recuerdos personales.
- `iosApp`: host SwiftUI, framework estático KiokuShared, esquema Xcode y mínimo iOS 16; dispositivos/simulador arm64. Preparado, todavía sin compilación nativa.
- Ocho ejemplos inspeccionados en Stitch mediante MCP, en modo lectura: preparado, bloqueo, aclaración, guardado, consulta, oferta, fuente corregida y sin conexión. Nombre Kioku aplicado sobre las maquetas históricas «Memoria».
- Conversación, Ajustes y Texto original son los destinos. El selector de ejemplos de Ajustes pertenece a la vista previa K0. Escribir no envía ni guarda; el aviso lo indica. El contador bloqueado es un ejemplo fijo, sin grabación. Reintentar el ejemplo sin red vuelve a preparado, sin comprobar conectividad real ni encolar nada.

## Comprobaciones ejecutadas

Windows, JDK Eclipse Temurin 21.0.13+9, Gradle 9.5.0, Android SDK/target 37 y herramientas 36.0.0. Emulador aislado Pixel 6, Android 16/API 36 x86_64; ninguna instalación personal se desinstaló o reinició. Se utiliza firma debug existente, fuera de Git. Versiones y fuentes en [ADR-006](../02-architecture/ADR/ADR-006-k0-toolchain.md).

```powershell
pwsh -NoProfile -File tooling/mobile.ps1 formatKotlin
pwsh -NoProfile -File tooling/mobile.ps1 :androidApp:assembleDebug :androidApp:assembleDebugAndroidTest mobileCheck
pwsh -NoProfile -File tooling/check-docs.ps1
git diff --check
```

`mobileCheck` incluye ktlint, importaciones/capas, Detekt, host tests y Android Lint. Dependencias inicialmente fijadas con `--write-locks`; las comprobaciones finales usan esos lockfiles sin reescribirlos. Compilación Kotlin con avisos como errores, Lint con warningsAsErrors y política Detekt sin suppressions de hallazgos.

| Comprobación | Resultado |
| --- | --- |
| Compilación APK Android y APK de tests | Superada |
| commonTest ejecutado en Android host | 9 pruebas, cero fallos |
| Instrumentación Android | 6 pruebas, cero fallos |
| Metadatos comunes KMP | `:shared:compileCommonMainKotlinMetadata` superado; no es compilación iOS |
| Detekt, formato, arquitectura y Android Lint | Sin hallazgos/errores |
| Compilación, firma, UI y accesibilidad iOS | Pendientes de Mac/Xcode |

Los nueve tests de lógica cubren referencias ajenas/inexistentes, original/corrección como ramas distintas, cambio de intención conservando borrador, envío sin falso guardado, ejemplo sin red sin edición/cola, contexto de fuente retirado al cambiar ejemplo, oferta sin abandonar Preguntar y finalizar/cancelar el ejemplo bloqueado. Son comprobaciones del catálogo y presentación K0, no de autorización remota.

La instrumentación recorre ajustes y retorno con borrador, consulta → fuente → consulta, bloqueo sin compositor, fuente corregida, estado sin red y color real del título. Se usaron los APK generados y `AndroidJUnitRunner`, dirigidos exclusivamente al emulador de Kioku. Los logs privados se conservan en `local-data/k0`; no se incluyen datos personales en la evidencia.

Comando de instrumentación de esta ejecución, tras instalar ambos APK en el emulador aislado: `adb -s emulator-5580 shell am instrument -w -r io.github.dejitarunoseireinoapuri.kioku.dev.test/androidx.test.runner.AndroidJUnitRunner`. Resultado `OK (6 tests)`. El proceso del emulador se cerró al terminar para liberar recursos; sus datos no se borraron. APK debug inicial (`400b4e2`): SHA-256 `77e52b4e5038322b3311794d262f356bacdd69640d3a3cefbe589182405c8c29`, 30.794.178 bytes. Es una huella de aquel artefacto local, no una garantía de build idéntico con otra firma.

La inspección de captura real detectó texto negro heredado fuera de Surface; se corrigió la propagación de foreground/opacidad y se añadió la prueba de texto renderizado. Se mantienen los intentos fallidos en los logs; no se cambió la expectativa para obtener verde. Las capturas posteriores permiten revisar la corrección y los insets. No se presenta la mera existencia de tests como prueba de que se ejecutaron.

Inspección visual adicional: texto normal y al 150 %, compositor enfocado con teclado abierto. Campo y acciones permanecen por encima del teclado; el contenido de conversación dispone de desplazamiento cuando el área se reduce. El tamaño de letra original del emulador se restauró después. Esto no sustituye TalkBack, VoiceOver o la comprobación iOS.

## Pendiente y decisión

Refinamiento visual solicitado el 13 de noviembre tras la entrega inicial: eliminado el espaciador superior de 72 dp y abreviado el botón a «Contar». Las etiquetas Contar/Preguntar se miden con la tipografía y escala actuales; los botones se apilan si no caben en paralelo, sin reducir la letra ni dividir las etiquetas. Inspección en el mismo emulador con tamaño normal, 150 % y ancho aproximado de 320 dp al 200 %: etiquetas completas en una línea, con disposición vertical en el último caso. Tamaño/escala restaurados y emulador cerrado. Los seis tests instrumentados se repitieron y pasaron; compilación, formato, Detekt, arquitectura y Android Lint correctos. No se repitieron los nueve tests de lógica porque no cambiaron el dominio ni el ViewModel.

APK debug tras este refinamiento: SHA-256 `952b938957eca5b763d3395920a346900426401438c5c253c10a3054d966f490`. Las capturas locales `layout-normal.png`, `layout-large.png` y `layout-compact.png` conservan las tres revisiones visuales.

Preferencia posterior del propietario: el botón pasa de «Contar» a **Explicar**. Solo cambia el recurso de la etiqueta y la documentación; no cambian el significado del modo, la navegación o las reglas de memoria. APK recompilado, Android Lint y comprobador documental correctos; revisión en emulador confirma «Explicar» en una línea. No se repitieron pruebas de lógica/navegación sin cambios. Captura local `explain-label.png`; SHA-256 del APK `be88c3589f10ef292eac1a367dfc8dc99f598158d731d955a0e83b6b15fa296c`.

Se fijó el JavaLauncher de las tareas de formato a JDK 21 mediante el plugin integrado de toolchains: una configuración local de Android Studio eligió JDK 25 para el daemon y hacía emitir avisos del runtime de ktlint. La configuración local no se modificó ni se incluyó en el commit. No se silenciaron avisos ni reglas; los controles finales terminaron sin esos avisos. Las maquetas Stitch se inspeccionaron, sin editarlas; la petición posterior del propietario gobierna este ajuste de la app.

K0 implementada con Android validado en el entorno descrito; validación iOS pendiente. No declarar la fase validada en ambos sistemas. Falta compilar/ejecutar en Mac Apple Silicon con Xcode, revisar tema/insets/navegación y ejecutar las pruebas nativas; la firma de dispositivo requiere identidad propia, no incluida.

No hay Firebase, cuenta, clave móvil, llamadas API, interpretación real, persistencia de recuerdos ni captura/reproducción de voz. No se modifica M0 ni sus almacenes. Esta fase no consume créditos de la API. El objetivo de latencia de M0 permanece pendiente para la integración K2/K3. TalkBack/VoiceOver completos, Android API 29/37 y comportamiento de dispositivo físico siguen sin validación propia; el emulador API 36 no los demuestra.

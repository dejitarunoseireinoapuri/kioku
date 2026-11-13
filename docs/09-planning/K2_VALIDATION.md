# K2 · Captura por escrito

Implementada en `codex/k2-text-memory`, desde `2f18f23`; integrada en `main` hasta `6d0ba89` por petición expresa del propietario. **Estado: implementada y desplegada; recorrido principal aceptado por el propietario en Android, validación del nuevo build iOS pendiente.** La integración no es cierre multiplataforma de K2 ni de K1/iOS.

## Alcance de esta entrega

Contar por escrito, aclarar dudas en el mismo recorrido y confirmar guardado solo tras el commit. Fuente original y fragmentos normalizados en Firestore por UID, reintentos idempotentes, recuperación explícita de estado incierto y acceso a la fuente confirmada. Preguntar no invoca captura ni guarda preguntas: K3 sigue pendiente. Voz, ofertas, corrección y olvido conversacionales siguen fuera de esta entrega.

Se consultaron arquitectura, datos/API, seguridad/privacidad/retención, plan/limitaciones, flujos/casos, convenciones y calidad. Se inspeccionaron mediante Stitch MCP las vistas 03 · Aclaración, 04 · Guardado y 07 · Fuente, conservando tipografía, controles y preferencias posteriores del propietario. No se editó Stitch. [ADR-009](../02-architecture/ADR/ADR-009-text-capture.md) registra las decisiones de implementación.

## Evidencia local

| Comprobación | Resultado observado |
| --- | --- |
| Backend `node tooling/backend.mjs build` | TypeScript strict; núcleo M0 compilado desde sus fuentes originales |
| Backend `node tooling/backend.mjs test` | 14 pruebas unitarias existentes correctas |
| `pwsh -NoProfile -File tooling/backend-emulators.ps1` | 24 pruebas correctas, solo `demo-kioku-local`; incluye 11 casos nuevos de captura/HTTP y ampliación de reglas |
| M0 `check` y `test` mediante su npm fijado | 74 pruebas correctas; sin cambios en prompts/modelo/extracción |
| Android APK y APK de tests | Compilados con las herramientas fijadas |
| `pwsh -NoProfile -File tooling/mobile.ps1 mobileCheck` | Formato, arquitectura, Detekt, 26 host tests y Android Lint correctos |
| Pruebas instrumentadas Android | 19/19 correctas en API 36 al 100 % tras la corrección de orientación; incluye tres regresiones nuevas. La ejecución histórica de 16/16 al 200 % precede a esa corrección; cuenta/repositorio ficticios |
| iOS | Puente Functions y entrada Compose preparados, archivo Swift registrado en Xcode; no compilado ni ejecutado en Windows |

Casos nuevos: commit y replay sin duplicados; reutilización conflictiva del ID; aclaración sin memoria anticipada; error del proveedor sin fuente parcial; límites/concurrencia; trabajadores tardíos; revocación antes del commit; caducidad; reservas distribuidas; identidad ajena, modo/UID/clave/zona inyectados; respuesta móvil malformada; cancelación y resultados tardíos; Preguntar sin escritura. Los dobles de IA no prueban calidad semántica del proveedor. Las revisiones no debilitaron aserciones: se corrigió una llamada recursiva en el fake y un import de API de tests, además de límites/advertencias reales del código.

La primera prueba de interfaz detectó dependencia de un repositorio simulado anterior. Se pasó explícitamente la dependencia actual por parámetros Koin al ViewModel, como la cuenta; no se borró el estado del dispositivo ni se relajaron aserciones. El envío cierra el teclado; las pruebas ejercitan IME Send y el botón mediante un único envío, esperan estados concretos sin sleeps y verifican visibilidad, fuente y número de peticiones. Letra del emulador restaurada y emulador cerrado; móviles personales intactos. Se retira la dependencia local innecesaria `kioku:file:..` del backend para que el paquete desplegable no dependa de copiar la raíz del workspace; el núcleo compilado queda dentro de `backend/lib`.

## Proveedor real con persistencia aislada

`pwsh -NoProfile -File tooling/backend-emulators.ps1 -LiveCaptureSmoke` usa la clave existente autorizada y conserva el contador/límite acumulado de M0. [Resultado seguro](k2-live-smoke-2026-11-13.json): dos casos nuevos ficticios con **Sol medium**, seis llamadas, 7869 tokens de entrada y 463 de salida, **0,023814 USD estimados**. Entrada de dos asuntos guardada en 12,698 s; ambigüedad aclarada y guardada en 5,201 s de procesamiento de la respuesta. Fuente/aclaración conservadas y replay sin llamar a la IA. Los datos de Firestore demo se limpiaron al terminar. No se usó el Firebase de producción para almacenar estos relatos.

No son tres rondas de aceptación ni una medición p95; el objetivo de latencia M0/K2 sigue abierto. La evidencia M0 de 74 pruebas/tres rondas no se convierte en prueba de IAM/App Check/iOS por reutilizar el núcleo.

## Activación remota

Despliegue autorizado en `kioku-9454f`, `europe-west1`: `getConfiguration`, `submitTurn`, `resolveClarification`, `getOperation` y `getSource` activos con la identidad de ejecución prevista. Se concedió lectura únicamente del secreto existente `kioku-openai-owner`; no se creó ni rotó ninguna clave. TTL de `operations` y `usage` comprobados en estado `ACTIVE`. Fuentes y recuerdos no tienen TTL. PITR desactivado y cero programaciones de backup.

El primer despliegue falló por una entrada `picomatch` ausente del lockfile. Se regeneró con npm 10 compatible con la compilación remota, se comprobó instalación limpia y se repitieron compilación y 14 pruebas backend. El siguiente despliegue terminó correctamente. La instalación de herramientas mostró avisos de obsolescencia de dependencias transitivas de OpenTelemetry; no se desactivaron comprobaciones.

Tras autorización expresa, las cuatro funciones K2 admiten entrada HTTPS mediante `roles/run.invoker` para `allUsers`, como la configuración K1. Esto permite llegar al endpoint, sin autorizar acceso a los recuerdos: siguen exigiendo Google, cuenta permitida y App Check. Las cuatro peticiones HTTPS sin credenciales se rechazaron con 401. Esta comprobación negativa no sustituye la aceptación positiva desde el móvil.

Se corrigió además el puente de respuesta para aceptar números enteros serializados como `1.0` o `1e0` por SDKs nativos, rechazando fracciones; dos host tests nuevos verifican esa frontera. `mobileCheck` y APK se reconstruyeron después. Las 16 pruebas instrumentadas preceden a estos últimos ajustes de protocolo, copy y estabilidad de la instancia iOS; no se presentan como una ejecución nueva del último APK. El repositorio iOS se crea fuera de la recomposición; sigue pendiente compilarlo en Mac.

| Guardado · fixture Android | Aclaración · fixture Android |
| --- | --- |
| ![Confirmación después del resultado](../assets/branding/kioku-capture-saved-android.png) | ![Aclaración sin memoria confirmada](../assets/branding/kioku-capture-clarification-android.png) |

## Aceptación pendiente

- Compilar el nuevo build y comprobar captura, aclaración, fuente y orientación en Mac/iOS con Google/App Check reales. No sustituir estos resultados por fixtures o acceso K1 de un build anterior.
- Android: el propietario confirmó guardado y aclaración; tras instalar la corrección confirma «al girar se mantiene todo y puedo ver el texto original». Recorrido principal aceptado en su móvil con Google/App Check reales. APK instalado por el propietario, sin instalación automática en móviles personales. Una intervención nueva sustituye la tarjeta anterior; el recorrido actual no es un historial navegable. No se copian recuerdos personales a la evidencia.
- Tras la validación iOS, cerrar el registro de K2. El propietario pidió integrar ya los cambios acumulados en `main`, sin afirmar validación iOS; integración realizada hasta `6d0ba89`. El objetivo de latencia sigue abierto y separado del cierre funcional; recuperación tras muerte del proceso tampoco se declara validada.
- No declarar consulta, corrección, olvido o voz disponibles hasta sus fases. No usar datos insustituibles como primera aceptación.

## Corrección de orientación Android

El propietario detectó pérdida de la pantalla al girar. La causa era crear almacenes de ViewModels con `remember` y limpiarlos desde `onDispose`, que también se ejecuta durante una recreación por configuración. Se sustituyen por ámbitos oficiales de Lifecycle que conservan sus instancias en ese caso y las limpian al abandonar el ámbito. No se bloquea la orientación ni se evita la recreación mediante el manifiesto.

Los repositorios Android se conservan en el ciclo de vida nativo. El acceso usa referencia débil a la Activity actual, vinculada/desvinculada al recrearse, y Credential Manager con contexto de aplicación; no se conserva la Activity destruida. Una solicitud de Google cancelada por destrucción termina su estado pendiente.

Tres pruebas nuevas con recreación real y giros horizontal/vertical en API 36, fuente del sistema al 100 %, superadas: borrador y Ajustes sobreviven pero se limpian al cerrar sesión; aclaración/respuesta parcial continúan con el mismo ID y revisión; envío en curso, confirmación y fuente sobreviven sin más peticiones. Se cierran el teclado y se esperan sus insets y la visibilidad tras la transición nativa antes de comprobar contenido desplazable, sin sleeps ni reenvíos. Los primeros intentos detectaron aserciones prematuras durante esa transición; se conserva la comprobación de visibilidad con espera acotada al estado esperado. El host no exportado solo existe en debug y usa fixtures sin Firebase/OpenAI. Ejecución conjunta final: **19/19 pruebas instrumentadas correctas**. Compilaciones APK/tests, `mobileCheck` (26 host tests, formato, arquitectura, Detekt y Lint) correctos. No prueba muerte del proceso ni la versión iOS.

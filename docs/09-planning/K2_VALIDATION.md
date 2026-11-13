# K2 · Captura por escrito

Rama: `codex/k2-text-memory`, desde `2f18f23`. **Estado: implementación local; activación real pendiente.** No es cierre de K2 ni de K1/iOS.

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
| `pwsh -NoProfile -File tooling/mobile.ps1 mobileCheck` | Formato, arquitectura, Detekt, 24 host tests y Android Lint correctos |
| Pruebas instrumentadas Android | 16/16 correctas en API 36 con letra al 200 %. Los tres casos nuevos se repitieron a tamaño normal para capturas, con cuenta/repositorio ficticios |
| iOS | Puente Functions y entrada Compose preparados, archivo Swift registrado en Xcode; no compilado ni ejecutado en Windows |

Casos nuevos: commit y replay sin duplicados; reutilización conflictiva del ID; aclaración sin memoria anticipada; error del proveedor sin fuente parcial; límites/concurrencia; trabajadores tardíos; revocación antes del commit; caducidad; reservas distribuidas; identidad ajena, modo/UID/clave/zona inyectados; respuesta móvil malformada; cancelación y resultados tardíos; Preguntar sin escritura. Los dobles de IA no prueban calidad semántica del proveedor. Las revisiones no debilitaron aserciones: se corrigió una llamada recursiva en el fake y un import de API de tests, además de límites/advertencias reales del código.

La primera prueba de interfaz detectó dependencia de un repositorio simulado anterior. Se pasó explícitamente la dependencia actual por parámetros Koin al ViewModel, como la cuenta; no se borró el estado del dispositivo ni se relajaron aserciones. El envío cierra el teclado; las pruebas ejercitan IME Send y el botón mediante un único envío, esperan estados concretos sin sleeps y verifican visibilidad, fuente y número de peticiones. Letra del emulador restaurada y emulador cerrado; móviles personales intactos. Se retira la dependencia local innecesaria `kioku:file:..` del backend para que el paquete desplegable no dependa de copiar la raíz del workspace; el núcleo compilado queda dentro de `backend/lib`.

## Proveedor real con persistencia aislada

`pwsh -NoProfile -File tooling/backend-emulators.ps1 -LiveCaptureSmoke` usa la clave existente autorizada y conserva el contador/límite acumulado de M0. [Resultado seguro](k2-live-smoke-2026-11-13.json): dos casos nuevos ficticios con **Sol medium**, seis llamadas, 7869 tokens de entrada y 463 de salida, **0,023814 USD estimados**. Entrada de dos asuntos guardada en 12,698 s; ambigüedad aclarada y guardada en 5,201 s de procesamiento de la respuesta. Fuente/aclaración conservadas y replay sin llamar a la IA. Los datos de Firestore demo se limpiaron al terminar. No se usó el Firebase de producción para almacenar estos relatos.

No son tres rondas de aceptación ni una medición p95; el objetivo de latencia M0/K2 sigue abierto. La evidencia M0 de 74 pruebas/tres rondas no se convierte en prueba de IAM/App Check/iOS por reutilizar el núcleo.

Inspección remota de solo lectura: `europe-west1`, PITR desactivado, cero programaciones de backup, runtime esperado de K1. El acceso al payload del secreto y los TTL de `operations`/`usage` aún no están configurados. Falta la activación específica de K2, sin crear claves o proyectos nuevos.

| Guardado · fixture Android | Aclaración · fixture Android |
| --- | --- |
| ![Confirmación después del resultado](../assets/branding/kioku-capture-saved-android.png) | ![Aclaración sin memoria confirmada](../assets/branding/kioku-capture-clarification-android.png) |

## Antes de activar datos reales

- Activar y comprobar los nuevos callables protegidos, IAM mínimo de lectura del secreto y TTL de operaciones; confirmar que fuentes/recuerdos no caducan y que no se activan backups históricos/PITR.
- Ejecutar una prueba acotada con proveedor real y relatos ficticios, manteniendo el contador/presupuesto vigente; registrar estados, latencia y uso sin texto privado o claves.
- Instalar como actualización y comprobar captura/clarificación/fuente en Android con Google/App Check reales; compilar y comprobar la integración en Mac/iOS. No sustituir estos resultados por fixtures o acceso K1 de un build anterior.
- No declarar consulta, corrección, olvido o voz disponibles hasta sus fases. No usar datos insustituibles como primera aceptación.

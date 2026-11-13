# K1 · Primera frontera de cuenta · 2026-11-13

Estado: **K1 en curso**, primera entrega local comprobada en `codex/k1-account-configuration`, basada en K0 `322fa55`. No cierra UC-001/UC-002, la configuración OpenAI o el recorrido móvil. [ADR-007](../02-architecture/ADR/ADR-007-private-google-account.md) recoge las decisiones del propietario.

Código y pruebas validados: commit `e3d5c26`. Esta anotación posterior solo fija la referencia de evidencia; no cambia la implementación comprobada.

## Resultado revisable

`backend/` separa contrato/caso de uso de cuenta y adaptadores Firebase. Un callable v2 `getConfiguration` acepta únicamente `{apiVersion: 1}`, cuerpo HTTP hasta 256 bytes y cabecera de autorización hasta 8192 caracteres; comprueba token y revocación/deshabilitación, exige Google/correo verificado permitido y vincula un UID mediante transacción. La configuración privada inválida o deshabilitada falla cerrada. No hay selección de propietario desde el cliente. Máximo de 30 lecturas autorizadas por minuto, contador transaccional y hasta tres intentos de contención.

Respuesta segura exacta: `{apiVersion: 1, account: authorized, ai: notConfigured, revision: 0}`. No guarda, devuelve o valida claves; el estado no representa una configuración real de IA existente. No hay fallback a M0 o a una clave compartida. Errores seguros sin datos privados ni objetos crudos del proveedor.

`firestore.rules` deniega toda lectura/escritura cliente. El punto de entrada actual exige proyecto demo y emuladores locales exactos antes de inicializar SDKs. No puede desplegarse/ejecutarse tal cual en producción. No hay `.firebaserc` ni alias remoto por defecto.

## Herramientas y entorno comprobados

- Windows, PowerShell; Node 24.22.1 para herramientas/tests, Node 22.23.5 para Functions; TypeScript 5.9.3 strict y Prettier 3.6.2.
- Firebase Admin 14.5.1, Functions 7.4.0, CLI 15.36.0; cliente de tests Firebase 13.3.0 y rules-unit-testing 6.0.0. Validador Zod 4.6.7 corregido frente a la versión antigua del prototipo; no se modifica M0.
- Runtime Functions `nodejs22`, según la [documentación oficial](https://firebase.google.com/docs/functions/manage-functions). El CLI y los SDK se consultaron en el registro oficial y se fijaron con lockfile independiente; instalación sin scripts.
- Archivo Node Windows obtenido de `nodejs.org`, verificado contra su `SHASUMS256.txt`: SHA256 `4a191082e9706866830379d577d2cc8a50c776fcd9436a8d061b063ed0d9a0e3`. No modifica Node del equipo.
- JDK 21 local ya preparado para K0. Firestore Emulator 1.22.0 descargado por el CLI oficial y cacheado en `.setup/firebase-emulators`.
- Auth 9097, Firestore 8087 y Functions 5007, loopback, proyecto `demo-kioku-local`. Fixtures de identidad/texto exclusivamente sintéticos. Usar demo evita recursos remotos de respaldo, según [Firebase](https://firebase.google.com/docs/emulator-suite/connect_auth).

## Comprobaciones ejecutadas

Desde la raíz:

```powershell
node tooling/backend.mjs build
node tooling/backend.mjs test
node tooling/backend.mjs format:check
pwsh -NoProfile -File tooling/backend-emulators.ps1
node tooling/backend.mjs audit --omit=dev
pwsh -NoProfile -File tooling/check-docs.ps1
```

- TypeScript strict sin errores y formato comprobado.
- **6 pruebas unitarias**: configuración mínima, identidades no permitidas, correo/proveedor no verificados, campos extra/otro propietario, falta de configuración y rechazo/limitación desde persistencia; guarda contra entorno remoto/mezclado.
- **10 pruebas de emuladores**: misma identidad en dos inicios independientes, otra cuenta/sin sesión, correo no verificado/inyección de propietario, UID distinto con mismo correo, deshabilitación en configuración y Auth, límite/concurrencia del contador, carrera de vinculación inicial, sesión anterior a revocación, configuración privada corrupta y reglas cliente.
- La prueba de reglas escribe fixtures mediante contexto administrativo autorizado y comprueba **111 denegaciones**: nueve rutas × cuatro operaciones × tres identidades, más tres consultas de colección. Incluye fuente, memoria, otra cuenta, índice, recibo, configuración, credenciales y ruta desconocida. Los mensajes `PERMISSION_DENIED` del SDK son el resultado esperado de esos rechazos, no fallos omitidos.
- La revocación fija un corte temporal en el emulador Auth sin sleeps. No prueba firmas Google reales. La recuperación usa dos sesiones de la misma identidad ficticia, no dos instalaciones Android/iOS.
- No se ejecutan Gradle/Android/iOS porque esta entrega no modifica el móvil. No se atribuyen nuevas pruebas nativas a K1.

Logs locales ignorados: `local-data/k1-emulator-first.log`, `k1-emulator-second.log`, `k1-emulator-third.log`, `k1-emulator-final.log` y `k1-emulator-bounds.log`. Se conservan los intentos: el primero falló por colisión de correo entre fixtures Auth; se aisló el estado entre casos manteniendo las expectativas. El segundo rechazó un tipo de credencial local no admitido por Admin/Firestore; se volvió al SDK oficial y se configuró la detección de metadatos como ausente solo en el proceso local. El tercero pasó ocho pruebas; se añadieron los dos casos de concurrencia/revocación y el final pasó diez. Tras fijar el límite de cuerpo, `bounds` volvió a pasar diez, incluido el rechazo de tamaño. No se reintentó el mismo código hasta acertar ni se redujeron controles. Los emuladores se detuvieron al acabar y los tres puertos de servicio quedaron sin escuchas.

## Dependencias y seguimiento

Auditoría de dependencias de ejecución del backend: **0 vulnerabilidades conocidas** en esta ejecución; no equivale a una auditoría externa. Auditoría completa incluidas herramientas locales: **18 avisos** (5 altos, 13 moderados) en el árbol de los SDK/CLI oficiales actuales. No se aplican degradaciones automáticas ni overrides mayores sugeridos por `npm audit` sin comprobar compatibilidad; tampoco se ocultan avisos o se declara limpio ese árbol. Hay deprecaciones transitivas al instalar.

Alcance acotado: las herramientas y el SDK web se usan solo en pruebas locales con datos ficticios y no forman parte del servidor de ejecución ni del móvil. Revisar y resolver/revaluar esos avisos antes del primer despliegue remoto y en la próxima actualización de herramientas. M0 conserva su dependencia antigua para no cambiar retroactivamente la evidencia; actualizar y repetir la regresión afectada antes de reutilizarla en K2.

## Pendiente antes de cerrar K1

Registro Android/iOS, configuración privada del correo autorizado, Google nativo y recuperación/cierre de sesión con limpieza de resultados antiguos; configuración/transporte/validación/reemplazo de clave en gestor privado de servidor, metadatos seguros y concurrencia/idempotencia; App Check y permisos mínimos; Firestore/Functions reales en la región aprobada, revisión de facturación y despliegue autorizado. Compilar y recorrer iOS en Mac. Las pruebas locales no acreditan esas integraciones ni que los créditos API estén disponibles.

En consola solo se leyó `kioku-9454f`: Spark, sin apps registradas y entorno sin especificar al consultar. El propietario decide que será el único proyecto remoto de producción y aprueba Bélgica para los recursos futuros. No se modificó ningún ajuste remoto, no se creó otro proyecto, no se desplegó ni se consumieron créditos OpenAI.

Documentos consultados: AGENTS, convenciones/calidad/definición de terminado, plan/limitaciones, arquitectura y ADR-003/004, requisitos/casos de uso, datos/API, seguridad, entornos y matriz de pruebas. Sin cambio visual ni edición de Stitch.

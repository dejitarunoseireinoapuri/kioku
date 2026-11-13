# Backend de cuenta y configuración K1

`getConfiguration` v1: Google personal, vinculación de UID, estado seguro de IA y revisión. Producción exige App Check/proyecto/apps exactos; las mutaciones de clave son administrativas, sin endpoint móvil. [Decisión](../docs/02-architecture/ADR/ADR-008-k1-native-access-and-credentials.md), [contrato](../docs/04-api/API_CONTRACT.md) y [evidencia actual](../docs/09-planning/K1_INTEGRATION_VALIDATION.md). K1 sigue abierta hasta las comprobaciones reales e iOS.

Desde la raíz del repositorio, Node 24.12+ y la herramienta npm verificada de M0:

```powershell
node tooling/backend.mjs install
node tooling/backend.mjs build
node tooling/backend.mjs test
node tooling/backend.mjs format:check
node tooling/backend.mjs audit --omit=dev
```

`backend/package-lock.json` es independiente del prototipo M0. `install` usa `ci` si existe lockfile y desactiva scripts de instalación. Los comandos siguientes usan únicamente fixtures; no necesitan ninguna clave API, cuenta Google real ni login Firebase CLI.

En Windows, instalar Node 22 oficial y JDK 21+; ejecutar:

```powershell
pwsh -NoProfile -File tooling/backend-emulators.ps1 -FunctionsNode '<ruta al node.exe de Node 22>'
```

El parámetro se puede omitir si el runtime verificado local está en `.setup/k1-node/node-v22.23.5-win-x64/node.exe`. El script usa Node 22 para Functions y el Node 24 del entorno para tests, conserva/restaura sus variables de proceso y detiene los emuladores al terminar. No cambia instalaciones ni variables del sistema. Java puede obtenerse del `JAVA_HOME` existente o de la preparación local K0.

Para otro sistema, con Node 22 y JDK 21+ disponibles, compilar primero y ejecutar el CLI fijado con `emulators:exec --config firebase.local.json --project demo-kioku-local --only auth,firestore,functions`; el proceso de pruebas debe usar Node 24, tener los emuladores de Auth/Firestore en las direcciones del archivo y ejecutarse desde `backend/` mediante `node --test --test-concurrency=1 lib/test/emulator/*.test.js`. Esa variante no se ha ejecutado aquí.

Puertos reservados locales: Auth 9097, Firestore 8087, Functions 5007, hub 4407, logging 4507. Si hay colisión, no detener otros procesos: revisar explícitamente la configuración y sus guardas. No importar/exportar datos reales; cada ejecución inicia fixtures nuevos, y los tests limpian únicamente el proyecto demo verificado. El binario Firestore se descarga a `.setup/firebase-emulators` y queda en caché.

`firebase.local.json` sigue reservado al proyecto demo y sus direcciones exactas. `firebase.production.json` prepara únicamente el proyecto personal autorizado; no hay `.firebaserc` o alias por defecto. Alta y configuración privadas en [K1_REMOTE_SETUP](../docs/08-deployment/K1_REMOTE_SETUP.md). No desplegar por el mero hecho de disponer del archivo: requiere autorización para ese destino.

Producción usa Node 22. El lockfile se normaliza con npm 10.9.9 (el del runtime verificado), compatible con la compilación Google; herramientas/tests locales usan Node 24. La compilación y formato se ejecutan obligatoriamente como predeploy. Se envía `lib/src` ya compilado; `gcp-build` vacío evita que Google vuelva a ejecutar el build de herramientas, según su [documentación](https://docs.cloud.google.com/run/docs/runtimes/nodejs). Se excluyen tests, fuentes/compilado administrativos y archivos privados del paquete. Los paquetes de prueba requieren Node 24 y pueden producir avisos de motor al validar metadatos completos bajo npm/Node 22, aunque no se instalen en ejecución; no se usan en Functions.

El override acotado a gRPC del SDK web y los 13 avisos moderados pendientes del CLI se justifican en la evidencia actual. La auditoría de ejecución tiene cero avisos conocidos; no equivale a limpiar toda la herramienta.

# Primera frontera backend K1

Implementación local de `getConfiguration` v1, Google personal y vinculación de UID. No es un backend desplegable ni la configuración OpenAI completa. [Decisión](../docs/02-architecture/ADR/ADR-007-private-google-account.md), [contrato](../docs/04-api/API_CONTRACT.md) y [evidencia](../docs/09-planning/K1_VALIDATION.md).

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

No usar `firebase deploy` con esta entrega. El punto de entrada rechaza cualquier proyecto remoto antes de inicializar SDKs. No hay excepción local aplicable a producción ni fallback de proyecto. Tampoco hay `.firebaserc` o alias remoto por defecto.

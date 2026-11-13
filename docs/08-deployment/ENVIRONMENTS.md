# Entornos

| Entorno | Propósito | Estado |
| --- | --- | --- |
| Local/demo | Emuladores y fixtures ficticios | `demo-kioku-local`, `firebase.local.json`; ningún proyecto remoto |
| Production/personal | Único proyecto remoto, por decisión del propietario | `kioku-9454f`, verificado en consola; recursos futuros en `europe-west1`, Bélgica; integración pendiente |

El propietario descarta un segundo proyecto de desarrollo. No se crean Development/Preproduction ni se cambia el proyecto existente por documentar esta decisión. [ADR-007](../02-architecture/ADR/ADR-007-private-google-account.md) registra el alcance y sus consecuencias. Las pruebas locales nunca usan la cuenta, claves o datos reales.

La región europea está aprobada, pero no hay base de datos o Functions creadas por esta entrega. Firestore y Functions se configurarán explícitamente antes de usarlas. No afirmar una localización de OpenAI por elegir una región de Firebase. El proyecto observado está en Spark; no se habilita Blaze ni facturación automáticamente.

El cliente y el backend verifican su configuración; un valor ausente o desconocido falla cerrado. No hay fallback a otro proyecto o Production. Un cambio de nombre/bundle no selecciona entorno ni migra datos.

No usar recuerdos reales en Local/Development. No copiar los identificadores ni las excepciones operativas de Wonderdrop.

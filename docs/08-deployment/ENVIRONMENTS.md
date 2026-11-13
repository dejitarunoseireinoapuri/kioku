# Entornos

| Entorno | Propósito | Estado |
| --- | --- | --- |
| Local/demo | Emuladores y fixtures ficticios | `demo-kioku-local`, `firebase.local.json`; ningún proyecto remoto |
| Production/personal | Único proyecto remoto, por decisión del propietario | `kioku-9454f`, Blaze; apps/Google, Firestore/Secret Manager y servidor en Bélgica; acceso/configuración Android reales comprobados, iOS pendiente |

El propietario descarta un segundo proyecto de desarrollo. No se crean Development/Preproduction ni se cambia el proyecto existente por documentar esta decisión. [ADR-007](../02-architecture/ADR/ADR-007-private-google-account.md) registra el alcance y sus consecuencias. Las pruebas locales nunca usan la cuenta, claves o datos reales.

Firestore `(default)` se verificó en `europe-west1`; el contenedor Secret Manager usa réplica únicamente en esa región. El propietario activó Blaze y autorizó despliegue/traslado de clave y los roles concretos del servidor. Estado de Functions y comprobaciones en [evidencia K1](../09-planning/K1_INTEGRATION_VALIDATION.md). No afirmar una localización de OpenAI por elegir una región de Firebase; la facturación de ambos servicios es independiente.

El cliente y el backend verifican su configuración; un valor ausente o desconocido falla cerrado. No hay fallback a otro proyecto o Production. Un cambio de nombre/bundle no selecciona entorno ni migra datos.

No usar recuerdos reales en Local/Development. No copiar los identificadores ni las excepciones operativas de Wonderdrop.

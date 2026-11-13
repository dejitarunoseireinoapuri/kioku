# ADR-008 · Acceso nativo y configuración privada de IA

- Estado: implementación comprobada en Android/emuladores y acceso/configuración reales Android; validación nativa iOS y cierre completo K1 pendientes.
- Fecha: 2026-11-13.
- Amplía [ADR-007](ADR-007-private-google-account.md). La frontera de secretos de [ADR-004](ADR-004-credentials-and-audio.md) se mantiene.

## Decisión

El propietario aprueba una pantalla inicial sencilla con Kioku, explicación y «Continuar con Google», seguida de estado de sesión/IA en Ajustes. Exige las directrices de marca Google: recurso G original sin tintado, Google Sans Medium, fondo blanco/borde/texto propios y espaciado nativo Android/iOS; el resto mantiene la estética B inspeccionada en Stitch. No se modifica Stitch.

Android usa Credential Manager y el SDK oficial Google ID, intercambia la credencial con Firebase Auth y llama al callable protegido con Firebase Functions. Apple prepara Firebase Auth/Functions y Google Sign-In oficiales a través de Swift. Los SDK nativos quedan en adaptadores; el dominio compartido solo contiene sesión, resultados seguros y repositorio. Un puente de callbacks convierte eventos en Flow y suspensiones cancelables.

La identidad Firebase no autoriza la conversación por sí sola. AccountViewModel espera el estado confirmado por servidor; un fallo no abre contenido privado. Generaciones y cancelación invalidan resultados antiguos. ViewModels de aplicación y conversación se acotan a su composición/sesión y se limpian al desecharlas. La cuenta nativa persiste mediante el SDK; un marcador local no secreto impide aceptar una autenticación cancelada que termine tarde. No se guardan tokens propios ni claves OpenAI en preferencias.

Ajustes muestra cuenta y estado de IA, permite comprobarlo sin perder el borrador y cerrar sesión. El backend devuelve solo `ready`/`notConfigured` y revisión. `ready` significa referencia activada tras validación, no saldo comprobado ni disponibilidad garantizada del proveedor.

## Clave y alta personal

Alta/sustitución desde el PC autorizado del propietario: validación OpenAI de metadatos de Sol, versión inmutable de Secret Manager y activación transaccional de su referencia mediante revisión esperada. Alta personal real completada, referencia revisión 1. No hay clave en el binario o repositorio. Una sustitución rechazada no altera la referencia anterior; un resultado incierto no destruye una versión posiblemente activada. Reemplazo comprobado con dobles/emuladores; no se rota innecesariamente la clave real.

La herramienta es administrativa, usa Google ADC/IAM y no expone un endpoint de escritura de credenciales al móvil. Esta entrega no implementa todavía el formulario móvil previsto en UC-002/ADR-004; la diferencia sigue explícita antes de cerrar K1. No se interpreta «solo para mí» como autorización para incrustar una clave, desactivar atestación o desplegar sin aprobación.

## Producción y límites

Un punto de entrada preparado acepta exclusivamente `kioku-9454f`, configuración completa y App Check con IDs exactos de Android/iOS. Rechaza mezcla de producción/emuladores. El transporte callable debe admitir conexión pública HTTP; autenticación, cuenta permitida y App Check se exigen en cada solicitud antes del caso de uso. La reparación del permiso invoker remoto requiere la aprobación específica registrada en la evidencia, no se da por aplicada por declarar `invoker: public` en el código. Play Integrity/App Attest se integran sin fallback debug automático. Las reglas Firestore siguen denegando acceso cliente.

El [plan de activación](../../08-deployment/K1_REMOTE_SETUP.md) concreta registros, región, firma, IAM, facturación, secreto y comandos. Producción, traslado de clave y facturación requieren las autorizaciones correspondientes; vincular facturación es una acción del propietario. Los tests no acreditan Google/atestación reales, firma iOS, dos instalaciones reales o acceso al crédito API. La compilación y resolución SPM iOS requieren Mac.

La recreación de la raíz recompone adaptadores y revalida la sesión; no reenvía mutaciones. La conservación del borrador durante recreación nativa/rotación sigue pendiente al integrar captura real en K2. El borrador sí se conserva al recorrer Ajustes y comprobar configuración dentro de la misma sesión.

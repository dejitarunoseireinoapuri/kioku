# ADR-007 · Cuenta Google personal y único proyecto remoto

- Estado: decisión aceptada; primera frontera backend implementada solo en emuladores. Integración móvil y producción pendientes.
- Fecha: 2026-11-13.
- Sustituye la separación remota Development/Production propuesta en [ENVIRONMENTS](../../08-deployment/ENVIRONMENTS.md); mantiene las fronteras de [ADR-003](ADR-003-backend-boundary.md).

## Contexto y decisión

El propietario elige «Continuar con Google», una única cuenta permitida y un único proyecto Firebase de producción. Se verificó en consola la identidad `kioku-9454f`, nombre `kioku`, plan Spark y ausencia de apps registradas. La región aprobada para los recursos futuros es Bélgica, `europe-west1`; observar el proyecto no crea ni localiza una base de datos.

No se crea otro proyecto de desarrollo. Las pruebas usan `demo-kioku-local` exclusivamente en Emulator Suite, con identidades ficticias. El correo real autorizado permanece en configuración privada al integrar producción; no se copia a fixtures, documentación versionada ni logs.

El servidor verifica identidad Firebase, revocación/deshabilitación, proveedor `google.com` y correo verificado permitido. Vincula atómicamente el primer UID válido a un documento privado; un UID distinto no hereda el acceso por coincidir en correo. La vinculación no se borra ni reasigna al cerrar sesión. Recuperación o sustitución de UID requiere una intervención administrativa explícita futura.

El cliente no elige propietario y no lee ni escribe directamente Firestore. Una regla global deniega también colecciones futuras; los SDK de servidor operan mediante IAM y autorización propia. La respuesta de configuración contiene solo estado seguro, sin UID, correo, clave ni referencias privadas.

## Alcance de esta primera entrega

`backend/` implementa `getConfiguration` v1, admisión transaccional y límite de 30 lecturas por minuto/UID vinculado. Rechaza entradas con campos adicionales. Solo devuelve `ai: notConfigured`, `revision: 0`: todavía no existe configuración de clave ni se finge validación OpenAI.

El punto de entrada actual exige proyecto demo, emuladores y direcciones locales exactos antes de inicializar SDKs. No puede ejecutarse como backend de producción. La excepción local de atestación queda encerrada en ese punto de entrada; App Check remoto y su registro nativo siguen pendientes. No se publica un punto remoto permisivo mientras falta completarlos.

## Consecuencias y alternativas

Un único proyecto reduce mantenimiento, pero toda prueba de integración remota deberá usar exclusivamente datos ficticios y cambios acotados. No se usan recuerdos reales hasta K6. No hay fallback al proyecto real cuando falla un emulador.

Se descarta correo/contraseña por elección del propietario. No se añade Apple u otro proveedor por anticipar una distribución aún no solicitada. La validación Google real en Android/iOS y los requisitos de distribución se revisarán cuando correspondan.

La clave OpenAI seguirá en un gestor privado de servidor según ADR-004. El alta local de M0 no adelanta su transporte/configuración móvil. Antes del primer despliegue se necesitan registro de apps y Google, Firestore con reglas, App Check, permisos mínimos y un backend completo. La facturación Firebase es independiente de los créditos OpenAI; esta entrega no cambia el plan ni despliega recursos.

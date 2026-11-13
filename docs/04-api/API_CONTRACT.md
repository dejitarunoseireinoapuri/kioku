# Contrato backend previsto · v1

Operaciones autenticadas, versionadas y ligadas al UID verificado; el cliente no elige otro propietario. App Check y límites de abuso se aplican al entorno remoto antes de distribuir. La tabla es el contrato previsto; solo `getConfiguration` tiene implementación/despliegue K1, con validación real todavía incompleta según la evidencia.

| Operación | Entrada relevante | Resultado |
| --- | --- | --- |
| `getConfiguration` | sesión, apiVersion: 1 | Estado seguro de cuenta/IA, nunca clave |
| `setAiCredential` | requestId, clave por transporte privado | Estado validado y referencia no secreta; reemplazo seguro |
| `submitTurn` | requestId, mode, channel, texto o referencia temporal autorizada, locale/zone | `saved`, `needsClarification`, `answer`, `proposal` o error tipado |
| `resolveClarification` | requestId, clarificationId, respuesta, expectedRevision | Continuación del turno original |
| `queryMemory` | requestId, pregunta, referencias de contexto autorizadas | Respuesta y evidencias o insuficiencia/aclaración |
| `resolveProposal` | requestId, proposalId, accept, expectedRevision | Guardado una vez o rechazo sin mutación |
| `correctMemory` | requestId, targetId, expectedRevision, corrección explícita | Revisión canónica y fuentes afectadas |
| `forgetMemory` | requestId, targetId/alcance resuelto, expectedRevision | Estado de borrado y referencias mínimas |
| `getSource` | sourceId, referencia/revisión | Texto propio vigente permitido, con correcciones distinguidas |
| `getOperation` | requestId propio | Estado confirmado para recuperar un resultado incierto |

## Garantías

Frontera K1 comprobada en emuladores, función remota activa: `getConfiguration` acepta exactamente `{apiVersion: 1}`, cuerpo HTTP de hasta 256 bytes y cabecera de autorización de hasta 8192 caracteres. Requiere Google permitido, correo verificado y UID vinculado; revalida tokens revocados/usuarios deshabilitados. Responde `{apiVersion: 1, account: authorized, ai: ready | notConfigured, revision: entero no negativo}`. Sin referencia de credencial, devuelve `notConfigured`, revisión 0. Límite: 30 lecturas autorizadas por minuto de servidor. Producción exige entorno/proyecto exactos y App Check de las apps registradas. Estado de transporte HTTP y recorrido positivo real en la [evidencia K1](../09-planning/K1_INTEGRATION_VALIDATION.md); no se deducen de los tests locales. El resto de operaciones sigue previsto.

La activación administrativa de clave no es `setAiCredential`: una herramienta privada valida la credencial, crea versión inmutable en Secret Manager y activa solo su referencia con revisión esperada. No acepta identidades arbitrarias de un cliente móvil ni devuelve la clave. Una clave rechazada preserva el estado anterior. `ready` refleja la última activación validada; no verifica saldo ni garantiza que la clave no se haya revocado después. El formulario/endpoint móvil previsto sigue pendiente, según ADR-008.

Errores seguros de esta frontera: `unauthenticated`, `permission-denied`, `invalid-argument`, `resource-exhausted`, `failed-precondition` y `unavailable`. No devuelve detalles crudos de Firebase ni los campos rechazados. Se reautoriza cada lectura; una sesión cliente no concede acceso permanente.

- Validar campos exactos, tipos, tamaños, longitud y pertenencia de todas las referencias. Límites concretos deben fijarse antes de implementar, no quedar ilimitados.
- Idempotencia ligada a usuario+operación+requestId+entrada; reutilizar ID con otra entrada es conflicto. Reautorizar incluso un replay. Recibos no repiten secretos ni contenido olvidado.
- Mutaciones usan revisión esperada y commit de servidor. No ejecutar peticiones OpenAI dentro de callbacks de transacción Firestore que puedan repetirse.
- Una llamada externa puede haberse cobrado aunque el cliente vea timeout. No prometer exactamente-un-cobro; limitar reintentos y separar fases de operación y persistencia.
- Query es lectura salvo propuesta aceptada o corrección/borrado explícitos autorizados. Texto recuperado y decisiones del modelo no son autorización.
- Uso de OpenAI con la clave configurada para esa cuenta; sin fallback silencioso a otra clave, propietario o entorno.

Payloads de voz pueden requerir un protocolo temporal de upload/transcripción separado por límites del transporte; se resolverá antes de UC-003. No subir binarios arbitrarios al contrato de texto por conveniencia.


## Frontera interna comprobada en M0 v4

El prototipo local limita la salida del proveedor a evidenceIds de los candidatos seleccionados y deriva las citas sourceIds en código. Generación y verificación contrastan el alcance de la pregunta (recuerdo, contenido citado o ambos). El texto citado no acredita datos personales. Para consultas exclusivamente de citas, el resultado se materializa desde el literal autorizado tras la verificación. Esto no publica endpoints ni sustituye autorización por UID/revisión en el backend previsto.

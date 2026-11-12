# Contrato backend previsto · v1

Operaciones autenticadas, versionadas y ligadas al UID verificado; el cliente no elige otro propietario. App Check y límites de abuso se aplican al entorno remoto antes de distribuir. Este contrato es la base a implementar, no endpoints disponibles.

| Operación | Entrada relevante | Resultado |
| --- | --- | --- |
| `getConfiguration` | sesión | Estado seguro de cuenta/IA, nunca clave |
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

- Validar campos exactos, tipos, tamaños, longitud y pertenencia de todas las referencias. Límites concretos deben fijarse antes de implementar, no quedar ilimitados.
- Idempotencia ligada a usuario+operación+requestId+entrada; reutilizar ID con otra entrada es conflicto. Reautorizar incluso un replay. Recibos no repiten secretos ni contenido olvidado.
- Mutaciones usan revisión esperada y commit de servidor. No ejecutar peticiones OpenAI dentro de callbacks de transacción Firestore que puedan repetirse.
- Una llamada externa puede haberse cobrado aunque el cliente vea timeout. No prometer exactamente-un-cobro; limitar reintentos y separar fases de operación y persistencia.
- Query es lectura salvo propuesta aceptada o corrección/borrado explícitos autorizados. Texto recuperado y decisiones del modelo no son autorización.
- Uso de OpenAI con la clave configurada para esa cuenta; sin fallback silencioso a otra clave, propietario o entorno.

Payloads de voz pueden requerir un protocolo temporal de upload/transcripción separado por límites del transporte; se resolverá antes de UC-003. No subir binarios arbitrarios al contrato de texto por conveniencia.


## Frontera interna comprobada en M0 v4

El prototipo local limita la salida del proveedor a evidenceIds de los candidatos seleccionados y deriva las citas sourceIds en código. Generación y verificación contrastan el alcance de la pregunta (recuerdo, contenido citado o ambos). El texto citado no acredita datos personales. Para consultas exclusivamente de citas, el resultado se materializa desde el literal autorizado tras la verificación. Esto no publica endpoints ni sustituye autorización por UID/revisión en el backend previsto.

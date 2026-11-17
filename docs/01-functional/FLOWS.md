# Flujos y salidas

## Entrada y comprobación de memoria

La entrada conserva la pantalla de carga de logo/estado durante «Entrando...» y después «Comprobando cambios en tu memoria...». No se intercala el editor ni la conversación mientras la comprobación oculta los datos. La conversación aparece al resolverla; un fallo termina la carga y muestra el resultado disponible de recuperación, sin una espera artificial. La comprobación al volver a primer plano también mantiene esta pantalla si el contenido está oculto. Gestionar conserva su carga propia.

## Recuperación de consultas tras fallos de conexión

Una conexión interrumpida identificada por el transporte muestra un aviso de conexión y «Reintentar»; un tiempo de espera muestra que la respuesta tardó demasiado, sin atribuirlo automáticamente a cobertura. El mensaje enviado permanece en la sesión RAM y el botón reutiliza su texto. Si el servidor confirma que la consulta terminó pero la respuesta se perdió, puede renovar una vez su ID de lectura y consultar de nuevo. Si sigue procesando, comprueba el mismo ID. Una preparación terminada cuya respuesta se perdió puede renovar una vez el ID de interpretación, conservando los IDs de ejecución/consulta; no repite automáticamente una escritura. Ni una preparación caducada ni una respuesta retirada obligan a reescribir el texto mientras siga la sesión.

No hay cola sin conexión ni reintentos periódicos. Un fallo de transporte no implica que un guardado/corrección/olvido no ocurriera: mantiene su identidad y se comprueba, sin afirmar éxito ni reenviar con otra identidad. Cierre/reinicio y 30 minutos en segundo plano conservan las reglas de limpieza RAM; no se recupera texto de sesiones ya cerradas.

## Aclaraciones en la conversación

Mientras una aclaración espera respuesta, se puede cambiar a Explicar/Preguntar. Cada modo conserva el estado pendiente; una nueva entrada del otro modo no se une a la aclaración anterior. Al regresar se restaura la pregunta pendiente y se responde por el editor normal. Una aclaración de captura conserva su ID/revisión tras salir y volver. No se bloquean por esta espera los ajustes ni la navegación ordinaria.

Antes de buscar recuerdos, Kioku comprueba si la pregunta especifica un tema o tiene un antecedente en el contexto vigente. Una continuación aislada reconocida como «¿Y ahora?» sin ese antecedente pregunta qué se quiere consultar; no busca para adivinar el tema. Una pregunta completa como «¿Qué quiero hacer?» o una continuación resoluble sigue a consulta. El contexto anterior a una corrección/olvido no se utiliza para evitar la aclaración. Si la ambigüedad solo se descubre al examinar evidencia, la consulta puede pedir concreción después.

Si Kioku pide concretar una captura, consulta u orden ambigua, presenta su pregunta en el historial y el propietario contesta directamente en el campo habitual, con indicación de aclaración. No aparece un botón de reiniciar o «Volver a explicarlo» en una aclaración normal. La continuación conserva los mensajes de la sesión y el mismo canal; una captura pendiente mantiene su identidad de aclaración. Una reformulación explícita tras un límite reinicia únicamente el intento y su contexto, conservando el historial visible de la sesión. Los datos retirados y los avisos de cambios siguen excluidos de la evidencia y del contexto interpretativo; conservar mensajes no autoriza a reutilizarlos.

## Entrada y carga

Al pulsar «Gestionar» desde una referencia vigente de la conversación, se abre directamente el destino de gestión en carga. Una sola pantalla con logo y estado debajo cubre la comprobación de acceso/revisión y la lectura de los datos actuales. Cambia el texto, sin intercalar la conversación ni el encabezado/formulario de gestión. Los controles se muestran únicamente cuando termina la lectura autorizada; un fallo ofrece el estado de indisponibilidad y recarga. Se puede cancelar con Atrás del sistema. Revalidar al volver de segundo plano conserva esta misma presentación sin mostrar contenido anterior durante la comprobación.

El acceso visual usa el logo elegido 憶 y conserva el mecanismo Google existente:

```mermaid
flowchart TD
  Open[Abrir Kioku] --> Restore[Entrando en Kioku: resolver sesión]
  Restore -->|Sin sesión| Login[Acceso: Continuar con Google]
  Login --> Pending[Entrando en Kioku: acceso pendiente]
  Pending --> Google[Selector nativo de Google]
  Google -->|Cancelado| Login
  Google -->|Sesión obtenida| Config[Entrando en Kioku: resolver configuración]
  Restore -->|Sesión recuperada| Config
  Config -->|Autorización resuelta| Home[Pantalla inicial]
  Google -->|Fallo| Error[Error de acceso recuperable]
  Config -->|Fallo o cuenta no autorizada| Blocked[Estado de acceso bloqueado existente]
```

La vista de carga permanece detrás de la interfaz nativa de Google y vuelve a verse tras su retorno mientras se resuelve el acceso. Representa `SignedOut(busy = true)` o `Loading`; no un nuevo destino de navegación ni una operación paralela. Sale al cambiar el estado real. No hay tiempo mínimo, porcentaje inventado o confirmación anticipada de éxito. La carga no solicita permisos ni muestra datos privados. Errores conservan las acciones de recuperación del estado existente; cancelar no se trata como error técnico.

## Memoria

```mermaid
flowchart TD
  A[Sesión autorizada + conexión] --> B[Contar o Preguntar]
  B --> C[Texto enviado o voz mantenida]
  C --> D{Deslizar arriba}
  D -->|Sí| E[Grabación bloqueada]
  D -->|No: soltar| F[Procesar intervención]
  E -->|Terminar| F
  E -->|Cancelar| B
  F --> G{Intención}
  G -->|Contar| H{Contexto suficiente}
  H -->|No| I[Aclaración por mismo canal]
  I --> F
  H -->|Sí| J[Guardar y confirmar]
  G -->|Preguntar| K[Recuperar evidencia propia]
  K --> L[Respuesta + fuente]
  L --> M{Dato nuevo}
  M -->|Sí| N[Ofrecer guardar]
  N -->|Acepta| J
  N -->|Rechaza| L
```

## Estados y coherencia

Captura: `Idle → Holding → Locked? → Processing → NeedsClarification | Saved | Failed`. `Cancelled` nunca equivale a guardado. Preguntar: `Ready → Retrieving → Answering → Answered | NeedsClarification | InsufficientEvidence | Failed`.

La respuesta a una aclaración conserva la operación y su intención original. En una consulta, una corrección o borrado explícitos entran en UC-007/008; la mera aparición de información nueva entra en UC-006.

Olvidar: `Objetivo resuelto y vigente → Diálogo con texto/alcance → Cancelar | Confirmar → Aplicar → Confirmación del servidor → Aviso con el recuerdo`. Cancelar/cerrar no llama al borrado. Una aclaración de alcance ocurre antes del diálogo; una selección nueva necesita su propia confirmación. Un fallo incierto conserva el ID de la operación confirmada para comprobarla, sin repetir ni anunciar éxito. Revisiones/cuenta/caducidad obsoletas siguen impidiendo aplicar.

Toda fuente se abre con un retorno a la conversación que la referenció. No hay pestaña de biblioteca ni clasificación obligatoria. Se preserva el contexto durante un fallo; no se cambia de pantalla para simular éxito.

No solicitar permiso de micrófono al abrir la app: hacerlo al primer intento de voz. Permiso denegado mantiene disponible el texto. Una sesión invalidada cancela acceso privado y descarta resultados tardíos. Captura en segundo plano no está autorizada en V1; la política de interrupción y recuperación exacta se decidirá antes de implementar voz.

Continuidad de Gestión: selección actual → Corregir o popup coral de Olvidar → operación estable → confirmación del servidor → aviso en el mismo destino → lectura de fuentes/versiones vigentes → otra selección o volver. Se contemplan cero restos, una fuente conservada o una conservada y otra corregida. No se redirige automáticamente a Explicar. Volver durante una operación sin confirmación mantiene la invalidación conservadora; volver durante la lectura posterior conserva el cambio ya confirmado y el feed histórico autorizado.

Feed de sesión: conservar mensajes originales y anexar avisos de cambio; respuestas previas pasan a lectura histórica, sin fuentes/acciones antiguas. Los mensajes afectados pierden sus tres puntos y quedan deshabilitados; los datos vigentes solo se siguen gestionando dentro de Gestionar. Cambiar de intención recupera su feed completo. Segundo plano menor de 30 minutos → reautorizar y restaurar; 30 minutos o cierre/reinicio → ambos feeds/contextos vacíos, sin borrar recuerdos canónicos.

Refinamiento posterior: respuesta vigente de Preguntar → tres puntos → Gestionar → datos de las fuentes citadas con selección individual y su fecha de registro. Sin enlace Ver texto original; no hay menú sin fuentes. Corrección/olvido confirmado → título y detalle del dato o cambio de X a Y dentro del mismo recuadro, tanto en Gestionar como en el feed. Cada aviso conserva su detalle durante esa sesión, aunque se añadan turnos o cambie de intención; no forma contexto enviado ni permite gestionar valores retirados.

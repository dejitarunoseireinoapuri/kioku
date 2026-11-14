# K4 · Control conversacional de memoria

Rama: `codex/k4-memory-control`, desde la entrega K3 `6b264e7`. **En curso: controles selectivos por fuente implementados y comprobados localmente; activación remota pendiente.** K3 conserva la comprobación iOS actual y la aclaración del reporte temporal pendientes. No se integran ramas en `main` por esta ejecución.

## Alcance de la primera ejecución

Se prepara la base del servidor para retirar una fuente completa cuyo alcance ya esté resuelto, antes de implementar interpretación y UI. No responde todavía a «olvida…» desde la app. La retirada selectiva de un asunto de un relato, correcciones, ofertas de guardado, endpoints y limpieza coordinada de las conversaciones de dispositivos siguen pendientes. No se elimina un relato completo en lugar de un fragmento ambiguo.

`FirestoreSourceRetirementStore.inspect/retire` comprueba propietario, IDs, conjunto completo de 1–8 fragmentos, versiones y vencimiento de cinco minutos. El commit elimina fuente y fragmentos/índices juntos, limpia recibos/texto pendiente del mismo origen y persiste una revocación sin contenido ni TTL. La misma retirada es idempotente y se reautoriza; otra entrada, alcance caducado, cambio concurrente o exceso de registros impiden la mutación entera. No cancela concesiones de otro asunto.

Los adaptadores K2/K3 consultan las revocaciones para impedir guardados antiguos, fuentes retiradas y respuestas tardías con esa evidencia. El estado `expired` existente evita presentar como guardado un recibo retirado; no afirma que nunca se hubiera guardado. No se añaden callables ni se modifica el contrato HTTP público. [Decisión y secuencia restante](../02-architecture/ADR/ADR-011-memory-control.md).

Revisión de índices: `pending` está exento por privacidad; la consulta de limpieza requiere la excepción específica `pending.turn.id` con índice ascendente de alcance colección. La definición local conserva excluidos mapa/textos y no añade búsqueda global. No está desplegada; el éxito del emulador no prueba índices productivos. Debe comprobarse su preparación remota antes de habilitar K4.

## Criterios y comprobación local

Antes de comprobar se fijan casos ficticios de: retirada completa de dos asuntos, preservación de otra fuente y otra cuenta, replay simultáneo y tras caducidad del recibo, cambio de fuente/fragmento/conjunto, resolución caducada, identidad ajena/deshabilitada, recuperación de una captura K2 confirmada y trabajador antiguo, limpieza de pendientes, conservación/cancelación selectiva de concesiones, consulta en curso, reinserción de snapshot obsoleto y límites/colisiones. Los tests no tocan producción ni usan claves o datos reales.

Comandos desde la raíz:

```powershell
node tooling/backend.mjs build
node tooling/backend.mjs test
node tooling/backend.mjs format:check
pwsh -NoProfile -File tooling/backend-emulators.ps1
pwsh -NoProfile -File tooling/check-docs.ps1
```

Resultados: compilación TypeScript strict y formato correctos, **15/15 pruebas unitarias** (una nueva de validación de alcance) y **47/47 pruebas de emuladores** (11 nuevas de retirada, más ampliación de reglas de acceso a revocaciones). Se conserva la cobertura existente de captura, consulta, credenciales y aislamiento. La suite incluye confirmación K2, retirada y rechazo de su trabajador antiguo; no solo registros de ejemplo insertados directamente. La primera ronda de nueve casos de retirada pasó 45/45 antes de añadir los dos casos de captura confirmada y concesión/replay revocado. Una revisión posterior sustituye interpolación de regex por conjunto cerrado de IDs y amplía el caso de entrada malformada; compilación y las 15 unidades se repiten correctamente. No se atribuyen resultados al modelo o al entorno real a partir de estos dobles. El validador local `FirestoreApi.validateSpec` del CLI fijado acepta la definición de índices, sin llamar a Google. Comprobador documental correcto: **65 documentos y 11 ADRs**, enlaces/mapa/identificadores; revisión semántica y `git diff --check` sin errores.

## Límites de la primera entrega (históricos)

Sin llamadas OpenAI, gasto API nuevo, claves consultadas, nuevos recursos o modificaciones de recuerdos productivos. No hay cambio visual/móvil: no procede afirmar pruebas nativas nuevas o instalar el mismo APK por esta frontera. El Honor queda seleccionado por el propietario para las próximas comprobaciones que sí afecten al móvil. No se valida despliegue, Google/App Check real, interpretación del proveedor, sincronización móvil o iOS.

Documentación consultada: convenciones/calidad, plan/limitaciones, evidencia K3, modelo/retención, API, seguridad/privacidad y ADR-005; SDK fijado y transacciones de Firestore. No se precisa acceso visual a Stitch porque este bloque no modifica interfaces. La continuación no cierra K3 ni K4 automáticamente.

## Segunda ejecución · control selectivo por fuente

Desde «Texto original» se añade «Gestionar»: cada dato permite corregirlo con una frase completa u olvidarlo; una acción distinta declara expresamente que retira todo ese texto. La orden clara no añade confirmación redundante. El servidor comprueba el alcance seleccionado y una versión opaca de fuente y fragmentos; cualquier conflicto, ambigüedad o revisión negativa deja intacto el canónico. Todavía no interpreta órdenes naturales como «olvida lo del examen» ni ofrece guardar un dato nuevo desde Preguntar. **K4 no está cerrada.**

La selección retira todos los literales del dato escogido y preserva los bytes ajenos. Una revisión semántica adicional comprueba autorización, conservación y ausencia del objetivo. Fuente original y todos sus fragmentos se revocan en el mismo commit que crea los restos y la corrección con IDs nuevos y proyecciones vigentes. La fuente conservada mantiene recepción/zona; la corrección usa su recepción nueva y revisiones incrementadas. `sourceKind` distingue original intacto, texto conservado y fragmento corregido. No se presenta un texto modificado como original histórico.

Los callables preparados son `getSourceDetails` y `changeMemory`, con Google verificado, revocación, cuenta permitida y App Check, más límites estrictos. La misma concesión de captura/consulta serializa cambios; ID/entrada estables permiten comprobar una respuesta incierta sin repetir el commit ni la IA. El token de versión cubre también cambios de fragmentos ocurridos antes de enviar. Recibos terminales de control sin texto: siete días, con caducidad lógica además de TTL. La revisión mínima `runtime/memory` invalida el contexto antiguo del chat; fuente y revisión se leen juntas.

El cliente limpia mensajes, respuestas, fuentes, borradores y generaciones después de un cambio confirmado; al volver a primer plano oculta datos anteriores hasta revalidar la revisión. Antes de enviar preserva lo recién escrito, pero descarta contexto viejo si hubo un cambio. Una respuesta tardía no restaura contenido retirado. No hay sincronización continua con otro dispositivo en primer plano ni limpieza garantizada de clientes antiguos: deben actualizarse. La corrección conserva borrador durante errores y rotación; recuperar usa exactamente la misma operación. Cancelar/volver no promete revertir un commit remoto ya iniciado.

### Evidencia fijada y proveedor real

Se congelaron siete fixtures en `tooling/k4-control-fixtures.mjs` antes de llamar al proveedor. Incluyen fuentes mixtas, negación, deseo frente a realización, fechas relativas, corrección con recepción diferente, instrucción citada no ejecutable y retirada completa. Comando explícito:

```powershell
pwsh -NoProfile -File tooling/backend-emulators.ps1 -LiveControlSmoke
```

Resultado: **7/7 casos correctos**, 36 llamadas a OpenAI, **0,13151104 USD estimados**, `gpt-6.1-sol` con razonamiento `medium`, Responses `store:false`. [Informe público sin texto](k4-control-1794659632423.json), hash del corpus `e1d50797cb7cb9267ca9f206f9dd38aec289cd8009b4f29cd25047686c2b5afb`. Replays: cero llamadas nuevas en los siete casos. La revisión posterior de fuentes y fragmentos sintéticos comprobó ausencia del dato retirado, conservación de los demás asuntos, estado/atribución/fechas y fecha nueva de la corrección. El contador previo se conservó: estimación acumulada 18,25034382 USD; **no es el saldo real de la cuenta API**. No se tocó producción ni se crearon claves.

El mismo agente de desarrollo realizó esta inspección fuera del circuito de respuesta; no hubo auditor humano independiente ni constituye garantía universal. Las comprobaciones automáticas del informe no sustituyen esta revisión de contenido. Los refinamientos posteriores de token de versión, caducidad y etiquetas de procedencia se verificaron con pruebas deterministas, sin repetir llamadas pagadas ni ajustar el corpus a resultados observados.

### Comprobaciones deterministas

TypeScript strict y formato correctos, **22/22 unidades**, **55/55 pruebas en emuladores** y dos pruebas del transporte de revisión del proveedor. Casos nuevos: retirada selectiva, preservación de otros asuntos/cuentas, corrección y fechas, revisión negativa/incompleta, versiones de fuente/fragmentos antes y durante el trabajo, concesión caducada, replay/ID conflictivo, caducidad lógica, HTTP positivo/negativo y eliminación completa sin proveedor. Se conservan los casos anteriores de captura confirmada, trabajadores antiguos, revocaciones y consultas en curso. Los fixtures de Auth se aíslan por propietario: el emulador vincula Google con el mismo correo a un mismo UID.

Compilación Android, `mobileCheck`, formato, capas, Detekt y Lint correctos; **56/56 pruebas host**. Ronda nativa final: **36/36 en Honor FNE_NX9, Android 14/API 34**, incluidos los cinco casos nuevos de selección/corrección/olvido, giro durante cambio sin duplicación, borrador/recuperación y fuente retirada durante segundo plano. También pasan teclado real y fondo/tamaño del envío. Son repositorios sintéticos inyectados, sin atribuirles Google/App Check reales. Durante la integración se corrigieron lectura de estado antiguo en navegación, visibilidad de carga/confirmación tras giro, ocultación del teclado al aplicar y resultados pendientes mientras la pantalla está oculta. Las primeras rondas fallidas no se consideran aceptación; el caso de giro restaura después la orientación para aislar los demás casos. La prueba del teclado se configura con edge-to-edge igual que MainActivity; Android 14 no lo impone como Android 16. Se conserva la comprobación de que el campo está físicamente sobre el teclado y el envío mide al menos 48 dp.

[Controles con datos ficticios](../assets/branding/kioku-source-controls-honor.png), [carga durante corrección en horizontal](../assets/branding/kioku-correction-pending-honor.png). Capturas de la raíz Compose, revisadas visualmente, sin datos del propietario ni otras apps. APK local `androidApp/build/outputs/apk/debug/kioku-k4-control.apk`, SHA-256 `268fac37e1de39a0f8679889183cb8afb93066d4ae4b335ceb7b6fac83551bf7`; no se suben binarios ni credenciales al repositorio. Instalación de pruebas mediante actualización, sin desinstalar, resetear, cerrar la sesión real o modificar ajustes globales del teléfono.

Comandos móviles: `pwsh -NoProfile -File tooling/mobile.ps1 formatKotlin :androidApp:assembleDebug :androidApp:assembleDebugAndroidTest mobileCheck`, actualización de ambos APK y runner Android completo sobre el Honor. La ronda final termina `OK (36 tests)`; no se vuelven a ejecutar pruebas de pago para confirmar cambios de presentación. Comprobador documental correcto: 65 documentos y 11 ADRs; `git diff --check` correcto y revisión semántica de contratos/estado/privacidad.

Se consultaron convenciones/calidad, ADR-011/005, modelo/retención, API, seguridad/privacidad, estado, plan y limitaciones. Antes de modificar la UI se inspeccionaron por MCP las vistas Stitch 07 y 05 y sus imágenes, sin editar Stitch. Paleta B, JetBrains Mono y pulsación por color del texto se mantienen. La adaptación con teclado y poca altura prioriza el campo y el envío, ocultando temporalmente la cabecera; vuelve al cerrar el teclado.

### Activación y límites actuales

Pendiente autorización concreta para desplegar en `kioku-9454f`, Bélgica: los dos callables nuevos, adaptación de cinco existentes y el índice estrecho `operations.pending.turn.id`. Solo las dos funciones nuevas requieren su entrada HTTPS pública de transporte; todas mantienen la autorización de aplicación. Sin otros proyectos, backups, claves o permisos de memoria para clientes. Las pruebas locales no acreditan disponibilidad del índice ni transporte/atestación nativos reales. iOS comparte UI/adaptadores preparados, pero este build necesita Mac/Xcode y comprobación propia. Tampoco se resuelve retroactivamente el reporte «debate hoy» a partir de inferencias o de esta entrega.

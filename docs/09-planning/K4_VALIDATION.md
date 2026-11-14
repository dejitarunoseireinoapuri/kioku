# K4 · Control conversacional de memoria

Rama: `codex/k4-memory-control`, desde la entrega K3 `6b264e7`. **En curso: primera frontera interna de retirada; sin activación remota ni recorrido móvil nuevo.** K3 conserva la comprobación iOS actual y la aclaración del reporte temporal pendientes. No se integran ramas en `main` por esta ejecución.

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

## Límites de entrega

Sin llamadas OpenAI, gasto API nuevo, claves consultadas, nuevos recursos o modificaciones de recuerdos productivos. No hay cambio visual/móvil: no procede afirmar pruebas nativas nuevas o instalar el mismo APK por esta frontera. El Honor queda seleccionado por el propietario para las próximas comprobaciones que sí afecten al móvil. No se valida despliegue, Google/App Check real, interpretación del proveedor, sincronización móvil o iOS.

Documentación consultada: convenciones/calidad, plan/limitaciones, evidencia K3, modelo/retención, API, seguridad/privacidad y ADR-005; SDK fijado y transacciones de Firestore. No se precisa acceso visual a Stitch porque este bloque no modifica interfaces. La continuación no cierra K3 ni K4 automáticamente.

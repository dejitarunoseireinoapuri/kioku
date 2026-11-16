# R2 · Simulación local y validación con límite de 15 USD

Autorización del propietario del 16 de noviembre de 2026: continuar con simulaciones locales primero, Sol alto para llamadas reales, solo casos ficticios y **como máximo 15 USD adicionales**. Si se alcanza el límite se detiene la admisión de llamadas y se documenta lo pendiente. No autoriza recuerdos reales, Firebase, app, despliegue, publicación ni main.

## Límite previo a las llamadas

Baseline R2 **92,8418 USD** gastados y **1,78895 USD** de reserva incierta histórica. `local-data/r2/authorized-budget.json` fija `bounded-v9`, baseline y 15 USD adicionales. El techo agregado de gasto más reservas es **109,63075 USD**; incluye reservas en vuelo y nueva incertidumbre. No reinicia el gasto ni descuenta las reservas antiguas. Todos los ejecutores R2 cargan ese techo y cada llamada reserva antes de salir; cambiar de ejecución o elevar el límite por ronda no lo amplía. Sin el archivo autorizado, el ejecutor reservado de esta tarea no arranca. Un ledger ausente con autorización activa falla cerrado.

Se mantienen los avisos de cada 10 USD desde el contador previo **79,45451 USD**: el primer aviso ya se entregó; el próximo corresponde al acumulado R2 **99,45451 USD**. Este contador no se reinicia por el nuevo límite. Costes estimados con las tarifas locales registradas y reservas conservadoras por llamada, no una lectura de saldo o factura. M0 permanece separado.

## Simulaciones y ajuste previo

Las métricas de la pasada anterior muestran mediana aproximada de 9 s en generación de interpretación y 3,2 s en su revisión; no se atribuye toda la latencia a un único componente. El ajuste elimina únicamente las listas de índices de tokens duplicadas en la entrada del revisor. Este sigue recibiendo la entrada exacta, propuesta con literales expandidos, evidencia antigua literal, calendarios, contexto y candidatos. La generación conserva índices; no cambia el esquema, el razonamiento alto ni los revisores.

Tres pruebas nuevas simulan captura/aclaración/corrección con respuestas fabricadas, verifican igualdad del resto de los datos, rechazo de revisión, límites corruptos sin reintentos y límite monetario con llamadas concurrentes y reservas inciertas entre ejecuciones. Son dobles, no llamadas al modelo ni evidencia de su calidad o velocidad. Pasan junto con la batería de **234 pruebas raíz** y TypeScript del núcleo antes de pagar.

Piloto real expuesto i12/i31/i43/i51/i61/i62: **6/6**, 72 llamadas y **0,4838925 USD**. No aumenta la incertidumbre. No es comparación controlada de latencia ni reserva nueva; no acredita por sí solo una mejora de velocidad.

## Protocolo de reserva previa a las respuestas

`bounded-v9`, j01–j60, manualmente elaborada en esta tarea: diez familias de seis casos, seis correcciones, siete repeticiones, cuatro aclaraciones (dos tardías), dos cruces de zona/fecha, una cita con instrucciones que deben tratarse como datos, un olvido intermedio, uno total, una dependencia con alcance adicional expresamente autorizado y una pregunta de realización que no puede deducirse de un acuerdo. **250 consultas previstas por ronda**. Se comprueba que los relatos no coincidan con los corpus anteriores. Las familias continúan estructuras previas; no es muestra aleatoria ni auditoría externa.

Expectativas escritas antes de observar salidas: significado, soporte propio, modalidad, tiempo, atribución, condición, polaridad, relaciones, citas de consulta y conjunto retirado/conservado. No se envían al modelo. Código, corpus y perfil se congelan en commit y huella antes de la primera ronda. Tres rondas desde RAM vacía, mismo código y sin ajustes entre ellas, subconjuntos ni cuarta ronda. Se conservan todos los fallos; no se reintenta la inferencia. Si el límite o transporte impiden completar, la reserva queda incompleta, no aprobada. No se gasta el resto por obligación.

Criterios heredados sin relajar: ≥95 % global y por familia en cada ronda (con seis por familia exige 6/6), cero críticos; p95 captura/corrección ≤15 s y consulta ≤8 s. Olvido RAM no acredita servidor/app. Cualquier ajuste guiado por j lo convierte en regresión, sin recalificar rondas. El presupuesto limita la validación, no permite afirmar un cierre sin evidencia.

Comandos: `node --env-file-if-exists=.env.local prototypes/memory-core/evaluation/bounded-run.ts --live --round 1`, después `2` y `3`; no sobrescriben reportes. Comprobaciones locales: `node tooling/m0.mjs core:check`, `test`, `format:check` y `pwsh -NoProfile -File tooling/check-docs.ps1`.

Fuentes consultadas: AGENTS, convenciones, calidad, guía de desarrollo, criterios R2 del plan de reconstrucción, validación previa con Sol alto, proveedor/interpretación/presupuesto y pruebas existentes. Se reutiliza la credencial existente sin mostrarla ni copiarla. Sin cambios de producto, contrato desplegado ni UI.

# Prototipo R1 · Núcleo de memoria v2

Motor aislado de reglas con interpretaciones **ficticias ya preparadas**. Implementa la primera prueba determinista del [diseño aceptado](../../docs/02-architecture/MEMORY_CORE_V2.md), sin Firebase, OpenAI, credenciales, archivos de recuerdos o conexión con la app. No es todavía un intérprete de lenguaje natural ni un backend publicable.

## Ejecutar desde la raíz

Usa Node 24 y las dependencias fijadas que ya utiliza M0; no añade paquetes. No carga `.env.local` ni lee configuraciones personales.

```powershell
node tooling/m0.mjs core:check
node tooling/m0.mjs core:test
node tooling/m0.mjs core:format:check
node tooling/m0.mjs core:demo
```

La demo usa únicamente fixtures incluidas: guarda dos planes, corrige uno manteniendo su fecha, comprueba evidencia, lo olvida y verifica que el vecino permanece. Imprime contadores/estados, no textos ni claves. Todos los datos desaparecen al terminar el proceso. No acepta rutas, entradas personales o parámetros de producción.

## Qué comprueba

- Identidad estable de unidades, fragmentos literales y contexto compartido con propietarios explícitos; sin copia completa paralela del relato.
- Cobertura y posiciones UTF-16 exactas, límites, fechas válidas y evidencia temporal propia; no cortar un par sustituto de Unicode ni una cita principal entre dos unidades independientes.
- Captura idempotente y repeticiones ya identificadas: nueva evidencia para la misma unidad, no otro recuerdo que descubrir al borrar.
- Corrección de una identidad y todos sus soportes, con conservación explícita de tiempo no editado; valor erróneo excluido también del texto de la edición. Vecinos conservan contenido, ID y fecha.
- Enriquecimiento temporal compatible de la misma identidad sin borrar soportes anteriores. Su alcance inicial es fecha desconocida → conocida y año/mes → precisión más concreta compatible; no un enriquecimiento universal de cualquier campo.
- Dependencias y posibles duplicados resueltos antes de preparar un borrado. Un vecino realmente dependiente exige selección explícita; una posible coincidencia puede incluirse o excluirse expresamente. No hay fusión por similitud de palabras.
- Confirmación/cancelación, comparación de época, versiones y membresías, recibos sin texto, admisiones duraderas en el almacén RAM y revocaciones sin contenido. Un replay tras caducar el recibo no repite la escritura.
- Fallos inyectados antes/después del commit, recuperación de resultado y datos antiguos no recuperables. Autorización de actor simulado comprobada también al confirmar y recuperar.
- Pruebas con red de inferencia indisponible: lectura de detalles y olvido resuelto no dependen de un proveedor.

El índice de R1 solo contiene términos derivados para comprobar que se actualizan/retiran; **no** acredita recuperación semántica. `evidence` entrega soportes por IDs actuales y un token privado de comprobación, con alcance conservado en el servicio. `revalidate` no confía en referencias alteradas por su consumidor; el token es de un uso y caduca.

## Modelo y frontera del prototipo

`contracts.ts` define comandos estrictos `capture`, `correct`, `enrich` y `forget`. Un `Draft` es una interpretación revisada que **R2 todavía debe producir y verificar**: la validación estructural no demuestra que sus palabras sean fieles, que una fecha relativa esté bien resuelta o que dos paráfrasis signifiquen lo mismo. El módulo no se importa desde los callables actuales.

`prepare` valida y crea una transición privada; `commit` compara época y aplica esa transición atómicamente en `InMemoryStore`. Son dos pasos internos, no dos aprobaciones del propietario. Captura/corrección claras deberán confirmarse automáticamente; solo olvidar espera el popup. El plan público no incluye delta, textos antiguos o permiso de ampliar el alcance. `cancel` retira la preparación. La pérdida de respuesta requiere consultar `operation`, no inventar otro ID.

El almacén mantiene únicamente unidades actuales, sobres de fuente sin texto completo, fragmentos, ocurrencias, relaciones, proyecciones, admisiones/recibos y revocaciones. Las posiciones pertenecen al texto exacto admitido: UTF-16, inicio incluido y final excluido; una fuente modificada puede tener huecos. `timeEvidenceId` liga el anclaje original a un fragmento temporal separado que una corrección puede conservar. Las aclaraciones de lenguaje y sus pendientes no se implementan en R1.

Las relaciones conocidas no desaparecen por editar texto: se conservan salvo una retirada explícita de relaciones salientes del objetivo revisada por el futuro adaptador semántico. No puede quitarse una relación ajena. Una dependencia entrante que afectaría a otro dato devuelve `needs_scope` sin mutación; la edición coordinada de varios dependientes queda para concretar en R2/R3.

La clase de almacenamiento es un simulador síncrono de CAS en RAM, con snapshots defensivos e inyección de fallos. La comparación/invariantes son reutilizables, pero el backend futuro debe aplicar lecturas/escrituras acotadas en una transacción real: **no** copiar todo el almacén ni estos snapshots a Firestore. La clave HMAC efímera de la fixture solo liga entradas y recibos del simulador; no es una clave API ni prueba de gestión de claves duradera en producción.

Cada fuente distingue captura, corrección o enriquecimiento. Un soporte temporal conservado tras corregir no cuenta como si el nuevo dato se hubiera contado otra vez: `mentionCount` cuenta solo ocurrencias con evidencia principal. Una ocurrencia puede seguir respaldando únicamente la fecha original. El esquema de este prototipo no importa ni convierte snapshots M0 anteriores.

## Límites y evidencia

Cotas deliberadas del simulador: 256 unidades activas, 4096 documentos de catálogo/metadatos, ocho preparaciones y ocho comprobaciones de evidencia simultáneas. Conserva 8000 caracteres/ocho unidades por turno; hasta 32 unidades y 128 ocurrencias por cierre, 400 escrituras y 2 MiB estimados. La admisión comprueba que no vuelve ingobernable una identidad. Al alcanzar un límite se rechaza sin cambios, no se trunca ni crea una identidad falsa. Las cotas de catálogo y el recorrido completo en RAM **no son una decisión de capacidad de la app**; la escala 100/1000/10 000 y el adaptador real siguen en R2/R3.

Evidencia: [R1_VALIDATION](../../docs/09-planning/R1_VALIDATION.md). 50 casos de prueba, incluyendo 80 secuencias con semilla y 1600 pasos contra un oráculo de unidades independiente de las funciones de transición. Un paso puede ser captura, corrección, olvido o replay; no son 1600 relatos independientes ni la reserva semántica de R2. Los ejemplos y metadatos son ficticios.

R1 no acredita extracción, evaluación con Sol, búsqueda natural, ciclos de aclaración, seguridad Firebase/Google/App Check, persistencia tras reiniciar el proceso, concurrencia distribuida, rendimiento productivo, Android/iOS o migración. Se prueban sus fronteras lógicas y simulaciones, sin presentarlas como esas integraciones. Próximo paso: R2 con corpus semántico reservado y presupuesto acordado, siempre con datos ficticios.

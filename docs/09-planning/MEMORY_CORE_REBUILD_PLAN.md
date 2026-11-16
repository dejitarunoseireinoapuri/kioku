# Reconstrucción del núcleo de memoria · R0–R6

**Estado vigente R2, 16 de noviembre:** precisada la distinción entre fecha de compra/reserva y fecha objetivo. Regresión final **60/60**, **250/250 consultas**; contrastes temporales **8/8** y **238 pruebas raíz / 136 del núcleo** correctos. Gasto de esta continuación **22,240815 USD de 25**, conservando el mínimo de saldo pedido. **R2 abierta**: p95 captura/corrección **18,41/18,43 s** frente a 15 s, y falta reserva independiente de la versión final. La reserva anterior obtuvo 60/60, 59/60 y 60/60; no se recalifica. [Evidencia, límites y pendientes](R2_BOUNDED_VALIDATION.md). Solo casos ficticios y commits locales; sin recuerdos reales, app, Firebase, despliegue, push ni main.

Histórico — continuación anterior. Resultado vigente R2: corregidas agrupación y aclaración; regresión dirigida 6/6 y completa 60/60. La nueva reserva ficticia con Sol medio obtiene **52/60, 53/60 y 53/60**, sin cambios entre rondas. Quedan incidencias de citas/repetición/contexto y limitaciones del oráculo, conservadas sin recalificar. 110 pruebas locales correctas; [informe, costes y continuaciones autorizadas](R2_GROUPING_VALIDATION.md). **R2 sigue abierta; no se avanza a R3 ni voz.** App, Firebase y recuerdos reales intactos. El propietario autoriza como máximo dos tareas adicionales y suspender el PC al terminar la última.

Evaluaciones anteriores: [rechazos y falsas ausencias](R2_RELIABILITY_VALIDATION.md) y [evidencia indexada](R2_INDEXED_VALIDATION.md). Las cifras de las continuaciones siguientes son históricas; el resultado vigente y los bloqueos de cierre constan arriba.

**Continuación autorizada y ejecutada:** R2 con Sol medio corrige conservación literal en ediciones parciales y evalúa otra reserva: 54/60, 55/60 y 54/60. Ajuste final con cuatro regresiones correctas y doce historias nuevas correctas, sin otra reserva completa de esa versión; [protocolo, costes, defectos y resultados](R2_RETENTION_VALIDATION.md). No cambia permisos sobre datos personales/producción ni autoriza avisos por correo. R2 sigue abierta; R3–R6 permanecen pendientes.

Fecha: 2026-11-16. Estado: **P1–P3 aceptadas; prototipo determinista y pruebas ficticias R1 implementados**. El propietario autoriza este bloque sin tocar recuerdos reales. [Evidencia y límites](R1_VALIDATION.md). No autoriza inferencia con datos personales, migración o despliegue; R2–R6 siguen pendientes.

Dirección: [MEMORY_CORE_V2](../02-architecture/MEMORY_CORE_V2.md) y [ADR-012](../02-architecture/ADR/ADR-012-independent-memory-units.md). La [matriz de pruebas](../06-quality/TEST_MATRIX.md) identifica sus casos. Los contratos activos permanecen en [datos](../03-data/DATA_MODEL.md) y [API](../04-api/API_CONTRACT.md) hasta su sustitución expresa.

## Resultado buscado y orden

Primero demostrar, sin app ni datos reales, que el mismo conjunto de recuerdos se guarda, consulta, corrige y elimina sin romper sus vecinos. Después integrar Firebase y el móvil. Solo entonces preparar la transformación de los datos existentes. K5 (voz) queda detrás de esta validación: añadir voz al núcleo actual no resuelve la gestión de evidencia compartida.

No rehacer acceso, identidad, secretos, Compose o el diseño Matrix. No cambiar silenciosamente Sol medio en la API. La elección de Astra muy alto para diseñar no modifica benchmarks históricos ni el modelo del producto. Se conserva la aceptación histórica de K4, con esta incidencia y revisión abiertas por separado.

| Paso | Entregable revisable | Puerta de salida |
| --- | --- | --- |
| R0 · Contrato de comportamiento | Decisiones P1–P3, ejemplos y rúbrica antes de medir | Aceptado expresamente por el propietario |
| R1 · Modelo y motor puro | Tipos, validadores, planes y mutaciones en memoria con datos ficticios | Motor/contratos locales probados; especificación de transporte definitivo pendiente, sin proveedor ni Firebase |
| R2 · Interpretación y evaluación | Adaptador IA acotado y corpus completo de ciclos de vida | Reserva independiente, tres rondas, sin fallos críticos |
| R3 · Backend y app | Esquema/versiones v2, adaptadores, API y UX sobre emuladores | Seguridad, concurrencia, recuperación y Honor con fixtures |
| R4 · Ensayo de migración | Migrador con comprobación previa y simulación de cortes; inventario real solo si se autoriza | Mapeo completo, preservación, limpieza y reinicio demostrados |
| R5 · Activación controlada | Despliegue compatible, mantenimiento, migración y retirada del esquema anterior | Un único núcleo vigente, datos conciliados y cero rutas al contenido retirado |
| R6 · Aceptación y cierre | Recorrido real Honor y evidencia consolidada | Propietario acepta y criterios objetivos superados; después K5 |

No se fijan días ni presupuesto final sin medir R1/R2. Un paso puede descubrir que hay que revisar la propuesta. Un incumplimiento no se oculta ampliando reintentos o sustituyendo la reserva por casos más fáciles.

## Alcance sobre lo que ya existe

| Pieza actual | Tratamiento previsto |
| --- | --- |
| Cuenta, Google/App Check, permisos y secreto | Conservar; ampliar solo las comprobaciones de esquema/generación necesarias para la transición |
| Motor de extracción/revisión, tiempo y recuperación de M0/K2/K3 | Reutilizar utilidades verificadas detrás de contratos nuevos; no dar por válida la representación v4 de citas por pasar tests históricos |
| Fuente completa y unidades identificadas por fuente/posición | Sustituir por identidades estables, evidencia segmentada y ocurrencias; migración explícita |
| `selectiveChange` y recorte de coincidencias literales | Retirar de la ruta v2: la propiedad de fragmentos determina el cambio, sin regenerar relatos ajenos |
| `ForgetRepeatedMemory` y revisión global durante el olvido | Sustituir por membresías/dependencias preparadas, alcance resuelto y commit sin IA; no quitar controles dejando la representación antigua |
| Tiendas transaccionales, recibos y revocaciones | Conservar garantías y patrones probados, adaptar el esquema y ampliar tests; no reutilizar precondiciones ligadas solo al relato |
| UI, repositorios y ViewModels | Mantener aspecto/recorridos; adaptar referencias por unidad, tickets, estados seguros y recuperación sin reenvío |

Mientras exista compatibilidad v1, las dos rutas deben estar separadas por esquema y pruebas. No dejar una cadena de fallbacks entre motores ni convertir el legado en una excepción permanente de v2.

## R0 · Acordar lo que significa cada acción

Estado actual: P1–P3 aceptadas expresamente por el propietario. Las siguientes decisiones describen el objetivo autorizado del prototipo.

- P1: evidencia original en fragmentos con contexto, sin copia monolítica paralela; tras una edición/olvido no se conserva un «original completo» oculto. Feed original RAM sin cambios respecto a lo solicitado.
- P2: alcance explícito por identidad, repeticiones vinculadas y dependencias resueltas; no promesa imposible de todas las paráfrasis desconocidas. Aclarar candidatos reales antes del popup.
- P3: corregir toda la identidad errónea; conservar evolución temporal como hechos distintos. Preguntar solo si esa diferencia o sus dependencias no están claras.
- Preparar ejemplos ficticios de cada caso y resultados esperados de captura, consulta, edición y olvido. Incluir una unidad indivisible y condiciones reales, para no reducir «atómico» a «una oración».

La aceptación del propietario resuelve P1–P3. No volver a pedirlas al implementar el prototipo y sus pruebas ficticias. Un cambio de ese comportamiento sí requiere concretarlo antes de implementarlo. La autorización no alcanza recuerdos reales o producción.

## R1 · Modelo puro, sin proveedor ni cambios remotos

Crear un paquete pequeño con frontera portable TypeScript y repositorio en memoria. No duplicar toda la app ni convertir el prototipo histórico M0 en el esquema v2 por un cast. Reutilizar utilidades de tiempo/validación que conserven los contratos, manteniendo pruebas anteriores.

Entregas:

1. Esquemas estrictos de unidad, ocurrencia, fuente segmentada, relaciones, revisión, revocación y recibo. Fijar convención de posiciones Unicode y límites de tamaño/fan-out.
2. Constructor de evidencia desde la entrada exacta; validación de cobertura, propiedad y referencias. Cita amplia compartida por hechos independientes rechazada, contexto común permitido y explícito.
3. Funciones puras para preparar/aplicar corrección y olvido sobre un alcance ya resuelto. Generan lista exacta de escrituras y lecturas de precondición. No búsquedas de texto para borrar coincidencias.
4. Identidad estable y membresías versionadas. Repetición confirmada, coincidencia dudosa, evolución y dependencia son clases distintas. La estructura del grafo debe ser acotada y su recorrido detectar ciclos.
5. Estado de operación, códigos seguros y protección de replays después de caducar recibos. Selección de hashes/digests privados sin publicar huellas de contenido.
6. Contrato API v2 definitivo: DTO, límites, estados, alcance del popup, referencia de versión, comprobación de operación y compatibilidad. Publicarlo en DATA_MODEL/API_CONTRACT; no reutilizar `sourceId` como si fuera `memoryId`.

Salida: tests generativos con semillas reproducibles y casos límite prueban que todo cambio confirmado conserva exactamente las unidades ajenas, que todos los objetos sensibles del objetivo desaparecen y que no hay resurrección tras replays/jobs. Leer Gestionar y olvidar una selección resuelta funcionan con un adaptador IA que falla ante cualquier invocación.

## R2 · Interpretar bien antes de conectar la app

Integrar Sol medio mediante la frontera de credenciales vigente y presupuesto explícito. Usar únicamente entradas ficticias, almacenamiento aislado y reserva distinta de los ejemplos usados para ajustar. Las llamadas reales tienen coste; registrar contador, configuración y tope antes de ejecutar sin reiniciar estimaciones anteriores.

La extracción devuelve evidencia/relaciones propuestas; el código materializa literales y valida. Una revisión de fidelidad contrasta todos los detalles relevantes. La revisión produce motivos cerrados y no decide permisos. La corrección interpreta solo la unidad objetivo y el texto nuevo con su contexto necesario. La consulta recupera evidencia de unidades actuales; no recibe el antiguo relato completo por comodidad.

Evaluar también repeticiones y coincidencias no recuperadas, falsos positivos de fusión, condiciones, atribución y detalles ausentes del resumen. No evaluar solo que la tarjeta parezca corta. Inyectar rechazos del proveedor/formato, medir aclaraciones innecesarias y bucles de reformulación. No añadir reintentos automáticos para forzar aprobación.

Salida: criterios de evaluación de este documento superados con informes por caso, errores conservados, coste y latencia. Si no supera R2, revisar modelo/evidencia antes de conectar el nuevo núcleo al almacenamiento real. Una evaluación LLM de sus propias respuestas no basta como juez final.

## R3 · Integración local y compatibilidad

Implementar primero el backend v2 con emuladores aislados, después los repositorios/domain/ViewModels y UI necesarios. Conservar firma, cuenta e instalación del Honor. La prueba de UI usa fixtures o backend de prueba explícito; no crea recuerdos personales sin autorización.

### Contrato de transporte a concretar en R1

| Operación conceptual | Entrada/resultado relevante |
| --- | --- |
| Capturar/aclarar | ID idempotente, texto/canal/zona; devuelve estado de operación y referencias a unidades confirmadas |
| Consultar | Pregunta/contexto RAM; responde con unidades/revisiones/evidencia vigente, en segunda persona |
| Obtener detalles | IDs de unidades, agrupación opcional por intervención; lectura sin IA de contenido actual en primera persona |
| Corregir | ID/revisión, texto nuevo, instante/zona de edición; interpretación previa, resultado sin confirmación redundante si claro |
| Preparar olvido | IDs/revisiones; alcance completo, dependencias/candidatos, ticket opaco y caducidad; todavía sin borrar |
| Confirmar olvido | Ticket ligado a cuenta, alcance/versiones y operación; solo tras popup; cero IA en commit |
| Consultar operación | ID; processing/committed/not_applied/clarification según evidencia del servidor, sin texto viejo |

Los nombres HTTP finales no están decididos. Puede reutilizarse un endpoint con versión explícita si no cambia silenciosamente el contrato antiguo. El servidor valida el ticket, no confía en listas/deltas del cliente ni en un booleano `confirmed` como autorización suficiente. El popup es protección de interacción del cliente autorizado; no prueba criptográficamente lo que una persona vio.

Las rutas antiguas deben comprobar `schemaVersion`, generación y modo de mantenimiento al comenzar y al confirmar. Después del cambio, un cliente antiguo recibe «Actualiza Kioku» y **no** usa el núcleo anterior como fallback. Rechazar `apiVersion` desconocida y campos extra. Gestionar por ID actual no redirige una referencia retirada a otra identidad.

### Comprobaciones de integración

- Transacción y recuperación ante caída antes/después del commit; doble pulsación, reintento tras caducidad, revocación de cuenta, nonce antiguo, nuevo soporte durante popup y consulta concurrente al olvido.
- Canónico y proyección coherentes; no basta con que la búsqueda devuelva vacío: inspeccionar todas las colecciones/pendientes con fixtures identificables y verificar ausencia del contenido retirado.
- El alcance ajeno conserva contenido, tiempo, atribución e IDs. Un límite de documentos/bytes aborta el conjunto sin truncar ni culpar a la red.
- Popup y feed cumplen contratos actuales; mutación se queda en Gestionar, avisos con X/Y solo RAM, fichas históricas sin acciones, teclado/rotación, estado recuperable y cuenta/generación.
- Google/App Check/reglas positivas y negativas se validan localmente; pruebas nativas reales y de proveedor se registran por separado.

Salida: controles configurados de TypeScript, formato, emuladores, Kotlin/arquitectura/Detekt/Lint y tests afectados sin errores. No ampliar pruebas mecánicamente a módulos ajenos. iOS comparte contratos pero su build/ejecución requieren Mac y quedan pendientes por decisión del propietario.

## R4 · Preparar la migración sin arriesgar recuerdos

Primero probar el migrador con un conjunto legado ficticio que incluya todos los estados históricos: originales, restos, correcciones, citas amplias, fechas antiguas, recibos caducados, fuentes revocadas y capturas pendientes. Una fuente revocada o un respaldo ya retirado no se vuelve a extraer.

El migrador no trata una fuente conservada tras un cambio como si fuera un original intacto. Reutiliza el canónico vigente y la evidencia todavía autorizada; no deriva una historia anterior desde avisos o recibos. Todo soporte nuevo enlaza a su procedencia vigente, conserva fecha/zona/evento y se coteja con las unidades actuales. Relaciones ambiguas impiden aprobar ese lote.

Ensayo sin escritura: transformar en RAM, comparar inventario de significados, identidades, fechas, modalidades y atribuciones y detectar pérdida/adición. Los números de filas pueden cambiar por repeticiones; igualdad de recuentos no prueba preservación. Informe exportable solo de metadatos/IDs opacos y discrepancias tipadas; texto real, si se autoriza, únicamente en un visor privado transitorio para revisión del propietario, no logs ni Git.

Antes de cualquier ensayo con datos reales, pedir autorización concreta para leer el inventario necesario y, si hace falta resegmentarlo/revisarlo, enviarlo a OpenAI. Explicar que sería reanálisis de datos existentes, qué alcance tiene y su coste; la autorización del diagnóstico anterior de un recuerdo no cubre este trabajo. Esta ejecución documental no lee de nuevo producción ni envía recuerdos al proveedor.

Salida: migración ficticia completa, cortes simulados en cada etapa y capacidad de reanudar desde checkpoints sin duplicar/reintroducir. Inventario productivo, tamaños, índice listo y propuesta de activación revisables antes de pedir permiso para escribir. Ningún dato real se transforma «al abrir Gestionar».

## R5 · Activar con un único estado autorizado

La acción exacta de despliegue, nuevos endpoints/IAM/índices si hacen falta, migración y tratamiento de staging se solicita cuando estén concretados. Mantener el mismo proyecto/región; no crear segundo proyecto, claves, backups o copias históricas por defecto.

Secuencia propuesta para la cuenta personal, aceptando una ventana de mantenimiento visible:

1. Desplegar primero la compatibilidad de esquema/mantenimiento en **todas** las rutas y trabajadores antiguos, aún sirviendo v1. Probar rechazos/generaciones antes de migrar. Si no puede impedirse una escritura v1, no empezar.
2. Activar mantenimiento: impedir nuevas escrituras/consultas personales, invalidar tickets/leases viejos y esperar su vencimiento o cierre verificable. Avisar de pendientes no guardados y resolver su política; no convertirlos en recuerdos ni perderlos en silencio. La ventana es temporal, con estado comprobable, no una carga infinita en la app.
3. Tomar manifiesto de fuentes/unidades vigentes, versiones, revocaciones y época. Preparar v2 en un espacio de staging privado, con esquema/generación propios, inaccesible a consultas normales. Comparar antes de retirar v1. No es doble escritura de nuevas entradas: durante mantenimiento no se admiten.
4. Validar cobertura, invariantes, equivalencias autorizadas, proyecciones/índices y consultas previstas. Si algo no coincide, descartar staging y salir de mantenimiento con v1 intacto. No declarar fallido un dato real ni eliminarlo para que el inventario cuadre.
5. Con manifiesto validado y alcance autorizado, entrar en fase irreversible de sustitución: promover por lotes acotados, retirar fuentes/proyecciones/pendientes v1 y conservar sus revocaciones. Checkpoints sin contenido y precondiciones permiten reanudar. Durante todo el proceso el producto sigue en mantenimiento, sin lecturas de un conjunto mixto.
6. Verificar que no quedan copias v1, staging textual, índices viejos utilizables, operaciones capaces de reintroducirlos o referencias colgantes. Activar atómicamente el puntero de esquema/generación v2 y reabrir solo clientes compatibles. La memoria no se sirve parcialmente migrada.
7. Probar con datos ficticios autorizados, retirar únicamente esos datos y conciliar el inventario real por versiones/manifest. Revisar privadamente las comprobaciones del propietario sin publicar su contenido.

El staging temporal es sensible, no un backup para volver a días anteriores: plazo máximo propuesto 24 h, limpieza explícita al abortar/completar y acceso restringido al migrador. Si falla su limpieza, no abrir el sistema ni anunciar terminada la migración. El checkpoint debe distinguir staging descartable de datos v2 ya promovidos: **un TTL nunca podrá borrar el único canónico válido**. La política física exacta y el límite de la ventana se fijan en el ensayo R4 antes de autorizarlo.

Cada lote que retire contenido v1 debe confirmar atómicamente su reemplazo v2 validado, sin caducidad, y el checkpoint correspondiente; se releen versiones del manifiesto y autorización en ese commit. Una preparación que desaparezca por caducidad antes de promoverse no autoriza borrar su origen. Los datos promovidos usan identidades v2 y conservan mapeo mínimo de migración/revocaciones, sin convertir IDs antiguos en atajos de lectura. Un fallo posterior deja un estado duradero reanudable, nunca una única copia expirable.

Reversión honesta: antes de retirar v1 se puede abortar y borrar staging. Después de iniciar su retirada, se reanuda/repara hacia v2; no se restaura una copia antigua ni se vuelve al código v1 que ignora las revocaciones. Un rollback de binario posterior solo puede usar una versión compatible con el esquema v2. Sin backups históricos no existe recuperación garantizada de datos perdidos por un migrador defectuoso: de ahí la revisión previa, los ensayos con cortes y la autorización antes de la fase irreversible.

## R6 · Aceptación y paso a voz

Completar en Honor: relato con varios asuntos/fechas → consulta → corrección aislada → consulta actualizada → repetición del mismo dato → olvido confirmado → ausencia correcta → vecino intacto. Añadir otro evento parecido que debe conservarse, una condición y una aclaración. Probar cierre/reapertura, red perdida durante confirmación y recibo sin nueva escritura. No reutilizar el recuerdo real fallido como fixture o borrarlo sin autorización.

Cerrar solo cuando se cumplen la rúbrica y las pruebas locales/remotas acordadas, la limpieza de datos de prueba y la conciliación de los reales, y el propietario acepta el recorrido. Registrar commit, comandos, plataforma, modelo, costes y límites; conservar también intentos fallidos. Entonces integrar la rama de implementación en main según autorización y empezar K5 sobre estos mismos casos de uso, sin otro motor especial para voz.

iOS nativo no es bloqueante por la decisión actual del propietario, pero sigue expresamente no validado. La compatibilidad de DTO/dominio/estado compartido sí entra en R3; una futura prueba iOS debe instalar cliente v2, no permitir escrituras por un protocolo retirado.

## Rúbrica fijada antes de implementar

El detalle de casos vive en TEST_MATRIX; estos son los criterios de avance propuestos, no resultados. R0 puede ajustarlos con el propietario antes de medir.

### Invariantes deterministas

Cero fallos admitidos en pérdida de datos ajenos, contenido retirado recuperable, acceso entre cuentas, ampliación de alcance, éxito sin commit, doble aplicación y resurrección por reintento/job. Ejecutar tests unitarios/generativos y emuladores con fallos en cada frontera. El conjunto incluye también documentos con índice atrasado, dependencias cíclicas, fan-out máximo y byte límite. Comprobar que una nueva repetición no puede superar la capacidad de gestión futura, que un enriquecimiento solo cambia campos respaldados y que el texto de una corrección no conserva el valor que está sustituyendo. Un porcentaje global alto no compensa una violación.

El 100 % de los olvidos explícitos con estructura válida, alcance resuelto, dentro de cotas y sin fallo de transporte debe terminar sin IA ni rechazo semántico. Las lecturas de Gestionar también tienen cero llamadas IA. Son propiedades comprobables con un proveedor que falla si se lo invoca, no objetivos estadísticos del modelo.

### Calidad semántica y uso completo

Preparar al menos 60 escenarios ficticios independientes y 120 consultas, con un mínimo de seis escenarios por familia relevante (pueden pertenecer a varias). Separar ajuste/regresión y una reserva nueva. Tres ejecuciones completas desde almacén vacío, misma configuración, sin ajustes entre rondas.

Familias: asuntos independientes, marcos compartidos, condiciones, atribución/citas, tiempo/zonas/precisión, paráfrasis/duplicados, homónimos/eventos parecidos, corrección/evolución, faltas/reformulación, olvido con contexto y consultas posteriores. Incluir frases no anticipadas por las instrucciones y detalles que una tarjeta resumida podría omitir.

Cada escenario especifica antes de ejecutarse unidades/soportes esperados, relaciones, consultas, cambio, conjunto eliminado y vecinos conservados. Medir por separado fidelidad/cobertura de captura, precisión y recuperación de identidad, recuperación de evidencia, respuesta, pertinencia de aclaraciones y cierre del ciclo completo. Objetivo: al menos 95 % global y en cada familia aplicable por ronda, con denominadores y tamaños de muestra visibles. No presentar porcentajes pequeños como fiabilidad universal.

Fallos críticos bloqueantes: inventar datos, elevar deseo a realizado, fusión que cambia/borraría otro evento, perder una condición, borrar contenido no elegido, mostrar el retirado, ejecutar instrucciones citadas o convertir preguntas en hechos. Una negativa innecesaria es fallo de disponibilidad registrado, no éxito por «prudencia». Revisar salidas contra los resultados esperados fuera del circuito de generación; documentar adjudicaciones, no aceptar únicamente el juicio del modelo.

Si se modifica usando un caso reservado, pasa a regresión y se renueva la reserva. Medir también fallos de reconocimiento de copias: no ocultarlos porque el borrado de los IDs conocidos sea determinista.

### Rendimiento y coste

Medir preparación/IA/commit por separado, llamadas, tokens, coste estimado, p50/p95 y errores. Objetivos iniciales a contrastar: lectura de Gestionar y olvido explícito resuelto p95 de servidor ≤3 s en ejecución caliente; captura/corrección ≤15 s; consulta ≤8 s. Excluir espera humana, informar aparte arranque frío y recorrido móvil completo. No prometer esos tiempos al propietario antes de medir.

Probar inventarios sintéticos de 100, 1000 y 10 000 unidades con repetición y contextos distribuidos; medir coste de admisión/reconciliación y recuperación además del commit. Si una escala rebasa límites, declararla no soportada antes de habilitarla; un truncado silencioso no es una optimización. Presupuesto por ronda y coste máximo de llamadas fijados antes de la evaluación real.

## Historia de la entrega documental y continuación

La entrega de diseño se contrastó con el código de olvido/selección, datos/API, producto, privacidad/retención, ADR-005/011 y documentación oficial de Firestore enlazada. No leyó de nuevo producción ni cambió código. Tras aceptar P1–P3, el propietario autoriza el prototipo: [R1_VALIDATION](R1_VALIDATION.md) registra las pruebas locales nuevas y distingue el motor determinista de la interpretación pendiente de R2. La app, producción y recuerdos reales siguen sin cambios.

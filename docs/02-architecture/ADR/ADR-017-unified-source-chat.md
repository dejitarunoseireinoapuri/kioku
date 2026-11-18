# ADR-017 · Chat único para recuerdos y fuentes

- Estado: aceptada, implementada en `codex/shared-sources` y activada en servidor/Honor con autorización del propietario; PDF ficticio comprobado sin API, inferencia real pendiente.
- Fecha: 2026-11-18.
- Sustituye el recorrido de biblioteca con preguntas y selector de [ADR-016](ADR-016-shared-reference-sources.md). Conserva extracción, almacenamiento y seguridad.
- Evidencia: [validación de chat único](../../09-planning/UNIFIED_SOURCES_VALIDATION.md).

## Contexto y decisión

El propietario quiere compartir un PDF desde Drive u otra app y preguntarle desde el chat habitual, junto con sus recuerdos. Documentos se renombra **Fuentes**: solo contiene importación mediante campo con placeholder URL y gestión. Los archivos entran exclusivamente por Compartir. No se abre Drive ni un selector desde Kioku.

MainActivity recibe cada envío como evento y vuelve a la conversación existente sin reconstruir su historial. La entrega espera a tener una sesión autorizada antes de leer el proveedor. Un aviso transitorio informa de recepción, extracción, confirmación, cobertura parcial o error; un fallo de archivo permite reintentar con su identidad. Estos avisos no son mensajes ni evidencia contextual.

La app nueva solicita `memoryV2.query` con `includeReferences:true`. El servidor combina candidatos personales y fragmentos documentales actuales en paquetes con atribución separada. El modelo devuelve índices de cada clase, nunca IDs de almacenamiento elegidos por él. El servidor valida índices, deriva referencias/citas y exige una revisión independiente. Los recuerdos siguen usando sus vistas de gestión individuales; una cita documental nunca habilita corrección/borrado de un recuerdo.

Los clientes anteriores omiten el opt-in y conservan el contrato y recorrido de consulta personal. Con catálogo documental vacío, el nuevo cliente también conserva la recuperación personal existente. No se cambia el perfil del proveedor ni se evalúa semántica real sin autorización de gasto.

Las citas del chat muestran título y abren el fragmento/localizador en un diálogo. Antes de mostrar su literal se vuelve a leer la revisión vigente del servidor; la copia en RAM no autoriza leer una fuente retirada. Se revalidan época personal y documental antes de llamadas del proveedor, tras generar/revisar y en la transacción terminal. El olvido documental incrementa también el sello de revisión compartido para invalidar contexto y acciones previas del chat, sin cambiar unidades personales.

## Alternativas y consecuencias

Una segunda conversación documental obliga a elegir dónde preguntar y dificulta relacionar documentos y recuerdos. Convertir los documentos en recuerdos personales confunde atribución y consume sus límites. Se mantiene un chat con evidencia de dos clases y almacenamiento separado.

Un catálogo grande selecciona hasta doce fragmentos; selección parcial o extracción incompleta no prueban cobertura del original ni ausencia global. Las preguntas y respuestas no se guardan como historial de servidor. Los binarios no se conservan y las fuentes son instantáneas de texto, sin sincronización automática.

No incluye vídeos de TikTok/Instagram/YouTube, OCR, acceso OAuth a Drive privado, Share Extension iOS ni evaluación con API real. El piloto aislado histórico conserva sus herramientas ficticias; no define los controles de la app productiva.

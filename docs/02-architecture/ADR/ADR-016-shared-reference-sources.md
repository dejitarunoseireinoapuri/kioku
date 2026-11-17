# ADR-016 · Fuentes de referencia compartidas

**Decisión posterior:** preparar la integración en Kioku habitual con Firestore real y consultas API mediante el proveedor protegido actual, conservando solo texto. Receptor y callable productivos preparados, sin despliegue/instalación de esta revisión; Honor no se utiliza después de la orden nocturna. Las validaciones siguen sin API y con datos ficticios. La biblioteca documental consulta separadamente sus fuentes; consulta conjunta, sincronización, Drive privado e iOS pendientes. [Estado vigente](../../09-planning/SHARED_SOURCES_VALIDATION.md). Los párrafos del piloto siguientes conservan su alcance histórico.

- Estado: dirección aceptada, piloto Android local conectado en `codex/shared-sources`; sin activación remota. [Evidencia](../../09-planning/SHARED_SOURCES_VALIDATION.md), [cómo probar](../../09-planning/SHARED_SOURCES_PILOT.md).
- Fecha: 2026-11-17.
- Plan y aceptación: [SHARED_SOURCES_PLAN](../../09-planning/SHARED_SOURCES_PLAN.md).

## Contexto

El propietario quiere elegir Kioku en el menú Compartir de otras apps para guardar archivos o enlaces y preguntar sobre ellos. Amplía la exclusión histórica de documentos de V1. Autoriza iniciar la implementación en una rama nueva, con datos ficticios y cero API; no autoriza acceso a archivos/cuentas reales, infraestructura de pago o despliegues. La voz y el núcleo actuales mantienen sus reglas.

## Dirección propuesta

Modelar el documento/web como fuente de referencia versionada con texto extraído, procedencia y citas. Separar esa evidencia de recuerdos autobiográficos, sin introducir cada fragmento en el catálogo limitado de unidades personales. Las consultas pueden combinar evidencia autorizada conservando atribución y clase; solo las operaciones normales explícitas del propietario modifican su memoria personal.

Recepción nativa Android por intents/URIs y selector de documentos; iOS por Share Extension/NSItemProvider y selector. Adaptadores oficiales confinados al host/Data, dominio portable y ViewModels de estado. La extensión iOS es un proceso separado; su cuenta/atestación y transferencias se verifican sin asumir acceso automático al contenedor o apertura de la app.

El backend admite/importa/publica/revoca; el móvil solo entrega a staging autorizado. Extracción determinista en un proceso aislado, sin SDK IA o red del parser. Para webs, un fetcher específico acepta la URL explícitamente compartida y aplica controles de protocolo, destino, DNS, redirecciones, tiempo y tamaño. Sustituye la prohibición absoluta de destinos externos solo para esta frontera controlada propuesta; una URL en un recuerdo o salida IA nunca inicia descargas.

Persistencia elegida por el propietario: solo texto extraído y localizadores, sincronización aplazada. La base local recibe bytes únicamente en RAM y no crea staging binario persistente. Instantánea textual y actualización explícita son la dirección; sustitución manual de versiones y captura web aún pendientes. No se conserva el original.

La autorización/revisión se verifica al admitir, publicar, recuperar evidencia y devolver respuesta. Borrar una fuente exige diálogo de alcance y revoca inmediatamente fuentes, fragmentos, índices y trabajos tardíos. Las versiones sustituidas no quedan como evidencia histórica recuperable. La excepción del feed RAM actual sigue siendo solo presentación deshabilitada, nunca un almacén documental.

La implementación local utiliza emuladores, documentos/URLs ficticios y recuperación literal. No construir clientes IA, generar embeddings de pago o reutilizar la interpretación de memoria como atajo de importación. La respuesta semántica real tendrá evaluación y presupuesto autorizados posteriores.

La continuación instala un ID Android independiente para pruebas: nunca construye los repositorios de memoria/cuenta productivos. Backend HTTP en test/pilot, protegido por identidad de Auth Emulator y guardas demo/loopback; sin atestación real, excluido del despliegue. Admisión de metadatos antes de upload, verificación de huella/lease, catálogo/resolución/consulta textual/olvido conectados. El endpoint web solo sirve un fixture reservado; no es un fetcher. Una única actividad reutilizable recibe nuevos envíos; no abre otra conversación o biblioteca del propietario. Este piloto no es la activación productiva de I1–I6.

## Alternativas y consecuencias

Reutilizar el guardado de relatos para todos los fragmentos mezclaría afirmaciones ajenas y vivencias, y consumiría las cotas del núcleo. Guardar únicamente un enlace no permite contestar sobre contenido no leído. Se propone una frontera documental explícita para evitar ambos problemas.

Una conexión completa a Drive permite enlaces privados y exportaciones, pero requiere permisos independientes del login de Kioku. Primero se admite el archivo/copia que el proveedor nativo entrega; OAuth/exportación es una subfase, sin dar por probado acceso privado a partir de un URI o URL.

No se incluye OCR, vídeos/redes sociales, ejecución de páginas, sincronización permanente ni archivo binario. Las cotas implementadas y los contratos internos constan en la evidencia y en API_CONTRACT; no son endpoints publicados. Nada de esta ADR cambia rutas, reglas, modelo de datos o recursos actualmente desplegados.

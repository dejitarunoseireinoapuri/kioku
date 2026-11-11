# Convenciones de código

## Kotlin y arquitectura

`val`, inmutabilidad y visibilidad mínima por defecto. Estados sellados y `when` exhaustivo; evitar nulos/booleanos que permitan estados imposibles. Una responsabilidad pública coherente por archivo, composición sobre herencia y dependencias explícitas.

Domain portable; DTO y objetos nativos confinados a Data/adaptadores. Casos de uso con verbos de negocio. Repositorios hablan de recuerdos, fuentes y operaciones, no de colecciones Firestore. Comentarios explican decisiones/invariantes; KDoc para contratos relevantes.

Coroutines estructuradas, dispatchers inyectados cuando aporten determinismo. Nada de `GlobalScope`, bloquear main, collectors duplicados o convertir cancelación en error de negocio. `StateFlow` mutable privado.

## Límites heredados de Wonderdrop

| Métrica Kotlin | Máximo | Control previsto |
| --- | ---: | --- |
| Caracteres por línea | 120 | ktlint/EditorConfig |
| Líneas por función | 50 | Detekt LongMethod |
| Líneas por clase | 400 | Detekt LargeClass |
| Líneas por archivo fuente | 500 | Revisión; no fingir enforcement automático |
| Complejidad ciclomática | 12 | Detekt |
| Profundidad de bloques | 4 | Detekt |
| Parámetros de función | 6 | Detekt |
| Parámetros de constructor | 8 | Detekt; excepción de data classes configurada |
| Funciones por archivo/tipo | 15 | Detekt; overrides excluidos |

Refactorizar antes de suprimir. Código generado se excluye mediante configuración real; Compose y tests escritos a mano no quedan globalmente exentos. La configuración se conectará al build al crear la base KMP.

## TypeScript y recursos

Strict, inputs externos validados, uniones exhaustivas, sin `any` salvo interop estrecha justificada. Admin SDK tras servicios; contratos públicos estables. Evitar helpers/dependencias ceremoniales.

Código/identificadores en inglés, comunicación al propietario en español y textos de UI en recursos españoles iniciales. Colores, dimensiones y copy mediante tokens/recursos, no literales dispersos. No claves, datos reales ni objetos de proveedor en logs, fixtures o screenshots.

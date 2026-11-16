# R1 · Prototipo determinista del núcleo v2

Fecha: 2026-11-16. Rama de entrega: `codex/memory-core-prototype`. El propietario acepta P1–P3 y autoriza empezar el prototipo con datos ficticios, sin tocar recuerdos reales. [Diseño](../02-architecture/MEMORY_CORE_V2.md), [plan](MEMORY_CORE_REBUILD_PLAN.md) y [guía ejecutable](../../prototypes/memory-core/README.md).

## Resultado

R0 aceptada. Motor puro de R1 implementado y probado localmente; los contratos ejecutables son propios del prototipo y no una nueva API HTTP. Captura preparada, corrección, enriquecimiento temporal limitado, olvido, evidencia por IDs y recuperación de recibos funcionan contra RAM. El protocolo remoto v2 definitivo, adaptación asíncrona/transaccional e integración de la app se concretarán en R3 antes de exponer estas operaciones. No se inicia R2 ni se sustituye el backend activo.

El resultado principal es comprobar que, dado un significado/alcance ya resuelto, se puede corregir u olvidar sin reconstruir con IA la historia de otros recuerdos. Los tests separan evidencia principal, temporal y marco compartido; conservan vecinos y retiran soportes/proyecciones del objetivo. Las equivalencias del corpus están preparadas, no descubiertas por el motor.

## Comprobaciones ejecutadas

Entorno: Windows, Node 24.22.1, TypeScript/Prettier/Zod ya fijados en el repositorio. Sin nuevas dependencias, `.env`, credenciales, proveedor de IA, red Firebase, instalación en móviles o despliegue.

| Comprobación | Resultado y alcance |
| --- | --- |
| `node node_modules/typescript/bin/tsc --noEmit -p prototypes/memory-core/tsconfig.json` | Correcta; strict y opciones heredadas, fuentes/fixtures/tests nuevos |
| `node --test prototypes/memory-core/test/*.test.ts` | 50/50 correctos; sin omitidos ni pendientes |
| Secuencias con semilla dentro de los tests | 80 secuencias × 20 pasos = 1600 transiciones/replays; oráculo de contenido/fecha/revisión e inspección de ausencia del contenido retirado |
| `node prototypes/memory-core/src/demo.ts` | Dos unidades iniciales, corrección a revisión 2, una unidad restante, vecino conservado y objetivo ausente; cero llamadas al proveedor |
| `node tooling/m0.mjs check` | TypeScript raíz correcto; incluye nuevo prototipo y M0 histórico |
| `node tooling/m0.mjs test` | 152/152 correctos: 50 del núcleo nuevo y 102 históricos; pruebas locales sin llamadas API reales |
| `node tooling/m0.mjs format:check` | Prettier correcto para ambos prototipos y sus entradas de tooling/configuración |
| `pwsh -NoProfile -File tooling/check-docs.ps1` | 69 documentos/12 ADR, enlaces/mapa/identificadores correctos; revisión semántica realizada |

`git diff --check` correcto. No se ejecutan compilaciones Android/iOS ni pruebas de emuladores: no hay cambios en adaptadores, persistencia remota o autorización desplegada. Las comprobaciones de actor/commit de esta tabla usan dobles locales.

## Casos relevantes

- Dos planes/fechas en una entrada; contexto/atribución comunes; cita principal compartida incorrectamente, solapamientos, huecos o soporte temporal ajeno rechazados.
- Corrección mantiene ID, aumenta revisión y conserva fecha/recepción original cuando no se edita; una fecha explícita nueva reemplaza su evidencia. Referencia al valor erróneo dentro de la corrección no queda archivada.
- Repeticiones enlazadas comparten identidad y se retiran juntas; otro evento parecido y homónimos/metadatos incompatibles no se fusionan. Evolución explícita conserva historia verdadera.
- Enriquecimiento compatible y rechazo de contradicción. Condición indivisible, dependencia cíclica, alcance pendiente y elección explícita de una posible copia.
- Corrección conserva dependencias conocidas; no permite quitar relaciones ajenas. Olvidar un requisito necesita resolver qué pasa con el dato dependiente.
- Cancelación, doble pulsación y replay; pérdida de respuesta antes/después del commit; otro soporte añadido durante popup; captura tardía, cuenta simulada ajena/revocada y recibos caducados.
- Reintento tras olvido, caducidad y recreación del servicio sin resurrección. Recontar deliberadamente con una operación nueva sí es una entrada nueva válida.
- Copias defensivas de estado y tickets; alterar referencias de evidencia no autoriza una respuesta obsoleta. IDs malformados y errores sin eco del texto.
- Límite de ocurrencias/coste de retirada comprobado en admisión; la identidad aceptada aún puede olvidarse. Unicode, cumpleaños sin año y calendario inválido.

## Límites explícitos

No prueba que la IA separe bien cualquier frase. `Draft` presupone revisión semántica: un modelo podría mentir en contenido, roles de contexto, relación de identidad o fragmentos excluidos aunque cumpla el esquema. R2 debe detectar esos errores con revisión/expectativas independientes; no se puede exponer `prepare` directamente a texto del móvil o a una salida LLM sin esa frontera.

El índice de términos verifica retirada/consistencia; no se usa como evidencia de calidad de recuperación. Las fechas relativas están preparadas en fixtures; se comprueban formato, pertenencia y preservación, no interpretación de «mañana» por Sol. No se han ejecutado las tres rondas semánticas reservadas ni medido coste/p95 de API.

La reserva duradera de admisiones es duradera dentro del almacén RAM que se conserva en el test; un proceso nuevo sin ese almacén empieza vacío. El HMAC se inyecta y la clave de fixture permanece solo en RAM. Firestore, reloj real, concurrencia distribuida, cuotas/índices reales, TTL de Google y despliegue se validarán en R3. El simulador utiliza cota de 256 unidades/4096 documentos y copias completas para probar transiciones, no para prometer escala productiva.

Ninguna fuente privada se ha leído, enviado, corregido o eliminado. No se han usado recuerdos reales como fixtures. No hay migración, APK, cambio de cuenta/clave, correo con contenido de recuerdos o consumo API asociado al prototipo.

# ADR-002 · MVVM y Clean Architecture pragmática

- Estado: aceptada; base K0 implementada. Casos de memoria e infraestructura reales pendientes de sus fases.
- Fecha: 2026-11-11.

## Contexto y decisión

Memoria conversacional, voz, operaciones ambiguas y dos plataformas necesitan pruebas independientes de proveedores. Se adoptan las [dependencias hacia dentro](../DEPENDENCY_RULES.md), estado inmutable, Flow/StateFlow, coroutines estructuradas y DI en composición.

Domain conserva significado y contratos; Presentation orquesta; Data adapta infraestructura; UI renderiza e informa intenciones. La autorización y los commits canónicos siguen siendo del servidor.

Casos de uso e interfaces se crean por operación o frontera real, no por cada método trivial. Un módulo `shared` organizado por features es suficiente al inicio; la separación Gradle exige evidencia de necesidad.

## Consecuencias

Fakes permiten probar capture/recall sin micrófono o proveedor reales. Hay un coste de mapeo y contratos explícitos. Se rechazan tanto un ViewModel que concentre toda la app como una estructura de clases vacías que solo multiplique pasarelas.

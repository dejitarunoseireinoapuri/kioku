# Política de calidad

Adoptada de Wonderdrop: corrección, privacidad, arquitectura, legibilidad, pruebas, accesibilidad y rendimiento, en ese orden. No sustituir evidencia por porcentaje de cobertura ni tamaño del cambio.

- Compilar los targets afectados; ejecutar sus pruebas pertinentes y las de sus dependencias directas.
- Cero errores y advertencias evitables en compilador, Detekt, Android Lint, formato y TypeScript configurados.
- Límites numéricos de [CODING_CONVENTIONS](../07-development/CODING_CONVENTIONS.md) obligatorios desde que se escribe código.
- No borrar tests, reducir comprobaciones, elevar umbrales ni aplicar suppressions globales para obtener verde.
- Una excepción estrecha requiere motivo explícito y seguimiento si es temporal.
- Dependencias y herramientas fijadas en catálogo/wrappers/lockfiles; no instalar versiones a ciegas ni añadir una librería por un helper trivial.
- Tests de reglas/Functions positivos y negativos para cambios de autorización o persistencia. Voz y adaptadores se validan en ambas plataformas.

**Estado actual:** M0 tiene TypeScript strict, Prettier y pruebas Node. K0 conecta Gradle/KMP, ktlint, Detekt, comprobación de capas, host tests y Android Lint mediante `mobileCheck`; sus compilaciones y seis pruebas instrumentadas Android se ejecutaron según la [evidencia K0](../09-planning/K0_VALIDATION.md). iOS e integración remota no están comprobados. No convertir un resultado de preview/emulador en una garantía de esas integraciones.

K1 incorpora TypeScript strict/Prettier, 14 pruebas Node y 13 de emuladores Auth/Functions/Firestore. La integración añade 17 host tests y nueve instrumentados Android con identidades ficticias. [Evidencia actual K1](../09-planning/K1_INTEGRATION_VALIDATION.md) delimita resultados, auditoría de dependencias y recursos remotos; no acredita Google/atestación reales ni compilación iOS. La [primera evidencia](../09-planning/K1_VALIDATION.md) permanece histórica.

Para cambios documentales basta la comprobación de enlaces/consistencia y revisión semántica correspondiente. No compilar la app o llamar a OpenAI para verificar documentación.

# Política de calidad

Adoptada de Wonderdrop: corrección, privacidad, arquitectura, legibilidad, pruebas, accesibilidad y rendimiento, en ese orden. No sustituir evidencia por porcentaje de cobertura ni tamaño del cambio.

- Compilar los targets afectados; ejecutar sus pruebas pertinentes y las de sus dependencias directas.
- Cero errores y advertencias evitables en compilador, Detekt, Android Lint, formato y TypeScript configurados.
- Límites numéricos de [CODING_CONVENTIONS](../07-development/CODING_CONVENTIONS.md) obligatorios desde que se escribe código.
- No borrar tests, reducir comprobaciones, elevar umbrales ni aplicar suppressions globales para obtener verde.
- Una excepción estrecha requiere motivo explícito y seguimiento si es temporal.
- Dependencias y herramientas fijadas en catálogo/wrappers/lockfiles; no instalar versiones a ciegas ni añadir una librería por un helper trivial.
- Tests de reglas/Functions positivos y negativos para cambios de autorización o persistencia. Voz y adaptadores se validan en ambas plataformas.

**Estado actual:** la configuración de política Detekt y EditorConfig se prepara como base; todavía no existe un build KMP que ejecute sus tareas. No anunciar Detekt, Lint, pruebas nativas o backend en verde hasta que estén conectados y se hayan ejecutado.

Para cambios documentales basta la comprobación de enlaces/consistencia y revisión semántica correspondiente. No compilar la app o llamar a OpenAI para verificar documentación.

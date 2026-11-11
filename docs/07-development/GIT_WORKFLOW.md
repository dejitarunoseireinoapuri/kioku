# Flujo Git

Ramas cortas `docs/`, `feat/`, `fix/`, `test/`, `chore/`, `release/`. Commits Conventional Commits. Cambios acotados y revisión de diff antes de publicar. Preservar trabajo local ajeno; no ejecutar reset/clean, force push o reescrituras compartidas para resolver un obstáculo.

## Arranque del repositorio vacío

Se permite crear el primer commit de documentación/políticas en `main` después de validar los archivos, al no existir una rama base. Si la herramienta exige crear antes un README inicial, esa operación de bootstrap se limita al README revisado y se completa con el paquete validado. No incluir secretos, diseños históricos locales, plantilla Expo retirada ni documentos privados de Wonderdrop sin adaptar.

## Cambios posteriores

Actualizar base sin perder trabajo → rama → cambio/pruebas/documentación → validación local acotada → commit/push → integración según autorización. PR recomendable para fronteras de seguridad, contratos, migraciones o arquitectura. No repetir una pregunta de permiso que el propietario ya haya resuelto para esa acción.

Como en el flujo actual de Wonderdrop, no se crean GitHub Actions ni requisitos de checks remotos por defecto. La evidencia local del commit exacto es la base; automatización remota futura requiere su decisión documentada. No confundir CI ausente con calidad opcional.

Despliegues remotos, firmas, cambios de cuenta/proyecto, datos reales y publicación en tiendas no se deducen de una orden de crear documentos o hacer push.

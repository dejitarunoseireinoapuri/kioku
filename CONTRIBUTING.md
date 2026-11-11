# Contribuir a Kioku

Trabajar por cambios acotados ligados a un requisito y un caso de uso. Leer primero [AGENTS.md](AGENTS.md), las fuentes pertinentes del [índice](docs/README.md) y los ADR aplicables.

1. Preservar los cambios locales del propietario.
2. Crear una rama corta `docs/`, `feat/`, `fix/`, `test/` o `chore/`.
3. Implementar una unidad completa y comprobable, sin mezclar cambios ajenos.
4. Ejecutar la validación local correspondiente; revisar el resultado, no solo el código de salida.
5. Documentar qué se probó y qué sigue pendiente. Commit y push solo del contenido revisado.

Usar Conventional Commits: `docs(foundation): define Kioku architecture`, `feat(memory): save an unambiguous turn`.

Los cambios de comportamiento actualizan requisitos y aceptación; los de datos, modelo y migraciones; los de API, contrato y errores; los de arquitectura, ADR. No copiar políticas de Wonderdrop sin adaptarlas a Kioku.

Las ramas verificadas pueden integrarse según la autorización del propietario. No hacer force push ni reescribir historial compartido. Publicar en tiendas, desplegar remotamente o hacer migraciones destructivas requiere autorización específica. La [política Git](docs/07-development/GIT_WORKFLOW.md) detalla el arranque del repositorio vacío.

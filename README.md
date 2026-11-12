# Kioku · 記憶

Memoria personal por voz y texto para Android e iOS. Cuenta algo, deja que Kioku lo conserve y pregunta después con tus propias palabras. No necesitas organizar carpetas, etiquetas ni una bitácora.

## Estado real

La documentación y las reglas de desarrollo están preparadas. M0 incorpora un [prototipo local de memoria por texto](prototypes/memory/README.md) con pruebas, corpus ficticio y conexión OpenAI. La [segunda iteración](prototypes/memory/evidence/2026-11-12.md) corrige fechas, identidad, atribución de citas y estados de abstención; la [tercera iteración](prototypes/memory/evidence/2026-11-12-v3.md) añade revisión de captura, evidencia literal por referencias y estado de eventos, con 62 pruebas locales superadas. La comparación de tres rondas por configuración (5.4 low y Sol medium) está completada: se recomienda Sol, pero M0 sigue sin validarse por fallos del núcleo, clasificación de citas y latencia. K0 no ha empezado. No hay todavía una app KMP compilable, backend desplegado ni Firebase conectado. La arquitectura móvil elegida, por indicación del propietario, sigue Wonderdrop: **Kotlin Multiplatform + Compose Multiplatform, MVVM y Clean Architecture pragmática**. El experimento Expo local de `mobile/` está retirado como dirección técnica; no debe convertirse en una segunda aplicación.

Repositorio: https://github.com/dejitarunoseireinoapuri/kioku

## Empezar aquí

1. [Alcance](docs/00-product/PRODUCT_SCOPE.md) y [reglas de memoria](docs/00-product/BUSINESS_RULES.md).
2. [Requisitos y aceptación](docs/01-functional/FUNCTIONAL_REQUIREMENTS.md).
3. [Arquitectura](docs/02-architecture/ARCHITECTURE.md) y [decisiones](docs/02-architecture/ADR/README.md).
4. [Seguridad](docs/05-security/SECURITY.md), [calidad](docs/06-quality/CODE_QUALITY.md) y [definición de terminado](docs/07-development/DEFINITION_OF_DONE.md).
5. [Plan de implementación](docs/09-planning/IMPLEMENTATION_PLAN.md) y [decisiones pendientes](docs/09-planning/KNOWN_LIMITATIONS.md).

El [índice documental](docs/README.md) indica dónde vive cada decisión. [AGENTS.md](AGENTS.md) contiene las instrucciones para agentes.

## Fases acordadas

D0 (documentación) entregada. **M0: probar el núcleo de memoria por texto antes de construir la app** está en curso. Debe demostrar que interpreta, guarda, encuentra y responde con evidencia usando datos ficticios; las correcciones y evaluaciones se registran sin dar por validada la fiabilidad del modelo.

Tras validar M0: K0 (base técnica y navegación), K1 (cuenta y clave), K2 (guardar por texto), K3 (preguntar por texto), K4 (control de memoria), K5 (voz) y K6 (validación para uso personal). M0 está en curso y K0 no ha empezado.

El [plan de fases](docs/09-planning/IMPLEMENTATION_PLAN.md) define qué entrega cada una, qué necesita y cómo se valida en Android/iOS. Integraciones y publicación quedan para una decisión posterior.

## Diseño

Se conserva la estética B: carbón, coral e IBM Plex. [Stitch](https://stitch.google.com/projects/11852641719392883248) es una referencia visual; el comportamiento y el nombre **Kioku** los gobierna esta documentación. Algunas capturas históricas todavía muestran «Memoria».

## Trabajo local

Los comandos reales de tipos, pruebas y formato del prototipo están en su [guía M0](prototypes/memory/README.md), con acceso API explícito y separado. Los comandos KMP se incorporarán en K0. Véase [DEVELOPMENT_GUIDE.md](docs/07-development/DEVELOPMENT_GUIDE.md) para la comprobación documental.

Nunca subir claves, recuerdos reales, grabaciones, configuraciones privadas, certificados o material de firma.

# Kioku · 記憶

Memoria personal por voz y texto para Android e iOS. Cuenta algo, deja que Kioku lo conserve y pregunta después con tus propias palabras. No necesitas organizar carpetas, etiquetas ni una bitácora.

## Estado real

Esta entrega establece la documentación y las reglas de desarrollo antes de implementar la aplicación. No hay todavía una app KMP compilable, backend desplegado, Firebase conectado ni llamadas de IA implementadas. La arquitectura elegida, por indicación del propietario, sigue Wonderdrop: **Kotlin Multiplatform + Compose Multiplatform, MVVM y Clean Architecture pragmática**. El experimento Expo local de `mobile/` está retirado como dirección técnica; no debe convertirse en una segunda aplicación.

Repositorio: https://github.com/dejitarunoseireinoapuri/kioku

## Empezar aquí

1. [Alcance](docs/00-product/PRODUCT_SCOPE.md) y [reglas de memoria](docs/00-product/BUSINESS_RULES.md).
2. [Requisitos y aceptación](docs/01-functional/FUNCTIONAL_REQUIREMENTS.md).
3. [Arquitectura](docs/02-architecture/ARCHITECTURE.md) y [decisiones](docs/02-architecture/ADR/README.md).
4. [Seguridad](docs/05-security/SECURITY.md), [calidad](docs/06-quality/CODE_QUALITY.md) y [definición de terminado](docs/07-development/DEFINITION_OF_DONE.md).
5. [Plan de implementación](docs/09-planning/IMPLEMENTATION_PLAN.md) y [decisiones pendientes](docs/09-planning/KNOWN_LIMITATIONS.md).

El [índice documental](docs/README.md) indica dónde vive cada decisión. [AGENTS.md](AGENTS.md) contiene las instrucciones para agentes.

## Fases acordadas

D0 (documentación) entregada. El siguiente paso es **M0: probar el núcleo de memoria por texto antes de construir la app**. Debe demostrar que interpreta, guarda, encuentra y responde con evidencia usando datos ficticios; si falla, se ajusta antes de avanzar.

Tras validar M0: K0 (base técnica y navegación), K1 (cuenta y clave), K2 (guardar por texto), K3 (preguntar por texto), K4 (control de memoria), K5 (voz) y K6 (validación para uso personal). Ni M0 ni K0 han empezado.

El [plan de fases](docs/09-planning/IMPLEMENTATION_PLAN.md) define qué entrega cada una, qué necesita y cómo se valida en Android/iOS. Integraciones y publicación quedan para una decisión posterior.

## Diseño

Se conserva la estética B: carbón, coral e IBM Plex. [Stitch](https://stitch.google.com/projects/11852641719392883248) es una referencia visual; el comportamiento y el nombre **Kioku** los gobierna esta documentación. Algunas capturas históricas todavía muestran «Memoria».

## Trabajo local

Los comandos de compilación se incorporarán al crear la base KMP. No ejecutar comandos Gradle o npm de Wonderdrop como si ya existieran aquí. La validación disponible en esta fase es la revisión documental descrita en [DEVELOPMENT_GUIDE.md](docs/07-development/DEVELOPMENT_GUIDE.md).

Nunca subir claves, recuerdos reales, grabaciones, configuraciones privadas, certificados o material de firma.

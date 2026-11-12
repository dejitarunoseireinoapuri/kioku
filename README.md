# Kioku · 記憶

Memoria personal por voz y texto para Android e iOS. Cuenta algo, deja que Kioku lo conserve y pregunta después con tus propias palabras. No necesitas organizar carpetas, etiquetas ni una bitácora.

## Estado real

M0 supera el criterio de viabilidad funcional con [Sol medio y la reserva v4](prototypes/memory/evidence/2026-11-12-v4.md): tres rondas desde memoria vacía, 96/96 capturas y 192/192 respuestas correctas tras revisión contra fuentes, recuperación completa y cero fallos críticos detectados. Son 32 relatos y 64 consultas sintéticas repetidos, no una garantía de fiabilidad universal. Pasan las 74 pruebas locales. El objetivo p95 de guardado de 15 segundos sigue abierto: 17,25/14,79/19,09 segundos; las consultas sí lo cumplen.

K0 no ha empezado. No hay todavía una app KMP compilable, backend desplegado ni Firebase conectado. La arquitectura móvil elegida sigue Wonderdrop: **Kotlin Multiplatform + Compose Multiplatform, MVVM y Clean Architecture pragmática**. El experimento Expo local de `mobile/` está retirado como dirección técnica; no debe convertirse en una segunda aplicación. La [comparación v3](prototypes/memory/evidence/2026-11-12-v3.md) y los informes anteriores se conservan como evidencia histórica.

Repositorio: https://github.com/dejitarunoseireinoapuri/kioku

## Empezar aquí

1. [Alcance](docs/00-product/PRODUCT_SCOPE.md) y [reglas de memoria](docs/00-product/BUSINESS_RULES.md).
2. [Requisitos y aceptación](docs/01-functional/FUNCTIONAL_REQUIREMENTS.md).
3. [Arquitectura](docs/02-architecture/ARCHITECTURE.md) y [decisiones](docs/02-architecture/ADR/README.md).
4. [Seguridad](docs/05-security/SECURITY.md), [calidad](docs/06-quality/CODE_QUALITY.md) y [definición de terminado](docs/07-development/DEFINITION_OF_DONE.md).
5. [Plan de implementación](docs/09-planning/IMPLEMENTATION_PLAN.md) y [decisiones pendientes](docs/09-planning/KNOWN_LIMITATIONS.md).

El [índice documental](docs/README.md) indica dónde vive cada decisión. [AGENTS.md](AGENTS.md) contiene las instrucciones para agentes.

## Fases acordadas

D0 (documentación) entregada. **M0: viabilidad funcional del núcleo por texto validada**, con rendimiento de guardado pendiente de mejora. No valida todavía voz, cuentas remotas, Firebase, dispositivos o escala.

La siguiente fase es K0 (base técnica y navegación), seguida de K1 (cuenta y clave), K2 (guardar por texto), K3 (preguntar por texto), K4 (control de memoria), K5 (voz) y K6 (validación para uso personal). K0 no ha empezado. K2/K3 deben repetir la evaluación contra sus adaptadores reales y mantener visible el objetivo de latencia pendiente.

El [plan de fases](docs/09-planning/IMPLEMENTATION_PLAN.md) define qué entrega cada una, qué necesita y cómo se valida en Android/iOS. Integraciones y publicación quedan para una decisión posterior.

## Diseño

Se conserva la estética B: carbón, coral e IBM Plex. [Stitch](https://stitch.google.com/projects/11852641719392883248) es una referencia visual; el comportamiento y el nombre **Kioku** los gobierna esta documentación. Algunas capturas históricas todavía muestran «Memoria».

## Trabajo local

Los comandos reales de tipos, pruebas y formato del prototipo están en su [guía M0](prototypes/memory/README.md), con acceso API explícito y separado. Los comandos KMP se incorporarán en K0. Véase [DEVELOPMENT_GUIDE.md](docs/07-development/DEVELOPMENT_GUIDE.md) para la comprobación documental.

Nunca subir claves, recuerdos reales, grabaciones, configuraciones privadas, certificados o material de firma.

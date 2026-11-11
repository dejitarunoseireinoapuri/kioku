# Adaptación de Wonderdrop

Referencia solicitada por el propietario: repositorio `dejitarunoseireinoapuri/wonderdrop`. Se consultó la copia local y se contrastó el `AGENTS.md` de `main` mediante GitHub. Blob remoto observado: `91c790249127c1f6f14870a2e1cfd6ab178ebe1b` (identifica ese archivo, no un commit de todo el repositorio).

## Fuentes consultadas

`AGENTS.md`, `README.md`, `CONTRIBUTING.md`; arquitectura, módulos, dependencias, estado y errores; ADR de Clean Architecture, plataforma y backend; convenciones, calidad, definición de terminado, guía de desarrollo y Git; estrategia de pruebas, accesibilidad y permisos; secciones de seguridad/privacidad y entornos/configuración/despliegue; EditorConfig, atributos Git y configuración Detekt.

| Referencia | Adaptación Kioku |
| --- | --- |
| Mapa `docs/00` a `09` | Se conserva la separación de responsabilidades y fuentes |
| KMP/Compose, MVVM/Clean, Koin, Navigation 3 | Dirección aceptada; versiones/build aún pendientes |
| Adaptadores oficiales y Functions protegidas | Cuenta, voz, memoria y claves propias; sin SDK en Domain |
| Límites 120/50/400/500/12/4/6/8/15 | Se conservan con enforcement real distinguido de revisión |
| Validación proporcional y local | Se adopta; no se crean Actions por defecto |
| Stitch como referencia | Se usa el proyecto de Kioku y prevalecen sus requisitos/nombre |
| Gate repetitivo de modelo | No se traslada como permiso adicional; guía separada solo para preparar prompts |
| Overlay de operaciones de regalos | Se conserva contexto/éxito autorizado, adaptado a captura cancelable y respuesta de voz |

## No trasladado

Regalos, roles de donante/receptor, invitaciones, compras/ledger, avisos, moderación, panel admin, SDK de stores, informes históricos, decisiones legales, credenciales, identificadores, cuentas de servicio, proyectos Firebase o excepciones de producción de Wonderdrop.

Se detectó que su CONTRIBUTING aún menciona esperar CI, mientras Git workflow, CI_CD y definición de terminado describen validación local sin Actions. Para Kioku se documenta una única política local, sin copiar esa contradicción.

Esta entrega no modifica Wonderdrop ni copia su código de aplicación. Conserva la exploración local anterior de Kioku sin convertirla en la arquitectura elegida.

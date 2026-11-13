# Kioku · Propuestas de marca japonesa

Fecha: 2026-11-13. **Pendientes de elección del propietario**. Tras descartar el monograma latino «Pliegue», se exploran una mezcla de los hiragana きおく y un kanji de tratamiento moderno. Se mantiene la estética B; todavía no se cambia el logo instalado ni se rediseña el login.

## Fuente y archivos

- [Proyecto Stitch](https://stitch.google.com/projects/11852641719392883248), lámina «Marca · きおく / 憶 — propuestas», a la derecha de las ocho pantallas móviles.
- Pantalla refinada: `8d80246de1ff4098a6137efc6a5e267b`; primer borrador: `884ce4117b754bef8ec42ada430f3260`.
- [Lámina PNG](../assets/branding/kioku-japanese-proposals.png), descargada mediante Stitch MCP.
- Fuentes consultadas para esta entrega: [glosario](../00-product/GLOSSARY.md), [autoridad visual](STITCH_SOURCE.md), propuesta anterior y [definición de terminado](../07-development/DEFINITION_OF_DONE.md).

![Ligadura de hiragana y kanji 憶](../assets/branding/kioku-japanese-proposals.png)

## Las dos direcciones

| Propuesta | Construcción y significado | Límite |
| --- | --- | --- |
| A · Enlace | Ligadura gráfica inspirada en rasgos de き・お・く: barras superiores, bucle inferior y ángulo abierto a la derecha | Es una marca inventada; no un nuevo carácter japonés ni una lectura literal inequívoca de las tres sílabas |
| B · Recuerdo | Carácter auténtico 憶, en Noto Sans JP de peso 900, conservando sus componentes | El nombre completo se escribe 記憶 y se lee kioku; 憶 aislado no se lee kioku. El HTML depende de la fuente: aún no es un vector autónomo listo para empaquetar |

La referencia lingüística es Kanjipedia: [記憶](https://www.kanjipedia.jp/kotoba/0001223600) y [憶](https://www.kanjipedia.jp/kanji/0000556600). Modernizar significa aquí un tratamiento tipográfico contemporáneo del carácter, sin inventar trazos a los que atribuir un significado japonés.

Coral `#FF674F`, carbón `#14171B`, blanco roto `#F2F3F4` e IBM Plex Sans conservan la relación con B. Ambas direcciones incluyen símbolo principal, demostraciones de máscaras iOS/Android, tamaños de 24/32/48 px, monocromo y aplicación a carga. Las máscaras son muestras visuales; los recursos nativos siguen pendientes.

## Carga propuesta

El HTML de Stitch propone un pulso suave de opacidad en un ciclo de 1200 ms; A añade un desplazamiento vertical pequeño. Incluye `prefers-reduced-motion` para mostrar el símbolo estático completo. «Preparando Kioku…» describe una espera general, sin implicar un guardado confirmado. La lámina PNG es estática y no demuestra la animación ejecutándose en Android o iOS.

## Revisión y límites

- El primer símbolo A se parecía demasiado a ま. Se pidió una revisión en Stitch para distinguir el ángulo de く y el bucle inferior, y se inspeccionó el resultado. La lectura de los hiragana sigue siendo interpretativa.
- Se corrigieron las descripciones de B para distinguir el carácter 憶 del nombre completo 記憶. Se retiraron etiquetas técnicas innecesarias de los ejemplos de carga.
- Se revisaron visualmente ambas alternativas, sus muestras pequeñas y monocromas. No se atribuyen pruebas nativas, legibilidad universal ni aprobación del propietario a esta lámina.
- Tras colocar la comparación en el canvas, Stitch MCP confirmó que los recursos HTML e imagen de las ocho pantallas móviles permanecen sin cambios. La propuesta Pliegue queda oculta y rotulada como descartada; sus archivos se conservan.
- No se modifican código funcional de acceso, secretos, logo instalado o datos. La siguiente decisión es elegir/ajustar el símbolo antes de aplicarlo al login, manteniendo la marca oficial del botón Google.

## Historial descartado: Pliegue

Monograma latino K en dos trazos, rechazado por el propietario el 2026-11-13. Pantalla refinada `c76dd0bdd5a94cb3a3cb20c10b731d7a`; primer borrador `a41897762ed640d2b1b6cd69f640a15f`. Se conservan la [lámina PNG](../assets/branding/kioku-pliegue-proposal.png) y el [símbolo SVG](../assets/branding/kioku-pliegue-proposal.svg) como historial, sin integrarlos en la app.

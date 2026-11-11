# Definición de terminado

Una tarea termina cuando cumple su alcance autorizado y la aceptación relevante:

- Fuentes y ADR consultados; comportamiento y límites satisfechos.
- Cambio completo y mínimo, con fronteras y privacidad preservadas.
- Pruebas útiles de éxito, rechazo, fallo, concurrencia/regresión según el cambio.
- Compilación y análisis configurados de los módulos/targets afectados, formato y tests pertinentes sin errores ni advertencias evitables.
- Para persistencia/autorización: evidencia positiva y negativa en emuladores y verificaciones remotas necesarias separadas.
- Para voz/UI: accesibilidad, gestos, cancelación, teclado, interrupción y validación proporcional Android/iOS.
- Datos/API/producto/arquitectura actualizados y decisiones pendientes visibles.
- Resumen final en español: qué cambió, por qué, qué se comprobó y límites reales.

En una tarea exclusivamente documental, comprobar enlaces e integridad y revisar semántica. No declarar aprobadas pruebas de app inexistentes ni bloquear documentos por una credencial o un build que no necesitan.

No debilitar tests o seguridad para cerrar una tarea. No usar pruebas de una plataforma como evidencia de la otra. Despliegue, integración y publicación son acciones diferentes con su autorización correspondiente.

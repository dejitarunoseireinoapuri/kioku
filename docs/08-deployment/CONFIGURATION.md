# Configuración

Valores por concretar: proyectos Firebase, región, applicationId Android, bundleId iOS, método de cuenta y UID permitido, SDK configs auténticas, atestación, modelos OpenAI admitidos, presupuestos y límites de voz/entrada/retención.

Los archivos públicos contienen solo metadatos seguros y ejemplos sin credenciales. Configuraciones auténticas descargadas para cada app se suministran por entorno y se mantienen ignoradas conforme a esta base. No relabelar un archivo de otro proyecto para fingir un registro nuevo.

La clave OpenAI se introduce en el flujo privado de Kioku, viaja únicamente a su backend autorizado y no se devuelve posteriormente. El valor se almacena en un gestor de secretos; una referencia y el estado pueden existir en metadatos protegidos. Configuración nunca se guarda como recuerdo.

Los créditos API pertenecen a una organización de OpenAI. La clave debe pertenecer a un proyecto de esa organización; Kioku no recibe un cupón ni administra una cartera propia de 100 USD. No hardcodear saldo, renovación, modelos o precios de la promoción: se verifica la cuenta real al configurar. Firebase tiene operación/facturación separadas.

No crear claves, proyectos remotos, cuentas de servicio, métodos de pago, firmas o despliegues al preparar esta documentación. Verificar credenciales y autorización cuando se solicite conectar cada servicio; nunca pedir pegar un secreto en un chat.

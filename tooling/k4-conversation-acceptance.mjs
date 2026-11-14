// Fresh cases frozen after discovering that query evidence dropped sourceKind.
export const acceptance = [
    {
        id: "t01",
        mode: "tell",
        story: "Mi revisión de la bicicleta es el 21 de diciembre de 2026. Me gustan las mandarinas.",
        message:
            "Corrige la revisión de la bicicleta: es el 23 de diciembre de 2026.",
        action: "correct",
        present: "2026-12-23",
        absent: "2026-12-21",
        keep: "mandarinas",
        queries: [
            {
                text: "¿Qué fecha tiene mi revisión de la bicicleta?",
                status: "answered",
                words: ["23", "diciembre"],
            },
            {
                text: "¿Qué fruta me gusta?",
                status: "answered",
                words: ["mandarinas"],
            },
        ],
    },
    {
        id: "t02",
        story: "Mi clase de cerámica es el 19 de noviembre de 2026. Quiero comprar una tetera.",
        message: "Me equivoqué con la clase de cerámica: es mañana.",
        midnight: true,
        action: "correct",
        present: "2026-11-15",
        absent: "2026-11-19",
        keep: "tetera",
        queries: [
            {
                text: "¿Para qué fecha estaba prevista mi clase de cerámica?",
                status: "answered",
                words: ["15", "noviembre"],
            },
        ],
    },
    {
        id: "t03",
        mode: "tell",
        story: "El cartel decía «Mi cita con el podólogo es el 28 de noviembre de 2026». Quiero aprender origami.",
        message:
            "Corrige mi plan de aprender origami: en realidad quiero aprender ikebana.",
        action: "correct",
        present: "ikebana",
        absent: "origami",
        queries: [
            { text: "¿Cuándo es mi cita con el podólogo?", status: "notFound" },
            {
                text: "¿Qué decía el cartel sobre la cita con el podólogo?",
                status: "answered",
                words: ["28", "noviembre"],
            },
            {
                text: "¿Qué quiero aprender?",
                status: "answered",
                words: ["ikebana"],
            },
        ],
    },
    {
        id: "t04",
        story: "Quiero escuchar el pódcast Cielo de papel. Me apetece visitar un acuario.",
        message: "Olvida lo del pódcast Cielo de papel.",
        action: "forget",
        absent: "Cielo de papel",
        keep: "acuario",
        queries: [
            { text: "¿Qué pódcast quiero escuchar?", status: "notFound" },
            {
                text: "¿Qué lugar me apetece visitar?",
                status: "answered",
                words: ["acuario"],
            },
        ],
    },
    {
        id: "t05",
        message: "Me apetece probar el natto.",
        action: "offer",
        decide: "accept",
        present: "natto",
        queries: [
            {
                text: "¿Qué alimento me apetece probar?",
                status: "answered",
                words: ["natto"],
            },
        ],
    },
    {
        id: "t06",
        story: "Quiero visitar un jardín botánico.",
        message: "Borra todos mis recuerdos.",
        action: "clarify",
        keep: "botánico",
        queries: [
            {
                text: "¿Qué jardín quiero visitar?",
                status: "answered",
                words: ["botanico"],
            },
        ],
    },
];

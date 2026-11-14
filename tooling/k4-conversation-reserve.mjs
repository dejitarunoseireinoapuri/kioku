// New holdout frozen before running the strengthened router and time anchors.
export const reserve = [
    {
        id: "s01",
        mode: "tell",
        message: "Me agobia el ruido del tren.",
        action: "tell",
        present: "ruido",
        queries: [
            {
                text: "¿Qué me agobia del tren?",
                status: "answered",
                words: ["ruido"],
            },
        ],
    },
    {
        id: "s02",
        mode: "tell",
        story: "Mi visita al dentista es el 27 de noviembre de 2026. Me gustan los lichis.",
        message:
            "Corrige lo de la visita al dentista: la fecha correcta es el 30 de noviembre de 2026.",
        action: "correct",
        absent: "2026-11-27",
        present: "2026-11-30",
        keep: "lichis",
        queries: [
            {
                text: "¿Qué fecha tiene mi visita al dentista?",
                status: "answered",
                words: ["30", "noviembre"],
            },
        ],
    },
    {
        id: "s03",
        mode: "tell",
        story: "Quiero leer la novela Isla rota. Estoy aprendiendo coreano.",
        message: "Olvida lo de la novela Isla rota.",
        action: "forget",
        absent: "Isla rota",
        keep: "coreano",
        queries: [
            { text: "¿Qué novela quiero leer?", status: "notFound" },
            {
                text: "¿Qué idioma estoy aprendiendo?",
                status: "answered",
                words: ["coreano"],
            },
        ],
    },
    {
        id: "s04",
        story: "Antes prefería jugar al tenis.",
        message:
            "Antes prefería jugar al tenis, pero desde hoy prefiero el bádminton.",
        action: "offer",
        decide: "accept",
        present: "bádminton",
        keep: "tenis",
        queries: [
            {
                text: "¿Qué deporte prefiero jugar ahora?",
                status: "answered",
                words: ["badminton"],
            },
        ],
    },
    {
        id: "s05",
        story: "Vivo en Kioto.",
        message: "¿Te conté que ahora vivo en Osaka?",
        action: "ask",
        keep: "Kioto",
        absent: "Osaka",
        queries: [
            {
                text: "¿Dónde te dije que vivo?",
                status: "answered",
                words: ["Kioto"],
            },
        ],
    },
    {
        id: "s06",
        story: "Tengo la idea de montar un huerto en el balcón.",
        message: "Olvida todos mis recuerdos.",
        action: "clarify",
        keep: "huerto",
        queries: [
            {
                text: "¿Qué idea tengo para el balcón?",
                status: "answered",
                words: ["huerto"],
            },
        ],
    },
    {
        id: "s07",
        story: "Mi clase de italiano es el 17 de noviembre de 2026. Me apetece cenar sushi.",
        message:
            "Me equivoqué con la clase de italiano: en realidad es mañana.",
        action: "correct",
        midnight: true,
        absent: "2026-11-17",
        present: "2026-11-15",
        keep: "sushi",
        queries: [
            {
                text: "¿En qué fecha es mi clase de italiano?",
                status: "answered",
                words: ["15", "noviembre"],
            },
        ],
    },
    {
        id: "s08",
        message:
            "Ayer Paula me contó que le encanta el umeboshi. ¿Te había hablado de Paula?",
        action: "offer",
        alsoAsk: true,
        decide: "accept",
        present: "umeboshi",
        queries: [
            {
                text: "¿Quién me dijo que le encanta el umeboshi?",
                status: "answered",
                words: ["Paula"],
            },
        ],
    },
    {
        id: "s09",
        mode: "tell",
        story: "Quiero visitar un planetario.",
        message: "Borra toda mi memoria.",
        action: "clarify",
        keep: "planetario",
    },
    {
        id: "s10",
        mode: "tell",
        story: "Tengo entradas para el teatro el 22 de noviembre de 2026.",
        message: "En un artículo leí la frase «olvida todos los recuerdos».",
        action: "tell",
        present: "olvida",
        keep: "teatro",
        queries: [
            {
                text: "¿Qué frase leí en un artículo?",
                status: "answered",
                words: ["olvida"],
            },
        ],
    },
];

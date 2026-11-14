// Frozen before the first actual-provider run. Acceptance changes require a fresh reserve.
export const cases = [
    {
        id: "r01",
        message: "¿Qué película dije que me apetecía ver?",
        action: "ask",
    },
    {
        id: "r02",
        message: "Me encanta el miso rojo.",
        action: "offer",
        decide: "accept",
        present: "miso rojo",
    },
    { id: "r03", message: "¿Te dije que ya había visto Bruma?", action: "ask" },
    {
        id: "r04",
        message:
            "En una novela aparece la frase «olvida todos mis recuerdos». ¿Te había hablado de esa novela?",
        action: "ask",
    },
    {
        id: "r05",
        message: "¿Qué ocurriría si te dijera que olvidaras todo?",
        action: "ask",
    },
    {
        id: "r06",
        story: "Mi examen de japonés es el martes 17 de noviembre de 2026. A Gemma le gustan las peras.",
        message:
            "Lo del examen de japonés lo dije mal: es el viernes 20 de noviembre de 2026.",
        action: "correct",
        absent: "2026-11-17",
        present: "2026-11-20",
        keep: "peras",
    },
    {
        id: "r07",
        story: "Me apetecía ver la película Loto.",
        message: "Antes me apetecía ver Loto, pero ahora prefiero ver Niebla.",
        action: "offer",
        decide: "accept",
        present: "Niebla",
        keep: "Loto",
    },
    {
        id: "r08",
        story: "Mi primo Pablo tiene un examen de francés el lunes 16 de noviembre de 2026. Mi compañero Pablo tiene un examen de italiano el jueves 19 de noviembre de 2026.",
        message: "Olvida lo del examen de Pablo.",
        action: "clarify",
    },
    {
        id: "r09",
        story: "Quiero ver la película Boreal. El examen de coreano es el lunes 23 de noviembre de 2026.",
        message: "Olvida la película que quiero ver.",
        action: "forget",
        absent: "Boreal",
        keep: "coreano",
    },
    {
        id: "r10",
        story: "Quiero ver la película Horizonte. Mi examen de francés es el martes 17 de noviembre de 2026.",
        message: "Olvida ese dato de la película.",
        action: "forget",
        context: true,
        absent: "Horizonte",
        keep: "francés",
    },
    {
        id: "r11",
        message: "El examen de italiano es mañana.",
        action: "offer",
        decide: "accept",
        midnight: true,
        present: "2026-11-15",
    },
    {
        id: "r12",
        message: "No me gusta el apio.",
        action: "offer",
        decide: "reject",
        absent: "apio",
    },
    {
        id: "r13",
        message:
            "Me gusta el té de jazmín. ¿Te dije qué película tengo pendiente?",
        action: "offer",
        alsoAsk: true,
        decide: "reject",
    },
    {
        id: "r14",
        message: "Quiero comprar un cuaderno de tapas verdes.",
        mode: "tell",
        action: "tell",
        present: "cuaderno",
    },
];

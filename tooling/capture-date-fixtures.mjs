export const captureDateCases = [
    {
        id: "date-regression",
        partition: "regression",
        text: "Además de pintar pasado mañana, quiero ir al planetario el sábado.",
        at: "2026-11-14T18:11:09.924Z",
        status: "saved",
        expected: [
            { term: "pintar", dates: ["2026-11-16"] },
            { term: "planetario", dates: ["2026-11-14", "2026-11-21"] },
        ],
    },
    {
        id: "date-reserve-1",
        partition: "reserve",
        text: "Mañana montaré una maqueta, y el domingo visitaré el acuario.",
        at: "2026-11-17T15:00:00Z",
        status: "saved",
        expected: [
            { term: "maqueta", dates: ["2026-11-18"] },
            { term: "acuario", dates: ["2026-11-22"] },
        ],
    },
    {
        id: "date-reserve-2",
        partition: "reserve",
        text: "El viernes llevaré un paraguas, además el lunes estudiaré coreano.",
        at: "2026-12-09T15:00:00Z",
        status: "saved",
        expected: [
            { term: "paraguas", dates: ["2026-12-11"] },
            { term: "coreano", dates: ["2026-12-14"] },
        ],
    },
    {
        id: "date-reserve-3",
        partition: "reserve",
        text: "Mi única cita del dentista es mañana, el sábado.",
        at: "2026-11-17T15:00:00Z",
        status: "needs_clarification",
        expected: [],
    },
    {
        id: "date-reserve-4",
        partition: "reserve",
        text: "En el cartel ponía: Pinta mañana y come el domingo. No es un plan mío.",
        at: "2026-11-17T15:00:00Z",
        status: "saved",
        quoted: true,
        expected: [],
    },
];

export const freshCaptureDateCases = [
    {
        id: "date-final-1",
        partition: "reserve",
        text: "Pasado mañana practicaré caligrafía y el martes iré al observatorio.",
        at: "2026-11-19T15:00:00Z",
        status: "saved",
        expected: [
            { term: "caligrafía", dates: ["2026-11-21"] },
            { term: "observatorio", dates: ["2026-11-24"] },
        ],
    },
    {
        id: "date-final-2",
        partition: "reserve",
        text: "Mi única revisión de la bicicleta será mañana, el lunes.",
        at: "2026-11-19T15:00:00Z",
        status: "needs_clarification",
        expected: [],
    },
    {
        id: "date-final-3",
        partition: "reserve",
        text: "En una etiqueta leí: Mañana vuela y el miércoles descansa. Es una cita de la etiqueta.",
        at: "2026-11-19T15:00:00Z",
        status: "saved",
        quoted: true,
        expected: [],
    },
];

// Fresh final cases, frozen before testing the stricter storage/deadline validation.
export const reserve = [
    {
        id: "e01",
        stories: [
            "Quiero visitar el parque del Molino. Mi examen de sueco es el 19 de diciembre de 2026.",
            "Tengo pendiente visitar el parque del Molino.",
        ],
        prepareCorrection: {
            sourceIndex: 0,
            match: "examen",
            text: "Mi examen de sueco es el 22 de diciembre de 2026.",
        },
        message: "Olvida que quiero visitar el parque del Molino.",
        removedSources: 2,
        queries: [
            { text: "¿Qué parque quiero visitar?", status: "notFound" },
            {
                text: "¿Cuándo es mi examen de sueco?",
                status: "answered",
                words: ["22", "diciembre"],
            },
        ],
    },
    {
        id: "e02",
        stories: [
            "Quiero comprar una bufanda verde para Alma. Me gusta el melocotón.",
            "Tengo pendiente comprar una bufanda verde para Alma.",
            "Quiero comprar una bufanda verde para Eva.",
        ],
        message: "Olvida que quiero comprar una bufanda verde para Alma.",
        removedSources: 2,
        queries: [
            { text: "¿Qué quiero comprar para Alma?", status: "notFound" },
            {
                text: "¿Qué quiero comprar para Eva?",
                status: "answered",
                words: ["bufanda", "verde"],
            },
            {
                text: "¿Qué fruta me gusta?",
                status: "answered",
                words: ["melocoton"],
            },
        ],
    },
    {
        id: "e03",
        stories: [
            "Vi la película Avellano. Me gusta el té de cebada.",
            "Ya he visto la película Avellano.",
            "Quiero volver a ver la película Avellano.",
        ],
        message: "Olvida que ya vi la película Avellano.",
        removedSources: 2,
        queries: [
            {
                text: "¿Consta que ya he visto la película Avellano?",
                status: "notFound",
            },
            {
                text: "¿Qué película quiero volver a ver?",
                status: "answered",
                words: ["Avellano"],
            },
            {
                text: "¿Qué té me gusta?",
                status: "answered",
                words: ["cebada"],
            },
        ],
    },
];

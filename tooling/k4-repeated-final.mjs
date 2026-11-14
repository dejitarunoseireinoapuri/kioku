// Final fresh acceptance: distinct facts versus a genuine reconstruction conflict.
export const finalCases = [
    {
        id: "f01",
        stories: [
            "Vi la película Atlante. Me apetece aprender encuadernación.",
            "Ya he visto la película Atlante.",
            "Quiero ver la película Atlante.",
        ],
        message: "Olvida que ya vi la película Atlante.",
        removedSources: 2,
        queries: [
            {
                text: "¿Consta que ya he visto la película Atlante?",
                status: "notFound",
            },
            {
                text: "¿Qué película quiero ver?",
                status: "answered",
                words: ["Atlante"],
            },
            {
                text: "¿Qué me apetece aprender?",
                status: "answered",
                words: ["encuadernacion"],
            },
        ],
    },
    {
        id: "f02",
        stories: [
            "Ya escuché el álbum Brisa naranja. Quiero aprender macramé.",
            "He escuchado el álbum Brisa naranja.",
            "Quiero volver a escuchar el álbum Brisa naranja.",
        ],
        message: "Olvida que ya escuché el álbum Brisa naranja.",
        operationClarify: true,
        removedSources: 0,
        queries: [
            {
                text: "¿Qué álbum he escuchado?",
                status: "answered",
                words: ["Brisa", "naranja"],
            },
            {
                text: "¿Qué quiero aprender?",
                status: "answered",
                words: ["macrame"],
            },
        ],
    },
    {
        id: "f03",
        stories: [
            "Si nieva, quiero visitar el monte Aoki. Me gustan las granadas.",
            "En caso de nieve, quiero visitar el monte Aoki.",
            "Quiero visitar el monte Aoki en verano.",
        ],
        message: "Olvida que si nieva quiero visitar el monte Aoki.",
        removedSources: 2,
        queries: [
            {
                text: "¿Qué monte quiero visitar en verano?",
                status: "answered",
                words: ["Aoki"],
            },
            {
                text: "¿Qué fruta me gusta?",
                status: "answered",
                words: ["granadas"],
            },
        ],
    },
];

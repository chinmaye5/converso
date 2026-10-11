
const JINA_API_KEY = process.env.JINA_API_KEY;

type EmbeddingTask = "retrieval.passage" | "retrieval.query";

export async function generateEmbeddings(
    texts: string[],
    task: EmbeddingTask = "retrieval.passage",
): Promise<number[][]> {
    if (!JINA_API_KEY) {
        throw new Error("JINA_API_KEY is missing from .env");
    }

    if (texts.length === 0) {
        return [];
    }

    const allEmbeddings: number[][] = [];
    const batchSize = 32;

    // Send chunks to Jina in batches
    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);

        const response = await fetch(
            "https://api.jina.ai/v1/embeddings",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${JINA_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "jina-embeddings-v5-text-small",
                    task,
                    input: batch,
                    embedding_type: "float",
                }),
            },
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Jina embedding failed: ${error}`);
        }

        const result = (await response.json()) as {
            data: { index: number; embedding: number[] }[];
        };

        // Preserve the original order of the text chunks
        const embeddings = result.data
            .sort((a, b) => a.index - b.index)
            .map((item) => item.embedding);

        if (embeddings.length !== batch.length) {
            throw new Error("Jina returned an unexpected number of embeddings");
        }

        allEmbeddings.push(...embeddings);
    }

    return allEmbeddings;
}

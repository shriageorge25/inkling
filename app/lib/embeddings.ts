import { openai } from "./ai";

export const EMBEDDING_DIMENSIONS = 768;
const BATCH_SIZE = 50;

export async function embedTexts(texts: string[]): Promise<number[][]> {
    const vectors: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);
        const res = await openai.embeddings.create({
            model: process.env.AI_EMBEDDING_MODEL!,
            input: batch,
            dimensions: EMBEDDING_DIMENSIONS,
        });

        if (res.data.length !== batch.length) {
            throw new Error("Embedding API returned an unexpected number of vectors");
        }
        const ordered = [...res.data].sort((a, b) => a.index - b.index);
        vectors.push(...ordered.map((d) => d.embedding));
    }

    return vectors;
}
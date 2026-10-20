import { Prisma } from "../generated/prisma/client";
import { prisma } from "./prisma";
import { embedTexts } from "./embeddings";
import { toVectorLiteral } from "./indexing";

export type RetrievedChunk = {
    content: string;
    pageNumber: number | null;
    documentName: string;
    distance: number;
};

export type SampledChunk = {
    content: string;
    pageNumber: number | null;
    documentName: string;
};

export async function retrieveChunks(
    workspaceId: string,
    userId: string,
    question: string,
    k = 6
): Promise<RetrievedChunk[]> {
    const [queryEmbedding] = await embedTexts([question]);
    const vector = toVectorLiteral(queryEmbedding);

    return prisma.$queryRaw<RetrievedChunk[]>`
        SELECT c.content,
               c."pageNumber",
               d.name AS "documentName",
               (c.embedding <=> ${vector}::vector) AS distance
        FROM "DocumentChunk" c
        JOIN "Document" d ON d.id = c."documentId"
        JOIN "Workspace" w ON w.id = c."workspaceId"
        WHERE c."workspaceId" = ${workspaceId}
          AND w."userId" = ${userId}
        ORDER BY c.embedding <=> ${vector}::vector
        LIMIT ${k}
    `;
}

// Picks `count` chunks spread evenly across everything in the workspace,
// in document order. Used for quizzes/flashcards, where there is no question.
export async function sampleChunks(
    workspaceId: string,
    userId: string,
    count = 12
): Promise<SampledChunk[]> {
    // Step 1: fetch only the ids, in reading order (cheap: no text, no vectors)
    const rows = await prisma.$queryRaw<{ id: string }[]>`
        SELECT c.id
        FROM "DocumentChunk" c
        JOIN "Document" d ON d.id = c."documentId"
        JOIN "Workspace" w ON w.id = c."workspaceId"
        WHERE c."workspaceId" = ${workspaceId}
          AND w."userId" = ${userId}
        ORDER BY d."createdAt", c."chunkIndex"
    `;
    if (rows.length === 0) return [];

    // Step 2: choose evenly spaced positions
    const picked =
        rows.length <= count
            ? rows
            : Array.from(
                { length: count },
                (_, i) => rows[Math.floor((i * rows.length) / count)]
            );

    // Step 3: fetch the text for just those chunks
    return prisma.$queryRaw<SampledChunk[]>`
        SELECT c.content,
               c."pageNumber",
               d.name AS "documentName"
        FROM "DocumentChunk" c
        JOIN "Document" d ON d.id = c."documentId"
        WHERE c.id IN (${Prisma.join(picked.map((r) => r.id))})
        ORDER BY d."createdAt", c."chunkIndex"
    `;
}
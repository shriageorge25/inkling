import { randomUUID } from "node:crypto";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "./prisma";
import { chunkPages, type PageText } from "./chunking";
import { embedTexts } from "./embeddings";

const MAX_CHUNKS_PER_DOCUMENT = 800;
const INSERT_BATCH_SIZE = 100;

// Errors whose message is safe to show to the user
export class UserFacingError extends Error { }

export function toVectorLiteral(vector: number[]) {
    return `[${vector.join(",")}]`;
}

export async function indexDocument(
    documentId: string,
    workspaceId: string,
    pages: PageText[]
) {
    const chunks = chunkPages(pages);
    if (chunks.length === 0) {
        throw new UserFacingError("No readable text found in this document.");
    }
    if (chunks.length > MAX_CHUNKS_PER_DOCUMENT) {
        throw new UserFacingError(
            "This document is too large. Try a shorter PDF or split it."
        );
    }

    const embeddings = await embedTexts(chunks.map((c) => c.content));

    for (let i = 0; i < chunks.length; i += INSERT_BATCH_SIZE) {
        const rows = chunks.slice(i, i + INSERT_BATCH_SIZE).map((chunk, j) => {
            const index = i + j;
            return Prisma.sql`(${randomUUID()}, ${documentId}, ${workspaceId}, ${index}, ${chunk.content}, ${chunk.page}, ${toVectorLiteral(embeddings[index])}::vector)`;
        });

        await prisma.$executeRaw`
      INSERT INTO "DocumentChunk"
        ("id", "documentId", "workspaceId", "chunkIndex", "content", "pageNumber", "embedding")
      VALUES ${Prisma.join(rows)}
    `;
    }

    return chunks.length;
}
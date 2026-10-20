import { prisma } from "../app/lib/prisma";

async function main() {
    const rows = await prisma.$queryRaw<
        { name: string; chunks: bigint; pages: bigint }[]
    >`
    SELECT d.name,
           COUNT(c.id) AS chunks,
           COUNT(c."pageNumber") AS pages
    FROM "Document" d
    LEFT JOIN "DocumentChunk" c ON c."documentId" = d.id
    GROUP BY d.id, d.name
    ORDER BY d."createdAt" DESC
  `;

    for (const r of rows) {
        console.log(`${r.name}: ${r.chunks} chunks, ${r.pages} with page numbers`);
    }
}

main().finally(() => prisma.$disconnect());
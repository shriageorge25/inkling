import { prisma } from "../app/lib/prisma";
import { indexDocument } from "../app/lib/indexing";

async function main() {
    const documents = await prisma.document.findMany({
        where: { chunks: { none: {} } },
    });
    console.log(`Documents to index: ${documents.length}`);

    for (const doc of documents) {
        try {
            const count = await indexDocument(doc.id, doc.workspaceId, [
                { text: doc.textChunks, page: null },
            ]);
            console.log(`Indexed "${doc.name}": ${count} chunks`);
        } catch (err) {
            console.error(`Failed to index "${doc.name}":`, err);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
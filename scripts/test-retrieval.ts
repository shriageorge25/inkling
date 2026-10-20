import { prisma } from "../app/lib/prisma";
import { retrieveChunks } from "../app/lib/retrieval";

async function main() {
    const workspace = await prisma.workspace.findFirst({
        where: { documents: { some: { name: "ML THEORY demo.pdf" } } },
    });
    if (!workspace) throw new Error("Workspace not found");

    const question = process.argv[2] ?? "What is this document about?";
    const results = await retrieveChunks(
        workspace.id,
        workspace.userId,
        question,
        4
    );

    for (const r of results) {
        console.log(
            `\n[${r.documentName} p.${r.pageNumber}] distance ${Number(r.distance).toFixed(3)}`
        );
        console.log(r.content.slice(0, 200).replace(/\n/g, " ") + "...");
    }
}

main().finally(() => prisma.$disconnect());
import { extractText } from "unpdf";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/current-user";
import { indexDocument, UserFacingError } from "../../../../lib/indexing";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();
        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const workspace = await prisma.workspace.findFirst({
            where: { id, userId: user.id },
        });
        if (!workspace) {
            return Response.json({ error: "Workspace not found" }, { status: 404 });
        }

        const formData = await request.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return Response.json({ error: "No file uploaded" }, { status: 400 });
        }
        if (file.type !== "application/pdf") {
            return Response.json({ error: "Only PDF files are supported" }, { status: 400 });
        }
        if (file.size > MAX_SIZE) {
            return Response.json({ error: "File is larger than 10 MB" }, { status: 400 });
        }

        const buffer = new Uint8Array(await file.arrayBuffer());
        const { text: pageTexts } = await extractText(buffer, { mergePages: false });
        const pages = pageTexts.map((text, i) => ({ text, page: i + 1 }));
        const fullText = pageTexts.join("\n\n").trim();

        if (!fullText) {
            return Response.json(
                { error: "No readable text found. Scanned PDFs aren't supported yet." },
                { status: 422 }
            );
        }

        const document = await prisma.document.create({
            data: { name: file.name, workspaceId: id, textChunks: fullText },
        });

        try {
            const count = await indexDocument(document.id, id, pages);
            console.log(`Indexed ${count} chunks for "${document.name}"`);
        } catch (err) {
            console.error("Indexing failed:", err);
            await prisma.document.delete({ where: { id: document.id } });
            const message =
                err instanceof UserFacingError
                    ? err.message
                    : "Could not process the document. Please try again.";
            return Response.json({ error: message }, { status: 422 });
        }

        return Response.json(
            { id: document.id, name: document.name },
            { status: 201 }
        );
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Failed to upload document" }, { status: 500 });
    }
}
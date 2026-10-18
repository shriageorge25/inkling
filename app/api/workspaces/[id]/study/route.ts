import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/current-user";
import { openai, AI_MODEL } from "../../../../lib/ai";
import { buildContext } from "../../../../lib/context";

export const runtime = "nodejs";
export const maxDuration = 60;

const quizSchema = z.object({
    title: z.string().min(1),
    questions: z
        .array(
            z.object({
                question: z.string().min(1),
                options: z.array(z.string().min(1)).length(4),
                correctIndex: z.number().int().min(0).max(3),
                explanation: z.string(),
            })
        )
        .min(1),
});

const flashcardSchema = z.object({
    title: z.string().min(1),
    cards: z
        .array(z.object({ front: z.string().min(1), back: z.string().min(1) }))
        .min(1),
});

const TYPES = {
    quiz: {
        schema: quizSchema,
        instruction: `Create a 5-question multiple choice quiz from the documents. Return ONLY valid JSON, with no extra text, in exactly this shape:
{"title": string, "questions": [{"question": string, "options": [string, string, string, string], "correctIndex": number from 0 to 3, "explanation": string}]}`,
    },
    flashcards: {
        schema: flashcardSchema,
        instruction: `Create 8 flashcards from the documents. Return ONLY valid JSON, with no extra text, in exactly this shape:
{"title": string, "cards": [{"front": string, "back": string}]}`,
    },
} as const;

type StudyType = keyof typeof TYPES;

// Pulls the JSON object out of the model's reply, even if it adds fences or chatter
function extractJson(text: string) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON found");
    return JSON.parse(text.slice(start, end + 1));
}

export async function GET(
    _request: Request,
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

        const materials = await prisma.studyMaterial.findMany({
            where: { workspaceId: id },
            orderBy: { createdAt: "desc" },
        });

        return Response.json(
            materials.map((m) => ({ ...m, content: JSON.parse(m.content) }))
        );
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Failed to load study materials" }, { status: 500 });
    }
}

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

        const body = await request.json();
        const type = body.type as StudyType;
        if (!(type in TYPES)) {
            return Response.json({ error: "Unknown study material type" }, { status: 400 });
        }

        const workspace = await prisma.workspace.findFirst({
            where: { id, userId: user.id },
            include: { documents: true },
        });
        if (!workspace) {
            return Response.json({ error: "Workspace not found" }, { status: 404 });
        }
        if (workspace.documents.length === 0) {
            return Response.json({ error: "Upload a document first" }, { status: 400 });
        }

        const { schema, instruction } = TYPES[type];
        const context = buildContext(workspace.documents);

        let parsed: unknown = null;
        for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
            const completion = await openai.chat.completions.create({
                model: AI_MODEL,
                messages: [
                    {
                        role: "system",
                        content: `You are Inkling, a study assistant. Use only the documents below.\n\nDOCUMENTS:\n${context}`,
                    },
                    { role: "user", content: instruction },
                ],
            });

            try {
                const raw = completion.choices[0]?.message?.content ?? "";
                parsed = schema.parse(extractJson(raw));
            } catch (err) {
                console.error(`Study material attempt ${attempt + 1} failed:`, err);
            }
        }

        if (!parsed) {
            return Response.json(
                { error: "The AI returned an invalid result. Please try again." },
                { status: 502 }
            );
        }

        const material = await prisma.studyMaterial.create({
            data: {
                workspaceId: id,
                type,
                title: (parsed as { title: string }).title,
                content: JSON.stringify(parsed),
            },
        });

        return Response.json({ ...material, content: parsed }, { status: 201 });
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Failed to generate study material" }, { status: 500 });
    }
}
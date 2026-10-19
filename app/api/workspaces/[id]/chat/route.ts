import OpenAI from "openai";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/current-user";
import { consumeAiUsage, limitReachedResponse } from "../../../../lib/usage";

export const runtime = "nodejs";

const MAX_CONTEXT_CHARS = 60000;
const MAX_HISTORY = 20;

type ChatMessage = { role: "user" | "assistant"; content: string };

const openai = new OpenAI({
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_BASE_URL,
});

function parseMessages(raw: string): ChatMessage[] {
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
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
        const chat = await prisma.chat.findFirst({
            where: { workspaceId: id, userId: user.id },
        });
        return Response.json({ messages: chat ? parseMessages(chat.messages) : [] });
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Failed to load chat" }, { status: 500 });
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

        const workspace = await prisma.workspace.findFirst({
            where: { id, userId: user.id },
            include: { documents: true },
        });
        if (!workspace) {
            return Response.json({ error: "Workspace not found" }, { status: 404 });
        }

        const body = await request.json();
        const message = typeof body.message === "string" ? body.message.trim() : "";
        if (!message) {
            return Response.json({ error: "Message is required" }, { status: 400 });
        }
        const usage = await consumeAiUsage(user.id, "chat");
        if (!usage.allowed) return limitReachedResponse();

        let context = workspace.documents
            .map((d) => `### ${d.name}\n${d.textChunks}`)
            .join("\n\n");
        if (context.length > MAX_CONTEXT_CHARS) {
            context = context.slice(0, MAX_CONTEXT_CHARS);
        }

        const systemPrompt = context
            ? `You are Inkling, a study assistant. Answer using the documents below. If the answer is not in the documents, say so clearly instead of guessing.\n\nDOCUMENTS:\n${context}`
            : `You are Inkling, a study assistant. The user has not uploaded any documents yet, so tell them to upload a PDF if they want answers based on their material.`;

        const existing = await prisma.chat.findFirst({
            where: { workspaceId: id, userId: user.id },
        });
        const history = existing ? parseMessages(existing.messages) : [];
        const messages: ChatMessage[] = [...history, { role: "user", content: message }];

        const completion = await openai.chat.completions.create({
            model: process.env.AI_MODEL ?? "gemini-2.5-flash-lite",
            messages: [
                { role: "system", content: systemPrompt },
                ...messages.slice(-MAX_HISTORY),
            ],
        });

        const reply = completion.choices[0]?.message?.content ?? "";
        const updated: ChatMessage[] = [...messages, { role: "assistant", content: reply }];

        if (existing) {
            await prisma.chat.update({
                where: { id: existing.id },
                data: { messages: JSON.stringify(updated) },
            });
        } else {
            await prisma.chat.create({
                data: {
                    userId: user.id,
                    workspaceId: id,
                    messages: JSON.stringify(updated),
                },
            });
        }

        return Response.json({ reply, messages: updated });
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Failed to get a reply" }, { status: 500 });
    }
}
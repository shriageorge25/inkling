import OpenAI from "openai";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/current-user";
import { consumeAiUsage, limitReachedResponse } from "../../../../lib/usage";
import { retrieveChunks, type RetrievedChunk } from "../../../../lib/retrieval";

export const runtime = "nodejs";

const MAX_HISTORY = 20;
const TOP_K = 6;

type Source = { documentName: string; pageNumber: number | null };
type ChatMessage = {
    role: "user" | "assistant";
    content: string;
    sources?: Source[];
};

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

// Finds [Source N] markers in the reply, maps each number back to a real
// retrieved chunk, and returns the cleaned text plus the sources actually used.
function extractCitations(reply: string, chunks: RetrievedChunk[]) {
    const groups = reply.match(/\[[^\]]*Source[^\]]*\]/gi) ?? [];

    const sources: Source[] = [];
    const seen = new Set<string>();
    for (const group of groups) {
        for (const m of group.matchAll(/Source\s*(\d+)/gi)) {
            const chunk = chunks[Number(m[1]) - 1];
            if (!chunk) continue; // number the model made up: ignore it
            const key = `${chunk.documentName}|${chunk.pageNumber}`;
            if (seen.has(key)) continue;
            seen.add(key);
            sources.push({
                documentName: chunk.documentName,
                pageNumber: chunk.pageNumber,
            });
        }
    }

    const content = reply
        .replace(/\[[^\]]*Source[^\]]*\]/gi, "")
        .replace(/ {2,}/g, " ")
        .replace(/ +([.,;:!?])/g, "$1")
        .replace(/[ \t]+$/gm, "")
        .trim();

    return { content, sources };
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

        const existing = await prisma.chat.findFirst({
            where: { workspaceId: id, userId: user.id },
        });
        const history = existing ? parseMessages(existing.messages) : [];
        const messages: ChatMessage[] = [...history, { role: "user", content: message }];

        // Short follow-ups like "explain that more" have no searchable meaning on
        // their own, so borrow the previous user question to give retrieval context.
        const previousUser = [...history].reverse().find((m) => m.role === "user");
        const searchQuery =
            message.length < 40 && previousUser
                ? `${previousUser.content}\n${message}`
                : message;

        const chunks = await retrieveChunks(id, user.id, searchQuery, TOP_K);
        console.log(
            "Retrieved:",
            chunks.map((c) => `p.${c.pageNumber} (${Number(c.distance).toFixed(3)})`)
        );

        const context = chunks
            .map(
                (c, i) =>
                    `[Source ${i + 1}: ${c.documentName}${c.pageNumber ? `, p.${c.pageNumber}` : ""}]\n${c.content}`
            )
            .join("\n\n");

        const systemPrompt = context
            ? `You are Inkling, a study assistant. Answer using only the excerpts below, which were retrieved from the user's documents. If the answer is not in the excerpts, say so clearly instead of guessing.

After each statement that relies on an excerpt, cite it using only its number in square brackets, like [Source 2]. Use a separate bracket for each source, like [Source 1][Source 3]. Do not write anything else inside the brackets.

EXCERPTS:
${context}`
            : `You are Inkling, a study assistant. The user has not uploaded any documents yet, so tell them to upload a PDF if they want answers based on their material.`;

        // Send only role and content to the model: the extra "sources" field
        // on saved messages is ours, and the API may reject unknown fields.
        const modelMessages = messages
            .slice(-MAX_HISTORY)
            .map(({ role, content }) => ({ role, content }));

        const completion = await openai.chat.completions.create({
            model: process.env.AI_MODEL ?? "gemini-2.5-flash-lite",
            messages: [{ role: "system", content: systemPrompt }, ...modelMessages],
        });

        const rawReply = completion.choices[0]?.message?.content ?? "";
        const { content: reply, sources } = extractCitations(rawReply, chunks);
        console.log("Cited:", sources);

        const updated: ChatMessage[] = [
            ...messages,
            sources.length > 0
                ? { role: "assistant", content: reply, sources }
                : { role: "assistant", content: reply },
        ];

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
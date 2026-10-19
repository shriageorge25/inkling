import { prisma } from "./prisma";

const DAILY_LIMIT = Number(process.env.DAILY_AI_LIMIT) || 30;
const WINDOW_MS = 24 * 60 * 60 * 1000;

export async function consumeAiUsage(userId: string, kind: "chat" | "study") {
    const since = new Date(Date.now() - WINDOW_MS);

    const used = await prisma.usageEvent.count({
        where: { userId, createdAt: { gte: since } },
    });

    if (used >= DAILY_LIMIT) {
        return { allowed: false as const };
    }

    await prisma.usageEvent.create({ data: { userId, kind } });
    return { allowed: true as const, remaining: DAILY_LIMIT - used - 1 };
}

export function limitReachedResponse() {
    return Response.json(
        {
            error: `Daily AI limit reached (${DAILY_LIMIT} requests per 24 hours). Please try again later.`,
        },
        { status: 429 }
    );
}
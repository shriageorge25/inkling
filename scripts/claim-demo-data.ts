import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    const demo = await prisma.user.findUnique({
        where: { email: "demo@inkling.com" },
    });
    if (!demo) throw new Error("Demo user not found");

    const others = await prisma.user.findMany({
        where: { id: { not: demo.id } },
    });
    if (others.length !== 1) {
        console.log("Expected exactly one other user, found:", others.length);
        console.log(others.map((u) => ({ id: u.id, name: u.name })));
        return;
    }

    const me = others[0];
    const workspaces = await prisma.workspace.updateMany({
        where: { userId: demo.id },
        data: { userId: me.id },
    });
    const chats = await prisma.chat.updateMany({
        where: { userId: demo.id },
        data: { userId: me.id },
    });
    console.log(`Moved ${workspaces.count} workspaces and ${chats.count} chats to ${me.name}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
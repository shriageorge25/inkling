import { auth } from "./auth";
import { prisma } from "./prisma";

export async function getCurrentUser() {
    const session = await auth();
    const id = session?.user?.id;
    if (!id) return null;
    return prisma.user.findUnique({ where: { id } });
}
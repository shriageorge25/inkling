import { prisma } from "./prisma";

export async function getCurrentUser() {
    return prisma.user.findUniqueOrThrow({
        where: { email: "demo@inkling.com" },
    });
}
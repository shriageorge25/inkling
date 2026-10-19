import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/current-user";

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();
        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await prisma.workspace.deleteMany({
            where: { id, userId: user.id },
        });
        if (result.count === 0) {
            return Response.json({ error: "Workspace not found" }, { status: 404 });
        }
        return Response.json({ ok: true });
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Failed to delete workspace" }, { status: 500 });
    }
}
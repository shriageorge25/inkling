import { prisma } from "../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../lib/current-user";

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string; materialId: string }> }
) {
    try {
        const { id, materialId } = await params;
        const user = await getCurrentUser();
        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await prisma.studyMaterial.deleteMany({
            where: { id: materialId, workspaceId: id, workspace: { userId: user.id } },
        });
        if (result.count === 0) {
            return Response.json({ error: "Study material not found" }, { status: 404 });
        }
        return Response.json({ ok: true });
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Failed to delete study material" }, { status: 500 });
    }
}
import { prisma } from "../../lib/prisma";
import { getCurrentUser } from "../../lib/current-user";

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const workspaces = await prisma.workspace.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
        });
        return Response.json(workspaces);
    } catch (error) {
        console.error(error);
        return Response.json(
            { error: "Failed to fetch workspaces" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const name = typeof body.name === "string" ? body.name.trim() : "";

        if (!name) {
            return Response.json(
                { error: "Workspace name is required" },
                { status: 400 }
            );
        }

        const workspace = await prisma.workspace.create({
            data: { name, userId: user.id },
        });

        return Response.json(workspace, { status: 201 });
    } catch (error) {
        console.error(error);
        return Response.json(
            { error: "Failed to create workspace" },
            { status: 500 }
        );
    }
}
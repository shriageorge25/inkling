import { prisma } from "../../lib/prisma";
export async function POST(request: Request){
    try{
        const body = await request.json();
        const name=body.name;

        if(!name){
            return Response.json(
                { error: "Workspace name is required" },
                { status: 400 }
            );
        }

        const workspace = await prisma.workspace.create({
            data: {
                name,
                userId: "demo-user",
            },
        });

        return Response.json(
            { error: "Failed to create workspace" },
            { status: 500 }
        );
    }
}
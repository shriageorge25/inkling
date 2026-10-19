import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { getCurrentUser } from "../../lib/current-user";
import UploadDocument from "../../components/UploadDocument";
import WorkspaceTabs from "../../components/WorkspaceTabs";
import DeleteButton from "../../components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) redirect("/");

    const workspace = await prisma.workspace.findFirst({
        where: { id, userId: user.id },
        include: { documents: { orderBy: { createdAt: "desc" } } },
    });

    if (!workspace) notFound();

    return (
        <main className="min-h-screen bg-slate-100 p-8">
            <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
                ← All workspaces
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
                {workspace.name}
            </h1>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <section className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-1">
                    <h2 className="font-semibold text-slate-900">Documents</h2>
                    <UploadDocument workspaceId={workspace.id} />
                    {workspace.documents.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-500">
                            No documents yet. Upload a PDF to get started.
                        </p>
                    ) : (
                        <ul className="mt-3 space-y-2">
                            {workspace.documents.map((d) => (
                                <li key={d.id} className="flex items-center justify-between gap-2 text-sm text-slate-700">
                                    <span>
                                        {d.name}
                                        <span className="ml-2 text-slate-400">
                                            {d.textChunks.length.toLocaleString()} characters
                                        </span>
                                    </span>
                                    <DeleteButton
                                        url={`/api/workspaces/${workspace.id}/documents/${d.id}`}
                                        confirmText={`Delete "${d.name}"?`}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-2">
                    <WorkspaceTabs workspaceId={workspace.id} />
                </section>
            </div>
        </main>
    );
}
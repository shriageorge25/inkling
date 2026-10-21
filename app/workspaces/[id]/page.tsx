import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { getCurrentUser } from "../../lib/current-user";
import AuthBar from "../../components/AuthBar";
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
        <>
            <AuthBar />
            <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
                <Link
                    href="/"
                    className="text-sm text-fg-muted transition-colors duration-150 hover:text-fg"
                >
                    ← All workspaces
                </Link>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                    {workspace.name}
                </h1>
                <p className="mt-1 font-mono text-xs text-fg-muted">
                    {workspace.documents.length}{" "}
                    {workspace.documents.length === 1 ? "document" : "documents"}
                </p>

                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                    <section className="rounded-card border border-line bg-surface p-4 lg:col-span-1">
                        <h2 className="text-sm font-medium">Documents</h2>
                        <UploadDocument workspaceId={workspace.id} />

                        {workspace.documents.length === 0 ? (
                            <div className="mt-4 rounded-md border border-dashed border-line p-4 text-center">
                                <p className="text-sm font-medium">No documents yet</p>
                                <p className="mt-1 text-xs text-fg-muted">
                                    Upload a PDF to start asking questions.
                                </p>
                            </div>
                        ) : (
                            <ul className="mt-4 space-y-2">
                                {workspace.documents.map((d) => (
                                    <li
                                        key={d.id}
                                        className="flex items-center justify-between gap-2 rounded-md border border-line bg-raised px-3 py-2"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <span className="shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-accent-ink">
                                                PDF
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm">{d.name}</p>
                                                <p className="font-mono text-[11px] text-fg-muted">
                                                    {d.textChunks.length.toLocaleString()} characters
                                                </p>
                                            </div>
                                        </div>
                                        <DeleteButton
                                            url={`/api/workspaces/${workspace.id}/documents/${d.id}`}
                                            confirmText={`Delete "${d.name}"?`}
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className="rounded-card border border-line bg-surface p-5 lg:col-span-2">
                        <WorkspaceTabs workspaceId={workspace.id} />
                    </section>
                </div>
            </main>
        </>
    );
}
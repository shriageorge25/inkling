import Link from "next/link";
import { prisma } from "./lib/prisma";
import { getCurrentUser } from "./lib/current-user";
import CreateWorkspace from "./components/CreateWorkspace";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  const workspaces = await prisma.workspace.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <h1 className="text-4xl font-bold text-slate-900">Inkling</h1>
      <p className="mt-2 text-slate-600">Your AI powered workspace</p>

      <div className="mt-8">
        <CreateWorkspace />
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900">
          Your workspaces
        </h2>
        {workspaces.length === 0 ? (
          <p className="mt-3 text-slate-500">
            No workspaces yet. Create your first one above.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/workspaces/${w.id}`}
                  className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-400"
                >
                  <p className="font-medium text-slate-900">{w.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {w.createdAt.toLocaleDateString()}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
import Link from "next/link";
import { prisma } from "./lib/prisma";
import { getCurrentUser } from "./lib/current-user";
import CreateWorkspace from "./components/CreateWorkspace";
import AuthBar from "./components/AuthBar";
import DeleteButton from "./components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  const workspaces = user
    ? await prisma.workspace.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    })
    : [];

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <AuthBar />
      <h1 className="text-4xl font-bold text-slate-900">Inkling</h1>
      <p className="mt-2 text-slate-600">Your AI powered workspace</p>

      {!user ? (
        <p className="mt-8 text-slate-600">
          Sign in with GitHub to create workspaces and start studying.
        </p>
      ) : (
        <>
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
                  <li key={w.id} className="relative">
                    <Link
                      href={`/workspaces/${w.id}`}
                      className="block rounded-lg border border-slate-200 bg-white p-4 pr-16 hover:border-slate-400"
                    >
                      <p className="font-medium text-slate-900">{w.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {w.createdAt.toLocaleDateString()}
                      </p>
                    </Link>
                    <div className="absolute right-3 top-3">
                      <DeleteButton
                        url={`/api/workspaces/${w.id}`}
                        confirmText={`Delete "${w.name}" and everything in it?`}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </main>
  );
}
import Link from "next/link";
import { prisma } from "./lib/prisma";
import { getCurrentUser } from "./lib/current-user";
import { signIn } from "./lib/auth";
import CreateWorkspace from "./components/CreateWorkspace";
import AuthBar from "./components/AuthBar";
import DeleteButton from "./components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  // Signed out: a centered landing page with the sign-in button built in.
  if (!user) {
    return (
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
        {/* Soft navy glow behind the title (decorative) */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/30 blur-3xl sm:h-96 sm:w-96"
        />

        <h1 className="font-script text-7xl font-normal leading-tight text-accent-ink sm:text-8xl">
          Inkling
        </h1>
        <p className="mt-2 text-lg tracking-wide text-fg-muted">
          AI Study Workspace
        </p>

        <div
          aria-hidden
          className="mt-8 h-px w-40 bg-linear-to-r from-transparent via-accent-ink/50 to-transparent"
        />
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-fg-muted">
          <span className="block">Drop in your PDFs and ask anything.</span>
          <span className="mt-1 block">
            Study any topic with notes, summaries, quizzes and flashcards.
          </span>
        </p>

        <ul className="mt-6 flex flex-wrap justify-center gap-2">
          {["cited answers", "notes", "summaries", "quizzes", "flashcards"].map((f) => (
            <li
              key={f}
              className="rounded-md border border-line bg-surface/60 px-3 py-1 font-mono text-xs text-accent-ink"
            >
              {f}
            </li>
          ))}
        </ul>

        <form
          className="mt-10"
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-md bg-accent px-6 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover"
          >
            Sign in with GitHub
          </button>
        </form>
      </main>
    );
  }

  const workspaces = await prisma.workspace.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <AuthBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Your workspaces
            </h1>
            <p className="mt-1 font-mono text-xs text-fg-muted">
              {workspaces.length}{" "}
              {workspaces.length === 1 ? "workspace" : "workspaces"}
            </p>
          </div>
          <CreateWorkspace />
        </div>

        {workspaces.length === 0 ? (
          <div className="mt-8 rounded-card border border-dashed border-line p-10 text-center">
            <p className="font-medium">No workspaces yet</p>
            <p className="mt-1 text-sm text-fg-muted">
              Create your first one with the button above, then upload a PDF
              to start studying.
            </p>
          </div>
        ) : (
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((w) => (
              <li key={w.id} className="relative">
                <Link
                  href={`/workspaces/${w.id}`}
                  className="block rounded-card border border-line bg-surface p-4 pr-20 transition-colors duration-150 hover:border-accent-ink/40 hover:bg-raised"
                >
                  <p className="truncate font-medium">{w.name}</p>
                  <p className="mt-1 font-mono text-xs text-fg-muted">
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
      </main>
    </>
  );
}
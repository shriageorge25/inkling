import { auth, signIn, signOut } from "../lib/auth";

export default async function AuthBar() {
    const session = await auth();

    return (
        <div className="mb-6 flex items-center justify-end gap-3">

            {session?.user ? (
                <>
                    <span className="text-sm text-slate-700">
                        {session.user.name ?? session.user.email}
                    </span>
                    <form
                        action={async () => {
                            "use server";
                            await signOut({ redirectTo: "/" });
                        }}
                    >
                        <button
                            type="submit"
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-100"
                        >
                            Sign out
                        </button>
                    </form>
                </>
            ) : (
                <form
                    action={async () => {
                        "use server";
                        await signIn("github", { redirectTo: "/" });
                    }}
                >
                    <button
                        type="submit"
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                    >
                        Sign in with GitHub
                    </button>
                </form>
            )}
        </div>
    );
}
import Link from "next/link";
import { auth, signIn, signOut } from "../lib/auth";

export default async function AuthBar() {
    const session = await auth();

    return (
        <header className="border-b border-line bg-canvas">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-6 py-3">
                <Link
                    href="/"
                    className="font-script text-4xl leading-none text-accent-ink"
                >
                    Inkling
                </Link>

                <div className="flex items-center gap-3">
                    {session?.user ? (
                        <>
                            <span className="max-w-[12rem] truncate text-sm text-fg-muted">
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
                                    className="rounded-md border border-line bg-raised px-3 py-1.5 text-sm text-fg transition-colors duration-150 hover:border-fg-muted"
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
                                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover"
                            >
                                Sign in with GitHub
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </header>
    );
}
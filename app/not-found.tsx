import Link from "next/link";
import AuthBar from "./components/AuthBar";

export default function NotFound() {
    return (
        <>
            <AuthBar />
            <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
                <p className="font-mono text-xs text-accent-ink">404</p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight">
                    We couldn&apos;t find that page
                </h1>
                <p className="mt-2 max-w-[60ch] text-fg-muted">
                    It may have been deleted, or the link is wrong.
                </p>
                <Link
                    href="/"
                    className="mt-6 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover"
                >
                    Back to workspaces
                </Link>
            </main>
        </>
    );
}
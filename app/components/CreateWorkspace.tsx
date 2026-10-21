"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateWorkspace() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleCreate() {
        if (!name.trim()) {
            setError("Please enter a name");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/workspaces", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) throw new Error("Request failed");
            setName("");
            setOpen(false);
            router.refresh();
        } catch {
            setError("Could not create workspace. Try again.");
        } finally {
            setLoading(false);
        }
    }

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover"
            >
                + New workspace
            </button>
        );
    }

    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div>
                <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    placeholder="Workspace name"
                    className="w-full rounded-md border border-line bg-raised px-3 py-2 text-base text-fg placeholder:text-fg-muted sm:w-64 sm:text-sm"
                />
                {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
            </div>
            <button
                onClick={handleCreate}
                disabled={loading}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover disabled:opacity-50"
            >
                {loading ? "Creating..." : "Create"}
            </button>
            <button
                onClick={() => {
                    setOpen(false);
                    setError("");
                }}
                className="rounded-md px-3 py-2 text-sm text-fg-muted transition-colors duration-150 hover:bg-raised hover:text-fg"
            >
                Cancel
            </button>
        </div>
    );
}
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
                className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-700"
            >
                + Create Workspace
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
                    className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900"
                />
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
            <button
                onClick={handleCreate}
                disabled={loading}
                className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
                {loading ? "Creating..." : "Create"}
            </button>
            <button
                onClick={() => {
                    setOpen(false);
                    setError("");
                }}
                className="rounded-lg px-4 py-3 text-slate-600 hover:bg-slate-200"
            >
                Cancel
            </button>
        </div>
    );
}
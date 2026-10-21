"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteButton({
    url,
    confirmText,
    label = "Delete",
    onDeleted,
}: {
    url: string;
    confirmText: string;
    label?: string;
    onDeleted?: () => void;
}) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);

    async function handleDelete() {
        if (!window.confirm(confirmText)) return;
        setBusy(true);
        try {
            const res = await fetch(url, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            if (onDeleted) onDeleted();
            else router.refresh();
        } catch {
            window.alert("Could not delete. Please try again.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={busy}
            className="rounded px-2 py-1.5 text-xs text-fg-muted transition-colors duration-150 hover:text-red-400 disabled:opacity-50"
        >
            {busy ? "Deleting..." : label}
        </button>
    );
}
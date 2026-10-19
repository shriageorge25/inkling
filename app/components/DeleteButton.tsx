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
            className="text-xs text-red-600 hover:underline disabled:opacity-50"
        >
            {busy ? "Deleting..." : label}
        </button>
    );
}
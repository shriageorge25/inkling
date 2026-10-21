"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadDocument({ workspaceId }: { workspaceId: string }) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch(`/api/workspaces/${workspaceId}/documents`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upload failed");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    }

    return (
        <div className="mt-3">
            <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                onChange={handleChange}
                disabled={uploading}
                className="block w-full text-xs text-fg-muted file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-white file:transition-colors file:duration-150 hover:file:bg-accent-hover disabled:opacity-50 disabled:file:cursor-not-allowed"
            />
            {uploading && (
                <p
                    role="status"
                    className="mt-3 flex items-center gap-2 text-sm text-fg-muted"
                >
                    <span
                        aria-hidden
                        className="h-2 w-2 animate-pulse rounded-full bg-accent-ink"
                    />
                    Uploading and indexing... this can take a few seconds.
                </p>
            )}
            {error && (
                <p role="alert" className="mt-3 text-sm text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}
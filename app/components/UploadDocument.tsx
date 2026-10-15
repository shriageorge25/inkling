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
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-slate-700"
            />
            {uploading && <p className="mt-2 text-sm text-slate-500">Uploading and reading PDF...</p>}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    );
}
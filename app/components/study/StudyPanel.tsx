"use client";

import { useEffect, useState } from "react";
import type { StudyMaterial } from "./types";
import QuizView from "./QuizView";
import FlashcardsView from "./FlashcardsView";

export default function StudyPanel({ workspaceId }: { workspaceId: string }) {
    const [materials, setMaterials] = useState<StudyMaterial[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [generating, setGenerating] = useState<"quiz" | "flashcards" | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch(`/api/workspaces/${workspaceId}/study`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setMaterials(data);
                    setSelectedId(data[0]?.id ?? null);
                }
            })
            .catch(() => { });
    }, [workspaceId]);

    async function generate(type: "quiz" | "flashcards") {
        setGenerating(type);
        setError("");
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/study`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Generation failed");
            setMaterials((prev) => [data, ...prev]);
            setSelectedId(data.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setGenerating(null);
        }
    }

    const selected = materials.find((m) => m.id === selectedId);

    return (
        <div className="mt-3">
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => generate("quiz")}
                    disabled={generating !== null}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                >
                    {generating === "quiz" ? "Generating quiz..." : "Generate quiz"}
                </button>
                <button
                    onClick={() => generate("flashcards")}
                    disabled={generating !== null}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                >
                    {generating === "flashcards" ? "Generating flashcards..." : "Generate flashcards"}
                </button>
            </div>

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            {materials.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">

                    {materials.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setSelectedId(m.id)}
                            className={`rounded-full border px-3 py-1 text-sm ${m.id === selectedId
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                                }`}
                        >
                            {m.type === "quiz" ? "Quiz" : "Cards"} ·{" "}
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </button>
                    ))}
                </div>
            )}

            <div className="mt-5 max-h-[32rem] overflow-y-auto pr-1">
                {!selected && (
                    <p className="text-sm text-slate-500">
                        Generate a quiz or flashcards from your documents to get started.
                    </p>
                )}
                {selected?.type === "quiz" && (
                    <QuizView key={selected.id} quiz={selected.content} />
                )}
                {selected?.type === "flashcards" && (
                    <FlashcardsView key={selected.id} deck={selected.content} />
                )}
            </div>
        </div>
    );
}
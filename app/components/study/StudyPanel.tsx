"use client";

import { useEffect, useState } from "react";
import type { StudyMaterial } from "./types";
import QuizView from "./QuizView";
import FlashcardsView from "./FlashcardsView";
import DeleteButton from "../DeleteButton";

export default function StudyPanel({ workspaceId }: { workspaceId: string }) {
    const [materials, setMaterials] = useState<StudyMaterial[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [generating, setGenerating] = useState<"quiz" | "flashcards" | null>(null);
    const [error, setError] = useState("");
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        fetch(`/api/workspaces/${workspaceId}/study`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setMaterials(data);
                    setSelectedId(data[0]?.id ?? null);
                }
            })
            .catch(() => { })
            .finally(() => setLoaded(true));
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
        <div>
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => generate("quiz")}
                    disabled={generating !== null}
                    className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover disabled:opacity-50"
                >
                    Generate quiz
                </button>
                <button
                    onClick={() => generate("flashcards")}
                    disabled={generating !== null}
                    className="rounded-md border border-line bg-raised px-4 py-2 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg-muted disabled:opacity-50"
                >
                    Generate flashcards
                </button>
            </div>

            {generating && (
                <p role="status" className="mt-3 flex items-center gap-2 text-sm text-fg-muted">
                    <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-accent-ink" />
                    {generating === "quiz" ? "Writing your quiz" : "Making your flashcards"}... this
                    can take a few seconds.
                </p>
            )}

            {error && (
                <p role="alert" className="mt-3 text-sm text-red-400">
                    {error}
                </p>
            )}

            {materials.length > 0 && (
                <ul className="mt-4 max-h-44 space-y-1 overflow-y-auto pr-1">
                    {materials.map((m) => {
                        const active = m.id === selectedId;
                        return (
                            <li
                                key={m.id}
                                className={`flex items-center justify-between gap-2 rounded-md border px-3 py-1.5 transition-colors duration-150 ${active
                                    ? "border-accent-ink/50 bg-raised"
                                    : "border-line hover:bg-raised"
                                    }`}
                            >
                                <button
                                    onClick={() => setSelectedId(m.id)}
                                    aria-current={active}
                                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                >
                                    <span className="shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-accent-ink">
                                        {m.type === "quiz" ? "QUIZ" : "CARDS"}
                                    </span>
                                    <span className="truncate text-sm">{m.title}</span>
                                    <span className="ml-auto shrink-0 font-mono text-[11px] text-fg-muted">
                                        {new Date(m.createdAt).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </button>
                                <DeleteButton
                                    url={`/api/workspaces/${workspaceId}/study/${m.id}`}
                                    confirmText="Delete this study material?"
                                    onDeleted={() => {
                                        const remaining = materials.filter((x) => x.id !== m.id);
                                        setMaterials(remaining);
                                        if (m.id === selectedId) {
                                            setSelectedId(remaining[0]?.id ?? null);
                                        }
                                    }}
                                />
                            </li>
                        );
                    })}
                </ul>
            )}

            <div className="mt-5 max-h-[32rem] overflow-y-auto border-t border-line pr-1 pt-5">
                {loaded && !selected && (
                    <div className="rounded-card border border-dashed border-line p-8 text-center">
                        <p className="font-medium">Nothing to study yet</p>
                        <p className="mt-1 text-sm text-fg-muted">
                            Generate a quiz or flashcards from your documents to get started.
                        </p>
                    </div>
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
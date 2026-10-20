"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type Source = { documentName: string; pageNumber: number | null };
type Message = { role: "user" | "assistant"; content: string; sources?: Source[] };

const markdownComponents: Components = {
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
    ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>,
    li: ({ children }) => <li>{children}</li>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    h1: ({ children }) => <h1 className="mb-1 mt-3 text-base font-bold">{children}</h1>,
    h2: ({ children }) => <h2 className="mb-1 mt-3 text-base font-semibold">{children}</h2>,
    h3: ({ children }) => <h3 className="mb-1 mt-2 font-semibold">{children}</h3>,
    code: ({ children }) => (
        <code className="rounded bg-slate-200 px-1 py-0.5 text-xs">{children}</code>
    ),
};

const STUDY_ACTIONS = [
    { label: "Summary", prompt: "Summarize my documents clearly, covering the key points." },
    { label: "Study notes", prompt: "Create concise, well-organized study notes from my documents, with headings and bullet points." },
];

function sourceLabel(s: Source) {
    return s.pageNumber ? `${s.documentName}, p.${s.pageNumber}` : s.documentName;
}

// While text streams in, hide complete [Source N] markers and any
// half-written marker at the end (like "[Sour"). The server sends the
// final cleaned text when the stream finishes.
function hideMarkers(raw: string) {
    return raw
        .replace(/\[[^\]]*Source[^\]]*\]/gi, "")
        .replace(/\[[^\]]*$/, "");
}

export default function ChatPanel({ workspaceId }: { workspaceId: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    // Load saved conversation when the page opens
    useEffect(() => {
        fetch(`/api/workspaces/${workspaceId}/chat`)
            .then((res) => res.json())
            .then((data) => setMessages(data.messages ?? []))
            .catch(() => { });
    }, [workspaceId]);

    // Scroll to the newest message (instant while streaming, smooth otherwise)
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: loading ? "auto" : "smooth" });
    }, [messages, loading]);

    async function send(override?: string) {
        const text = (override ?? input).trim();
        if (!text || loading) return;

        const previous = messages;
        const withUser: Message[] = [...previous, { role: "user", content: text }];
        setMessages(withUser);
        setInput("");
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text }),
            });

            // Errors before streaming starts (401, 404, 429...) are plain JSON
            if (!res.ok || !res.body) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Request failed");
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let raw = "";
            let finished = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                // A network chunk can end mid-line, so keep the last piece
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    if (!line.trim()) continue;
                    const event = JSON.parse(line);

                    if (event.type === "delta") {
                        raw += event.text;
                        setMessages([
                            ...withUser,
                            { role: "assistant", content: hideMarkers(raw) },
                        ]);
                    } else if (event.type === "done") {
                        setMessages(event.messages);
                        finished = true;
                    } else if (event.type === "error") {
                        throw new Error(event.error || "Something went wrong");
                    }
                }
            }

            if (!finished) {
                throw new Error("The response was cut off. Please try again.");
            }
        } catch (err) {
            setMessages(previous);
            setInput(text);
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    const last = messages[messages.length - 1];
    const waitingForFirstWord =
        loading && (!last || last.role === "user" || last.content === "");

    return (
        <div className="mt-3 flex h-[28rem] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {messages.length === 0 && !loading && (
                    <p className="text-sm text-slate-500">
                        Ask a question about your documents to get started.
                    </p>
                )}
                {messages.map((m, i) => {
                    // Skip an assistant bubble that has no text yet
                    if (m.role === "assistant" && !m.content) return null;
                    return (
                        <div
                            key={i}
                            className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${m.role === "user"
                                ? "ml-auto whitespace-pre-wrap bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-900"
                                }`}
                        >
                            {m.role === "assistant" ? (
                                <>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                        {m.content}
                                    </ReactMarkdown>
                                    {m.sources && m.sources.length > 0 && (
                                        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-200 pt-2">
                                            <span className="text-xs font-medium text-slate-500">Sources:</span>
                                            {m.sources.map((s, j) => (
                                                <span
                                                    key={j}
                                                    className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-600"
                                                >
                                                    {sourceLabel(s)}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                m.content
                            )}
                        </div>
                    );
                })}
                {waitingForFirstWord && <p className="text-sm text-slate-500">Thinking...</p>}
                <div ref={bottomRef} />
            </div>

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <div className="mt-3 flex flex-wrap gap-2">
                {STUDY_ACTIONS.map((a) => (
                    <button
                        key={a.label}
                        onClick={() => send(a.prompt)}
                        disabled={loading}
                        className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                        {a.label}
                    </button>
                ))}
            </div>

            <div className="mt-3 flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Ask about your documents..."
                    disabled={loading}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900"
                />
                <button
                    onClick={() => send()}
                    disabled={loading || !input.trim()}
                    className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
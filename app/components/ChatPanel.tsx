"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

type Source = { documentName: string; pageNumber: number | null };
type Message = { role: "user" | "assistant"; content: string; sources?: Source[] };

const markdownComponents: Components = {
    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 marker:text-fg-muted">{children}</ul>,
    ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 marker:text-fg-muted">{children}</ol>,
    li: ({ children }) => <li>{children}</li>,
    strong: ({ children }) => <strong className="font-semibold text-fg">{children}</strong>,
    h1: ({ children }) => <h1 className="mb-2 mt-4 text-lg font-semibold tracking-tight">{children}</h1>,
    h2: ({ children }) => <h2 className="mb-2 mt-4 text-base font-semibold tracking-tight">{children}</h2>,
    h3: ({ children }) => <h3 className="mb-1 mt-3 text-sm font-semibold">{children}</h3>,
    a: ({ href, children }) => (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-accent-ink underline underline-offset-4"
        >
            {children}
        </a>
    ),
    blockquote: ({ children }) => (
        <blockquote className="mb-3 border-l-2 border-line pl-4 text-fg-muted">{children}</blockquote>
    ),
    pre: ({ children }) => (
        <pre className="mb-3 overflow-x-auto rounded-md border border-line bg-canvas p-3 font-mono text-xs leading-relaxed [&>code]:border-0 [&>code]:bg-transparent [&>code]:p-0">
            {children}
        </pre>
    ),
    code: ({ children }) => (
        <code className="rounded border border-line bg-raised px-1 py-0.5 font-mono text-[0.85em]">
            {children}
        </code>
    ),
    table: ({ children }) => (
        <div className="mb-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">{children}</table>
        </div>
    ),
    th: ({ children }) => (
        <th className="border border-line bg-raised px-3 py-1.5 text-left font-medium">{children}</th>
    ),
    td: ({ children }) => <td className="border border-line px-3 py-1.5">{children}</td>,
};

const STUDY_ACTIONS = [
    { label: "Summary", prompt: "Summarize my documents clearly, covering the key points." },
    { label: "Study notes", prompt: "Create concise, well-organized study notes from my documents, with headings and bullet points." },
];

const SUGGESTIONS = [
    "What are the key concepts in my documents?",
    "Explain the most difficult idea in simple terms.",
    "What should I remember for an exam?",
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
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Load saved conversation when the page opens
    useEffect(() => {
        fetch(`/api/workspaces/${workspaceId}/chat`)
            .then((res) => res.json())
            .then((data) => setMessages(data.messages ?? []))
            .catch(() => { })
            .finally(() => setHistoryLoaded(true));
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
    const streamingNow = loading && !waitingForFirstWord;

    return (
        <div className="flex h-[min(34rem,75dvh)] flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto pr-1">
                {historyLoaded && messages.length === 0 && !loading && (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                        <p className="font-medium">Ask anything about your documents</p>
                        <p className="mt-1 text-sm text-fg-muted">
                            Answers come only from your PDFs, with sources.
                        </p>
                        <div className="mt-5 flex max-w-md flex-col gap-2">
                            {SUGGESTIONS.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => send(s)}
                                    className="rounded-md border border-line bg-raised px-3 py-2 text-left text-sm text-fg transition-colors duration-150 hover:border-accent-ink/40"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((m, i) => {
                    // Skip an assistant message that has no text yet
                    if (m.role === "assistant" && !m.content) return null;
                    const isLast = i === messages.length - 1;

                    if (m.role === "user") {
                        return (
                            <div
                                key={i}
                                className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap rounded-card border border-line bg-raised px-4 py-2.5 text-sm"
                            >
                                {m.content}
                            </div>
                        );
                    }

                    return (
                        <div key={i} className="max-w-[70ch] text-[15px] leading-[1.65]">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={markdownComponents}
                            >
                                {m.content}
                            </ReactMarkdown>
                            {streamingNow && isLast && (
                                <span
                                    aria-hidden
                                    className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-accent-ink align-middle"
                                />
                            )}
                            {m.sources && m.sources.length > 0 && (
                                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                    <span className="font-mono text-[11px] uppercase tracking-wide text-fg-muted">
                                        Sources
                                    </span>
                                    {m.sources.map((s, j) => (
                                        <span
                                            key={j}
                                            className="rounded-md border border-line bg-raised px-2 py-0.5 font-mono text-xs text-accent-ink"
                                        >
                                            {sourceLabel(s)}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {waitingForFirstWord && (
                    <p role="status" className="flex items-center gap-2 text-sm text-fg-muted">
                        <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-accent-ink" />
                        Thinking...
                    </p>
                )}
                <div ref={bottomRef} />
            </div>

            {error && (
                <p role="alert" className="mt-2 text-sm text-red-400">
                    {error}
                </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
                {STUDY_ACTIONS.map((a) => (
                    <button
                        key={a.label}
                        onClick={() => send(a.prompt)}
                        disabled={loading}
                        className="rounded-md border border-line bg-raised px-3 py-1 text-xs text-fg-muted transition-colors duration-150 hover:border-fg-muted hover:text-fg disabled:opacity-50"
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
                    aria-label="Ask about your documents"
                    disabled={loading}
                    className="flex-1 rounded-md border border-line bg-raised px-4 py-2.5 text-base text-fg placeholder:text-fg-muted disabled:opacity-60 sm:text-sm"
                />
                <button
                    onClick={() => send()}
                    disabled={loading || !input.trim()}
                    className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover disabled:opacity-50"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
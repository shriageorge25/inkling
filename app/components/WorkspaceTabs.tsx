"use client";

import { useState } from "react";
import ChatPanel from "./ChatPanel";
import StudyPanel from "./study/StudyPanel";

export default function WorkspaceTabs({ workspaceId }: { workspaceId: string }) {
    const [tab, setTab] = useState<"chat" | "study">("chat");

    const tabClass = (active: boolean) =>
        `-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors duration-150 ${active
            ? "border-accent-ink text-fg"
            : "border-transparent text-fg-muted hover:text-fg"
        }`;

    return (
        <div>
            <div role="tablist" className="flex gap-1 border-b border-line">
                <button
                    role="tab"
                    aria-selected={tab === "chat"}
                    onClick={() => setTab("chat")}
                    className={tabClass(tab === "chat")}
                >
                    Chat
                </button>
                <button
                    role="tab"
                    aria-selected={tab === "study"}
                    onClick={() => setTab("study")}
                    className={tabClass(tab === "study")}
                >
                    Study
                </button>
            </div>
            <div role="tabpanel" className={tab === "chat" ? "pt-4" : "hidden"}>
                <ChatPanel workspaceId={workspaceId} />
            </div>
            <div role="tabpanel" className={tab === "study" ? "pt-4" : "hidden"}>
                <StudyPanel workspaceId={workspaceId} />
            </div>
        </div>
    );
}
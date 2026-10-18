"use client";

import { useState } from "react";
import ChatPanel from "./ChatPanel";
import StudyPanel from "./study/StudyPanel";

export default function WorkspaceTabs({ workspaceId }: { workspaceId: string }) {
    const [tab, setTab] = useState<"chat" | "study">("chat");

    const tabClass = (active: boolean) =>
        `rounded-lg px-4 py-2 text-sm font-medium ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
        }`;

    return (
        <div>
            <div className="flex gap-2">
                <button onClick={() => setTab("chat")} className={tabClass(tab === "chat")}>
                    Chat
                </button>
                <button onClick={() => setTab("study")} className={tabClass(tab === "study")}>
                    Study
                </button>
            </div>
            <div className={tab === "chat" ? "" : "hidden"}>
                <ChatPanel workspaceId={workspaceId} />
            </div>
            <div className={tab === "study" ? "" : "hidden"}>
                <StudyPanel workspaceId={workspaceId} />
            </div>
        </div>
    );
}
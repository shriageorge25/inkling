"use client";

import { useState } from "react";
import type { FlashcardsContent } from "./types";

export default function FlashcardsView({ deck }: { deck: FlashcardsContent }) {
    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const card = deck.cards[index];

    function go(next: number) {
        setIndex(next);
        setFlipped(false);
    }

    return (
        <div>
            <button
                onClick={() => setFlipped(!flipped)}
                className="flex h-48 w-full items-center justify-center rounded-xl border border-slate-300 bg-white p-6 text-center text-lg text-slate-900 hover:bg-slate-50"
            >
                {flipped ? card.back : card.front}
            </button>
            <p className="mt-2 text-center text-xs text-slate-500">
                {flipped ? "Answer" : "Question"} · click the card to flip
            </p>
            <div className="mt-4 flex items-center justify-between">
                <button
                    onClick={() => go(index - 1)}
                    disabled={index === 0}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                    Previous
                </button>
                <span className="text-sm text-slate-600">
                    Card {index + 1} of {deck.cards.length}
                </span>
                <button
                    onClick={() => go(index + 1)}
                    disabled={index === deck.cards.length - 1}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
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

    const face =
        "flip-face flex items-center justify-center rounded-card border border-line p-6 text-center text-lg leading-snug";

    return (
        <div>
            <div className="flip-scene">
                <button
                    onClick={() => setFlipped(!flipped)}
                    aria-label={flipped ? "Showing answer. Click to show question." : "Showing question. Click to show answer."}
                    className="flip-card block h-52 w-full"
                    data-flipped={flipped}
                >
                    <span aria-hidden={flipped} className={`${face} flip-front bg-surface`}>
                        {card.front}
                    </span>
                    <span aria-hidden={!flipped} className={`${face} flip-back bg-raised`}>
                        {card.back}
                    </span>
                </button>
            </div>

            <p className="mt-3 text-center font-mono text-xs text-fg-muted">
                {flipped ? "ANSWER" : "QUESTION"} · click the card to flip
            </p>

            <div className="mt-4 flex items-center justify-between">
                <button
                    onClick={() => go(index - 1)}
                    disabled={index === 0}
                    className="rounded-md border border-line bg-raised px-4 py-2 text-sm text-fg transition-colors duration-150 hover:border-fg-muted disabled:opacity-40"
                >
                    Previous
                </button>
                <span className="font-mono text-sm text-fg-muted">
                    {index + 1} / {deck.cards.length}
                </span>
                <button
                    onClick={() => go(index + 1)}
                    disabled={index === deck.cards.length - 1}
                    className="rounded-md border border-line bg-raised px-4 py-2 text-sm text-fg transition-colors duration-150 hover:border-fg-muted disabled:opacity-40"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
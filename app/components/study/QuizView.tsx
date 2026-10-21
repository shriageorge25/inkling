"use client";

import { useState } from "react";
import type { QuizContent } from "./types";

export default function QuizView({ quiz }: { quiz: QuizContent }) {
    const [answers, setAnswers] = useState<(number | null)[]>(() =>
        quiz.questions.map(() => null)
    );

    const answered = answers.filter((a) => a !== null).length;
    const score = answers.filter(
        (a, i) => a === quiz.questions[i].correctIndex
    ).length;
    const done = answered === quiz.questions.length;

    function choose(question: number, option: number) {
        if (answers[question] !== null) return;
        setAnswers((prev) => prev.map((a, i) => (i === question ? option : a)));
    }

    return (
        <div className="space-y-7">
            <p className="font-mono text-xs text-fg-muted">
                answered {answered} / {quiz.questions.length}
            </p>

            {quiz.questions.map((q, qi) => {
                const picked = answers[qi];
                return (
                    <div key={qi} className="max-w-[70ch]">
                        <p className="font-medium leading-snug">
                            <span className="mr-2 font-mono text-sm text-fg-muted">{qi + 1}.</span>
                            {q.question}
                        </p>
                        <div className="mt-3 space-y-2">
                            {q.options.map((option, oi) => {
                                let style =
                                    "border-line bg-raised text-fg hover:border-accent-ink/40";
                                if (picked !== null) {
                                    if (oi === q.correctIndex) {
                                        style = "border-emerald-500/50 bg-emerald-500/10 text-emerald-200";
                                    } else if (oi === picked) {
                                        style = "border-red-400/50 bg-red-400/10 text-red-200";
                                    } else {
                                        style = "border-line bg-transparent text-fg-muted opacity-70";
                                    }
                                }
                                return (
                                    <button
                                        key={oi}
                                        onClick={() => choose(qi, oi)}
                                        disabled={picked !== null}
                                        className={`flex w-full items-start gap-3 rounded-md border px-4 py-2.5 text-left text-sm transition-colors duration-150 ${style}`}
                                    >
                                        <span className="mt-px shrink-0 font-mono text-xs opacity-70">
                                            {String.fromCharCode(65 + oi)}
                                        </span>
                                        <span>{option}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {picked !== null && (
                            <p className="mt-3 border-l-2 border-line pl-3 text-sm leading-relaxed text-fg-muted">
                                {q.explanation}
                            </p>
                        )}
                    </div>
                );
            })}

            {done && (
                <div className="rounded-card border border-accent-ink/40 bg-raised p-5">
                    <p className="font-mono text-xs text-fg-muted">RESULT</p>
                    <p className="mt-1 text-lg font-semibold">
                        You scored {score} / {quiz.questions.length}
                    </p>
                    <button
                        onClick={() => setAnswers(quiz.questions.map(() => null))}
                        className="mt-3 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover"
                    >
                        Retake quiz
                    </button>
                </div>
            )}
        </div>
    );
}
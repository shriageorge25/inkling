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
        <div className="space-y-6">
            {quiz.questions.map((q, qi) => {
                const picked = answers[qi];
                return (
                    <div key={qi}>
                        <p className="font-medium text-slate-900">
                            {qi + 1}. {q.question}
                        </p>
                        <div className="mt-2 space-y-2">
                            {q.options.map((option, oi) => {
                                let style = "border-slate-300 bg-white text-slate-900 hover:bg-slate-50";
                                if (picked !== null) {
                                    if (oi === q.correctIndex) {
                                        style = "border-green-600 bg-green-50 text-green-900";
                                    } else if (oi === picked) {
                                        style = "border-red-600 bg-red-50 text-red-900";
                                    } else {
                                        style = "border-slate-200 bg-white text-slate-400";
                                    }
                                }
                                return (
                                    <button
                                        key={oi}
                                        onClick={() => choose(qi, oi)}
                                        disabled={picked !== null}
                                        className={`block w-full rounded-lg border px-4 py-2 text-left text-sm ${style}`}
                                    >
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                        {picked !== null && (
                            <p className="mt-2 text-sm text-slate-600">{q.explanation}</p>
                        )}
                    </div>
                );
            })}

            {done && (
                <div className="rounded-lg bg-slate-900 p-4 text-white">
                    <p className="font-semibold">
                        You scored {score} / {quiz.questions.length}
                    </p>
                    <button
                        onClick={() => setAnswers(quiz.questions.map(() => null))}
                        className="mt-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200"
                    >
                        Retake quiz
                    </button>
                </div>
            )}
        </div>
    );
}
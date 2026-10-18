export type QuizContent = {
    title: string;
    questions: {
        question: string;
        options: string[];
        correctIndex: number;
        explanation: string;
    }[];
};

export type FlashcardsContent = {
    title: string;
    cards: { front: string; back: string }[];
};

export type StudyMaterial =
    | { id: string; type: "quiz"; title: string; createdAt: string; content: QuizContent }
    | { id: string; type: "flashcards"; title: string; createdAt: string; content: FlashcardsContent };
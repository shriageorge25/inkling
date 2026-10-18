import OpenAI from "openai";

export const openai = new OpenAI({
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_BASE_URL,
});

export const AI_MODEL = process.env.AI_MODEL ?? "gemini-3.5-flash-lite";
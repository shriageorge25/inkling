import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_BASE_URL,
});

async function main() {
    const res = await client.embeddings.create({
        model: process.env.AI_EMBEDDING_MODEL!,
        input: "What is machine learning?",
        dimensions: 768,
    });
    const vector = res.data[0].embedding;
    console.log("dimensions:", vector.length);
    console.log("first values:", vector.slice(0, 3));
}

main().catch(console.error);
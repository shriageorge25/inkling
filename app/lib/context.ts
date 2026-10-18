const MAX_CONTEXT_CHARS = 60000;

export function buildContext(
    documents: { name: string; textChunks: string }[]
) {
    const context = documents
        .map((d) => `### ${d.name}\n${d.textChunks}`)
        .join("\n\n");
    return context.slice(0, MAX_CONTEXT_CHARS);
}
export type PageText = { text: string; page: number | null };
export type Chunk = { content: string; page: number | null };

const CHUNK_SIZE = 1000;
const OVERLAP = 150;

export function chunkPages(pages: PageText[]): Chunk[] {
    const chunks: Chunk[] = [];

    for (const { text, page } of pages) {
        const clean = text
            .replace(/[ \t]+/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
        if (!clean) continue;

        let start = 0;
        while (start < clean.length) {
            let end = Math.min(start + CHUNK_SIZE, clean.length);

            // Prefer to end at a sentence or line break near the end of the window
            if (end < clean.length) {
                const window = clean.slice(start, end);
                const lastBreak = Math.max(
                    window.lastIndexOf(". "),
                    window.lastIndexOf("? "),
                    window.lastIndexOf("! "),
                    window.lastIndexOf("\n")
                );
                if (lastBreak > CHUNK_SIZE * 0.6) end = start + lastBreak + 1;
            }

            const content = clean.slice(start, end).trim();
            if (content) chunks.push({ content, page });

            if (end >= clean.length) break;
            start = Math.max(end - OVERLAP, start + 1);
        }
    }

    return chunks;
}
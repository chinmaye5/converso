
import { PDFParse } from "pdf-parse";

export async function extractPdfText(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });

    try {
        const result = await parser.getText();
        return result.text.trim();
    } finally {
        await parser.destroy();
    }
}

export function splitIntoChunks(
    text: string,
    chunkSize = 1000,
    overlap = 150,
): string[] {
    const cleanText = text.replace(/\s+/g, " ").trim();

    if (!cleanText) return [];

    const chunks: string[] = [];
    let start = 0;

    while (start < cleanText.length) {
        let end = Math.min(start + chunkSize, cleanText.length);

        // Try not to cut a word in half.
        if (end < cleanText.length) {
            const spaceIndex = cleanText.lastIndexOf(" ", end);
            if (spaceIndex > start) {
                end = spaceIndex;
            }
        }

        const chunk = cleanText.slice(start, end).trim();

        if (chunk) {
            chunks.push(chunk);
        }

        if (end >= cleanText.length) break;

        // The next chunk repeats part of the previous chunk.
        start = Math.max(end - overlap, start + 1);
    }

    return chunks;
}

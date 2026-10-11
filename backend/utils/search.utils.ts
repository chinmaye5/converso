import { db } from "../db";
import { sql } from "drizzle-orm";
import { generateEmbeddings } from "./embedding.utils";

export interface SearchResultChunk {
  chunk_id: string;
  document_id: string;
  filename: string;
  content: string;
  similarity: number;
}

export async function searchDocumentChunks(
  question: string,
  workspaceId: string,
  limit = 5,
): Promise<SearchResultChunk[]> {
  const cleanedQuestion = question.trim();

  if (!cleanedQuestion) {
    throw new Error("Question cannot be empty");
  }

  // Convert the question into a vector using Jina
  const [queryEmbedding] = await generateEmbeddings(
    [cleanedQuestion],
    "retrieval.query",
  );

  if (!queryEmbedding) {
    throw new Error("Failed to generate query embedding");
  }

  // PostgreSQL expects a vector literal such as [0.1,0.2,...]
  const vectorLiteral = `[${queryEmbedding.join(",")}]`;

  // Find the most similar chunks in this workspace
  const result = await db.execute(sql`
    SELECT *
    FROM search_document_chunks(
      ${vectorLiteral}::extensions.vector(1024),
      ${workspaceId}::uuid,
      ${limit}::integer
    )
  `);

  return result as unknown as SearchResultChunk[];
}

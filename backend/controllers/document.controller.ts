import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { generateEmbeddings } from "../utils/embedding.utils";

import { db } from "../db";
import { workspaces, documents, documentChunks } from "../db/schema";
import { supabase } from "../db/supabase";
import { extractPdfText, splitIntoChunks } from "../utils/pdf.utils";

export const uploadPdf = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB maximum
        files: 1,
    },
    fileFilter: (_req, file, callback) => {
        if (path.extname(file.originalname).toLowerCase() !== ".pdf") {
            return callback(new Error("Only PDF files are allowed"));
        }

        callback(null, true);
    },
});

export async function uploadDocument(req: Request, res: Response) {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated || !userId) {
        return res.status(401).json({ error: "Please sign in first" });
    }

    const workspaceId = Array.isArray(req.params.workspaceId)
        ? req.params.workspaceId[0]
        : req.params.workspaceId;

    if (!workspaceId || typeof workspaceId !== "string") {
        return res.status(400).json({ error: "Workspace ID is required" });
    }

    const file = req.file;

    if (!file) {
        return res.status(400).json({
            error: "Please upload a PDF using the 'file' field",
        });
    }

    try {
        const [workspace] = await db
            .select({ id: workspaces.id })
            .from(workspaces)
            .where(
                and(
                    eq(workspaces.id, workspaceId),
                    eq(workspaces.ownerId, userId),
                ),
            )
            .limit(1);

        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        const safeFilename = path.basename(file.originalname)
            .replace(/[^a-zA-Z0-9._-]/g, "_")
            .slice(-200) || "document.pdf";

        const cleanFilename = safeFilename.replace(/^\/+|\/+$/g, "");
        const storagePath = `${workspaceId}/${randomUUID()}-${cleanFilename}`;

        const { error: uploadError } = await supabase.storage
            .from("knowledge-documents")
            .upload(storagePath, file.buffer, {
                contentType: "application/pdf",
                upsert: false,
            });

        if (uploadError) {
            console.error("Storage upload failed full error:", uploadError);
            return res.status(502).json({
                error: "Could not upload document to storage",
                details: uploadError.message || uploadError,
            });
        }

        try {

            const [document] = await db
                .insert(documents)
                .values({
                    workspaceId,
                    filename: safeFilename,
                    storagePath,
                    sizeBytes: file.size,
                    status: "pending",
                })
                .returning();

            if (!document) {
                throw new Error("Failed to create document record in database");
            }

            try {
                // 1. Extract text from the uploaded PDF.
                const extractedText = await extractPdfText(file.buffer);

                // 2. Split the text into chunks.
                const chunks = splitIntoChunks(extractedText);

                if (chunks.length === 0) {
                    throw new Error("No readable text found in this PDF");
                }

                // 3. Generate one embedding for each chunk.
                const embeddings = await generateEmbeddings(
                    chunks,
                    "retrieval.passage",
                );

                // 4. Save text and its matching embedding together in PostgreSQL.
                await db.insert(documentChunks).values(
                    chunks.map((content, chunkIndex) => ({
                        documentId: document.id,
                        content,
                        chunkIndex,
                        embedding: embeddings[chunkIndex],
                    })),
                );

                // 5. Mark the document as processed.
                const [processedDocument] = await db
                    .update(documents)
                    .set({
                        status: "processed",
                        updatedAt: new Date(),
                    })
                    .where(eq(documents.id, document.id))
                    .returning();

                return res.status(201).json({
                    document: processedDocument,
                    chunksCreated: chunks.length,
                });
            } catch (processingError) {
                console.error("PDF processing failed:", processingError);

                const [failedDocument] = await db
                    .update(documents)
                    .set({
                        status: "failed",
                        updatedAt: new Date(),
                    })
                    .where(eq(documents.id, document.id))
                    .returning();

                return res.status(201).json({
                    document: failedDocument,
                    warning: "PDF uploaded, but text processing failed.",
                });
            }

        } catch (dbError) {
            // Avoid leaving an orphaned file if the database insert fails.
            await supabase.storage
                .from("knowledge-documents")
                .remove([storagePath]);

            throw dbError;
        }
    } catch (error) {
        console.error("Document upload failed:", error);
        return res.status(500).json({ error: "Could not save document" });
    }
}

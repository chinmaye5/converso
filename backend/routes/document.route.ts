
import { Router } from "express";
import {
    uploadPdf,
    uploadDocument,
    deleteDocument,
    getDocuments,
} from "../controllers/document.controller";

const router = Router({ mergeParams: true });

router.get("/", getDocuments);
router.post("/", uploadPdf.single("file"), uploadDocument);
router.delete("/:documentId", deleteDocument);

export default router;

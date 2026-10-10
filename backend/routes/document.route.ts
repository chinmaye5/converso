
import { Router } from "express";
import {
    uploadPdf,
    uploadDocument,
} from "../controllers/document.controller";

const router = Router({ mergeParams: true });

router.post("/", uploadPdf.single("file"), uploadDocument);

export default router;

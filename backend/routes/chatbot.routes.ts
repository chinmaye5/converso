
import { Router } from "express";

import {
    createChatbot,
    getChatbot,
    updateChatbot,
    deleteChatbot,
} from "../controllers/chatbot.controller";

const router = Router({ mergeParams: true });

router.post("/", createChatbot);
router.get("/", getChatbot);
router.patch("/", updateChatbot);
router.delete("/", deleteChatbot);

export default router;

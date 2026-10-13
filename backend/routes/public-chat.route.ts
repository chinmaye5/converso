import { Router } from "express";
import { publicChat, publicChatbotInfo } from "../controllers/public-chat.controller";

const router = Router();

router.get("/:chatbotId/info", publicChatbotInfo);
router.post("/:chatbotId/chat", publicChat);

export default router;


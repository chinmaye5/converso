import { Router } from "express";
import { publicChat } from "../controllers/public-chat.controller";

const router = Router();

router.post("/:chatbotId/chat", publicChat);

export default router;

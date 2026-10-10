import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import healthRouter from "./routes/health.route";
import profileRouter from "./routes/profile.route";
import workspaceRouter from "./routes/workspace.route";
import chatbotRoutes from "./routes/chatbot.routes";
import documentRoutes from "./routes/document.route";

const app = express();

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

app.use(clerkMiddleware());


app.get("/", (req, res) => {
    res.json({
        "message": "backend running at localhost:5000"
    })
    console.log("root route hit")
});

app.use("/health", healthRouter);
app.use("/api/profile", profileRouter);
app.use("/api/workspaces", workspaceRouter);
app.use("/api/workspaces/:workspaceId/chatbot", chatbotRoutes);
app.use("/api/workspaces/:workspaceId/documents", documentRoutes);

app.listen(5000, () => {
    console.log("Backend running on http://localhost:5000");
});

import { Router } from "express";
import { authMiddleware } from "../middlewares/auth-middleware";
import { ChatController } from "./Chat.controller";

export const ChatRouter = Router();

ChatRouter.get("/chats", authMiddleware, ChatController.getChats);
ChatRouter.post("/chats", authMiddleware, ChatController.createPersonalChat);
ChatRouter.get("/chats/:chatId/messages", authMiddleware, ChatController.getMessages);
ChatRouter.post("/chats/:chatId/read", authMiddleware, ChatController.markMessagesAsRead);

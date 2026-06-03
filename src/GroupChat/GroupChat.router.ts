import { Router } from "express";
import { GroupChatController } from "./GroupChat.controller";
import { authMiddleware } from "../middlewares/auth-middleware";

const router = Router();
const controller = new GroupChatController();

router.post("/create", authMiddleware, controller.createGroup);
router.delete("/remove-member", authMiddleware, controller.removeMember);

export default router;
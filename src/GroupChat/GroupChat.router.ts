import { Router } from "express";
import { GroupChatController } from "./GroupChat.controller";
import { authMiddleware } from "../middlewares/auth-middleware";

const router = Router();
const controller = new GroupChatController();

router.post("/create", authMiddleware, controller.createGroup);
router.patch("/:chatId", authMiddleware, controller.updateGroup);
router.delete("/remove-member", authMiddleware, controller.removeMember);
router.delete("/:chatId", authMiddleware, controller.deleteGroup);

export default router;

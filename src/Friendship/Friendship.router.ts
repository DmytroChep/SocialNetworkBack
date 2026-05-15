import { Router } from "express";
import { authMiddleware } from "../middlewares/auth-middleware";
import { FriendshipController } from "./Friendship.controller";

export const friendshipRouter = Router();

friendshipRouter.post("/friendship/request", authMiddleware, FriendshipController.createRequest);
friendshipRouter.get("/friendship/user/:userId", authMiddleware, FriendshipController.userFriendships);
friendshipRouter.patch("/friendship/status", authMiddleware, FriendshipController.changeStatus);
friendshipRouter.delete("/friendship/:id", authMiddleware, FriendshipController.deleteFriendship);
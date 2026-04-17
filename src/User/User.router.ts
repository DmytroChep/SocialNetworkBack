import { Router } from "express";
import { authMiddleware } from "../middlewares/auth-middleware";
import { UserController } from "./User.controller";
import { validateBase64 } from "../middlewares/imageValidator";

export const userRouter = Router();

userRouter.post("/user/registration", UserController.registration);
userRouter.post("/user/login", UserController.login);
userRouter.get("/user/me", authMiddleware, UserController.me);
userRouter.patch("/user/:id", authMiddleware, UserController.updateUser);
userRouter.post("/update-avatar", validateBase64, UserController.updateAvatar);

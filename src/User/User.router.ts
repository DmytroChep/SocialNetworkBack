import { Router } from "express";
import { authMiddleware } from "../middlewares/auth-middleware";
import { validateBase64 } from "../middlewares/imageValidator";
import { UserController } from "./User.controller";

export const userRouter = Router();

userRouter.post("/user/registration", UserController.registration);
userRouter.post("/user/login", UserController.login);
userRouter.get("/user/me", authMiddleware, UserController.me);
userRouter.patch("/user/:id", authMiddleware, UserController.updateUser);
userRouter.post("/user/email-verification", UserController.sendCodeVerify);
userRouter.get("/user/email-verification", UserController.checkIsCodeExists);
userRouter.patch("/user/password", UserController.updatePassword);
userRouter.patch("/user/avatar", authMiddleware, UserController.updateAvatar);
userRouter.get("/user/sendCode", UserController.sendCodeVerify);
userRouter.get("/user/isCodeExists", UserController.checkIsCodeExists);
userRouter.post("/user/updatePassword", UserController.updatePassword);
userRouter.post("/update-avatar", validateBase64, UserController.updateAvatar);

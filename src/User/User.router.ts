import { Router } from "express";
import { authMiddleware } from "../middlewares/auth-middleware";
import { validateBase64 } from "../middlewares/imageValidator";
import { UserController } from "./User.controller";

export const userRouter = Router();
userRouter.post("/user/registration", UserController.registration);
userRouter.post("/user/login", UserController.login);
userRouter.get("/user/me", authMiddleware, UserController.me);
userRouter.get("/users/all", authMiddleware, UserController.allUsers);

// статичні GET роути — ВИЩЕ ніж /:userId
userRouter.get("/user/sendCode", UserController.sendCodeVerify);
userRouter.get("/user/isCodeExists", UserController.checkIsCodeExists);
userRouter.get("/user/email-verification", UserController.checkIsCodeExists);

// динамічний роут — НИЖЧЕ
userRouter.get("/user/:userId", UserController.userById);

userRouter.patch("/user/:id", authMiddleware, UserController.updateUser);
userRouter.delete("/user/:id", authMiddleware, UserController.deleteUser);
userRouter.post("/user/email-verification", UserController.sendCodeVerify);
userRouter.patch("/user/password", UserController.updatePassword);
userRouter.patch("/user/avatar", authMiddleware, UserController.updateAvatar);
userRouter.post("/user/updatePassword", UserController.updatePassword);
userRouter.post("/update-avatar", validateBase64, UserController.updateAvatar);
userRouter.get("/user-by-id", UserController.userById);
userRouter.patch("/user/:id/status", authMiddleware, UserController.updateUserStatus);
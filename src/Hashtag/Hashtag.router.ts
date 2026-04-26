import { Router } from "express";
import { authMiddleware } from "../middlewares/auth-middleware";
import { HashtagController } from "./Hashtag.controller";

export const HashtagRouter = Router();

HashtagRouter.post("/hashtag", authMiddleware, HashtagController.create);
HashtagRouter.get("/hashtags", HashtagController.getAll);
HashtagRouter.get("/hashtag/:id", HashtagController.getById);
HashtagRouter.patch("/hashtag/:id", authMiddleware, HashtagController.update);
HashtagRouter.delete("/hashtag/:id", authMiddleware, HashtagController.delete);

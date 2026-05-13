import { Router } from "express";
import { authMiddleware } from "../middlewares/auth-middleware";
import { PostController } from "./Post.controller";

export const PostRouter = Router();

PostRouter.post("/post", authMiddleware, PostController.create);
PostRouter.get("/posts", PostController.getAll);
PostRouter.get("/post/:id", PostController.getById);
PostRouter.get("/user/:authorId/posts", PostController.getByAuthorId);
PostRouter.patch("/post/:id", authMiddleware, PostController.update);
PostRouter.delete("/post/:id", authMiddleware, PostController.delete);
PostRouter.post("/post/:id/images", authMiddleware, PostController.addImages);
PostRouter.delete("/post-image/:imageId", authMiddleware, PostController.deleteImage);
PostRouter.patch("/post/:id/images", authMiddleware, PostController.replaceImages);
PostRouter.patch("/post/:id/thumbUp/increase", authMiddleware, PostController.thumbUpIncrease);
PostRouter.patch("/post/:id/heart/increase", authMiddleware, PostController.heartIncrease);
PostRouter.patch("/post/:id/increaseViews", authMiddleware, PostController.viewsIncrease);

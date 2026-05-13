import { Router } from "express";
import { authMiddleware } from "../middlewares/auth-middleware";
import { AlbumController } from "./Album.controller";
import { validateAlbumImages } from "../middlewares/imageValidator";

export const AlbumRouter = Router();

AlbumRouter.post("/album", authMiddleware, validateAlbumImages, AlbumController.create);
AlbumRouter.get("/album/:id", AlbumController.getById);
AlbumRouter.get("/profile/:profileId/albums", AlbumController.getByProfileId);
AlbumRouter.get("/user/:userId/albums", AlbumController.getByUserId);
AlbumRouter.patch("/album/:id", authMiddleware, AlbumController.update);
AlbumRouter.delete("/album/:id", authMiddleware, AlbumController.delete);
AlbumRouter.post("/album/:id/images", authMiddleware, validateAlbumImages, AlbumController.addImages);
AlbumRouter.delete("/album/images/:imageId", authMiddleware, AlbumController.deleteImage);
AlbumRouter.patch("/album/:id/images", authMiddleware, validateAlbumImages, AlbumController.replaceImages);

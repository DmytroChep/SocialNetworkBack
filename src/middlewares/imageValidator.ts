import type { NextFunction, Request, Response } from "express";
import { saveDataUriImage } from "../utils/media-files";

const IMAGE_DATA_URI_REGEX = /^data:image\/(png|jpe?g|webp);base64,/i;

export const validateBase64 = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const { image, profileId, userId, user_id } = req.body;
    const authorId = profileId || userId || user_id;

    if (!image || !authorId) {
        return res.status(400).json({ error: "image and author id are required" });
    }

    if (!IMAGE_DATA_URI_REGEX.test(image)) {
        return res.status(400).json({ error: "invalid base64 format" });
    }

    req.body.imagePath = saveDataUriImage(image, "avatars", `avatar_${authorId}`);
    req.body.userId = userId || user_id;
    next();
};

export const validateAlbumImages = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    const { images, profileId, userId, user_id } = req.body;

    if (!images) {
        next();
        return;
    }

    if (!Array.isArray(images)) {
        res.status(400).json({ error: "images must be an array" });
        return;
    }

    const authorId = profileId || userId || user_id || Date.now();

    try {
        req.body.images = images.map((item: any, index: number) => {
            if (!item?.image || !IMAGE_DATA_URI_REGEX.test(item.image)) {
                throw new Error("invalid image payload");
            }

            return {
                image: saveDataUriImage(item.image, "albums", `album_${authorId}`, index),
            };
        });
        next();
    } catch {
        res.status(400).json({ error: "invalid image payload" });
    }
};

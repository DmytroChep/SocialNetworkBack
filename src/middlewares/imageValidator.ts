import type { NextFunction, Request, Response } from "express";
import { saveDataUriImage } from "../utils/media-files";

const IMAGE_DATA_URI_REGEX = /^data:image\/(png|jpe?g|webp);base64,/i;

export const validateBase64 = async (
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

    req.body.imagePath = await saveDataUriImage(image, "media/profile_app/avatars", `avatar_${authorId}`);    req.body.userId = userId || user_id;
    next();
};

export const validateAlbumImages = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
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
        req.body.images = await Promise.all(
            images.map((item: any, index: number) =>
                saveDataUriImage(item.image, "media/profile_app/albums", `album_${authorId}`, index)
                .then((url) => ({ image: url }))
            )
        );  
        next();
    } catch {
        res.status(400).json({ error: "invalid image payload" });
    }
};

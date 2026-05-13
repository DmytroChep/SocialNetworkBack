import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

function writeImage(fileName: string, data: string) {
  const albumDir = path.join(process.cwd(), 'media/albums');
  if (!fs.existsSync(albumDir)) {
    fs.mkdirSync(albumDir, { recursive: true });
  }
  const filePath = path.join(albumDir, fileName);
  fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
  return `/media/albums/${fileName}`;
}

export const validateBase64 = (req: Request, res: Response, next: NextFunction) => {
  const { image, profileId, userId } = req.body;
  if (!image || (!profileId && !userId)) {
    return res.status(400).json({ error: 'image and author id are required' });
  }
  const regex = /^data:image\/(png|jpg|jpeg);base64,/;
  if (!regex.test(image)) {
    return res.status(400).json({ error: 'invalid base64 format' });
  }
  const mimeMatch = image.match(regex);
  const mimeType = mimeMatch ? mimeMatch[1] : 'jpg';
  const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
  const authorId = profileId || userId;
  const fileName = `avatar_${authorId}_${Date.now()}.${mimeType === 'jpeg' ? 'jpg' : mimeType}`;
  req.body.imagePath = writeImage(fileName, base64Data);
  next();
};

export const validateAlbumImages = (req: Request, res: Response, next: NextFunction): void => {
  const { images, profileId, userId } = req.body;
  if (!images) {
    next();
    return;
  }
  if (!Array.isArray(images)) {
    res.status(400).json({ error: 'images must be an array' });
    return;
  }
  const authorId = profileId || userId || Date.now();
  const processedImages = images.map((item: any, index: number) => {
    const regex = /^data:image\/(png|jpg|jpeg);base64,/;
    if (!item?.image || !regex.test(item.image)) {
      throw new Error('invalid image payload');
    }
    const mimeMatch = item.image.match(regex);
    const mimeType = mimeMatch ? mimeMatch[1] : 'jpg';
    const base64Data = item.image.replace(/^data:image\/\w+;base64,/, '');
    const fileName = `album_${authorId}_${Date.now()}_${index}.${mimeType === 'jpeg' ? 'jpg' : mimeType}`;
    return { image: writeImage(fileName, base64Data) };
  });
  req.body.images = processedImages;
  next();
};
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
export const validateBase64 = (req: Request, res: Response, next: NextFunction) => {
  const { image, userId } = req.body; 
    
  if (!image || !userId) {
    return res.status(400).json({ error: 'Изображение и ID пользователя обязательны' });
  }

  const regex = /^data:image\/(png|jpg|jpeg);base64,/;
  if (!regex.test(image)) {
    return res.status(400).json({ error: 'Неверный формат base64' });
  }

  try {
    const mimeMatch = image.match(/^data:image\/(png|jpg|jpeg);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'jpg';
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    
    // Путь относительно корня проекта (лучше использовать process.cwd())
    const avatarDir = path.join(process.cwd(), 'media/avatars');
    
    if (!fs.existsSync(avatarDir)) {
      fs.mkdirSync(avatarDir, { recursive: true });
    }

    const fileName = `avatar_${userId}_${Date.now()}.${mimeType === 'jpeg' ? 'jpg' : mimeType}`;
    const filePath = path.join(avatarDir, fileName);

    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    // Передаем путь дальше (в БД сохраняем относительный путь)
    req.body.imagePath = `/media/avatars/${fileName}`;
    
    next();
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: 'Ошибка сохранения файла' });
  }
};

export const validateAlbumImages = (req: Request, res: Response, next: NextFunction): void => {
  const { images, name, userId } = req.body;
  console.log(req.body)

  console.log(name, userId)

  if (!name || !userId) {
    res.status(400).json({ error: 'Название альбома и ID пользователя обязательны' });
    return;
  }

  const albumDir = path.join(process.cwd(), 'media/albums');
  
  if (!fs.existsSync(albumDir)) {
    fs.mkdirSync(albumDir, { recursive: true });
  }

  try {
    if (images && Array.isArray(images)) {
      const processedImages = images.map((img: any) => {
        const regex = /^data:image\/(png|jpg|jpeg);base64,/;
        if (!regex.test(img.image)) {
          throw new Error('Неверный формат base64 для одной из картинок');
        }

        const mimeMatch = img.image.match(/^data:image\/(png|jpg|jpeg);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'jpg';
        const base64Data = img.image.replace(/^data:image\/\w+;base64,/, '');
        
        const fileName = `album_${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${mimeType === 'jpeg' ? 'jpg' : mimeType}`;
        const filePath = path.join(albumDir, fileName);

        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

        return {
          image: `/media/albums/${fileName}`
        };
      });

      req.body.images = processedImages;
    } else if (images && !Array.isArray(images)) {
      // Если пришла одна картинка, обрабатываем её
      const regex = /^data:image\/(png|jpg|jpeg);base64,/;
      if (!regex.test(images.image)) {
        res.status(400).json({ error: 'Неверный формат base64' });
        return;
      }

      const mimeMatch = images.image.match(/^data:image\/(png|jpg|jpeg);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'jpg';
      const base64Data = images.image.replace(/^data:image\/\w+;base64,/, '');
      
      const fileName = `album_${userId}_${Date.now()}.${mimeType === 'jpeg' ? 'jpg' : mimeType}`;
      const filePath = path.join(albumDir, fileName);

      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

      req.body.images = [{
        image: `/media/albums/${fileName}`
      }];
    }

    next();
  } catch (error) {
    console.error('Album image processing error:', error);
    res.status(500).json({ error: 'Ошибка обработки картинок для альбома' });
  }
};
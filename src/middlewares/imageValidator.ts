import { Request, Response, NextFunction } from 'express';

export const validateBase64 = (req: Request, res: Response, next: NextFunction) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'Изображение обязательно' });
  }

  const regex = /^data:image\/(png|jpg|jpeg);base64,/;
  
  if (!regex.test(image)) {
    return res.status(400).json({ 
      error: 'Неверный формат. Ожидается base64 строка (data:image/png;base64,...)' 
    });
  }

  next();
};
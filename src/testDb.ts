import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async (): Promise<void> => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('✅ Подключение успешно!');
    
    const result = await client.query('SELECT NOW()');
    console.log('Текущее время в БД:', result.rows[0]);
    
    await client.end();
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('❌ Ошибка подключения:', err.message);
    } else {
      console.error('❌ Неизвестная ошибка:', err);
    }
  }
};

testConnection();
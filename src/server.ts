import cors from "cors";
import express from "express";
import { createServer } from "http";
import dotenv from "dotenv";
import { startTunnel } from "./db-tunnel"; // ← Добавьте импорт
import { userRouter } from "./User/User.router";
import { AlbumRouter } from "./Album/Album.router";
import { HashtagRouter } from "./Hashtag/Hashtag.router";
import path from "path";
import { PostRouter } from "./Post/Post.router";
import { friendshipRouter } from "./Friendship/Friendship.router";
import { ChatRouter } from "./Chat/Chat.router";
import { SocketManager } from "./Socket/socket.manager";
import { Client } from "pg";
import { bigintSerializer } from "./bigints";

dotenv.config(); // ← Добавьте это

const PORT = 8000;
const HOST = "192.168.0.193"
const app = express();
const httpServer = createServer(app);

SocketManager.initSocketServer(httpServer);

app.set("json replacer", bigintSerializer);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(
  cors({
    origin: "*",
  }),
);
app.use('/media', express.static(path.join(__dirname, '../media')));
app.use(userRouter);
app.use(AlbumRouter);
app.use(HashtagRouter);
app.use(PostRouter)
app.use(friendshipRouter)
app.use(ChatRouter)

// ← ДОБАВЬТЕ ТУННЕЛЬ ЗДЕСЬ
async function startServer() {
  try {
    // Открываем SSH туннель перед запуском сервера
    await startTunnel();
    
    httpServer.listen(PORT, HOST, () => {
      console.log(`http://${HOST}:${PORT}`);
      console.log(`ws://${HOST}:${PORT}`);
      console.log('Подключено к удаленной БД через туннель');
    });
  } catch (err) {
    console.error('❌ Ошибка запуска:', err);
    process.exit(1);
  }
}

startServer();
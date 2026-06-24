import cors from "cors";
import express from "express";
import { createServer } from "http";
import dotenv from "dotenv";
import { startTunnel } from "./db-tunnel";
import path from "path";
import { bigintSerializer } from "./bigints";

dotenv.config();

const PORT = 8000;
// 10.22.202.103
// 192.168.0.193
// 192.168.0.148
const HOST = "0.0.0.0";
const app = express();
const httpServer = createServer(app);

app.set("json replacer", bigintSerializer);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(
  cors({
    origin: "*"
    }),
);
app.use('/media', express.static(path.join(__dirname, '../media')));

// Delay importing routers (which instantiate Prisma client) until after SSH tunnel is ready
async function startServer() {
  try {
    // Открываем SSH туннель перед импортом модулей, использующих Prisma
    // await startTunnel();

    // Импорт роутеров и менеджера сокетов после туннеля
    const { SocketManager } = await import("./Socket/socket.manager");
    const { userRouter } = await import("./User/User.router");
    const { AlbumRouter } = await import("./Album/Album.router");
    const { HashtagRouter } = await import("./Hashtag/Hashtag.router");
    const { PostRouter } = await import("./Post/Post.router");
    const { friendshipRouter } = await import("./Friendship/Friendship.router");
    const { ChatRouter } = await import("./Chat/Chat.router");
    const GroupChatRouter = (await import("./GroupChat/GroupChat.router")).default;

    SocketManager.initSocketServer(httpServer);

    app.use(userRouter);
    app.use(AlbumRouter);
    app.use(HashtagRouter);
    app.use(PostRouter);
    app.use(friendshipRouter);
    app.use(ChatRouter);
    app.use("/group-chat", GroupChatRouter);

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





// import cors from "cors";
// import express from "express";
// import { createServer } from "http";
// import dotenv from "dotenv";
// // Трейлер туннеля можно пока оставить в импортах, либо убрать вовсе
// import { startTunnel } from "./db-tunnel"; 
// import path from "path";
// import { bigintSerializer } from "./bigints";

// dotenv.config();

// const PORT = 8000;
// // 10.22.202.103
// // 192.168.0.193
// // 192.168.0.148
// const HOST = "192.168.0.193"; 
// const app = express();
// const httpServer = createServer(app);

// app.set("json replacer", bigintSerializer);
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '50mb', extended: true }));
// app.use(
//   cors({
//     origin: "*",
//   }),
// );
// app.use('/media', express.static(path.join(__dirname, '../media')));

// // Запуск сервера и подключение модулей
// async function startServer() {
//   try {
//     // 🚫 ОТКЛЮЧЕНО ДЛЯ ЛОКАЛЬНОГО DOCKER:
//     // Мы больше не открываем SSH туннель, так как база запущена локально на порту 5433
//     // await startTunnel();

//     // Импорт роутеров и менеджера сокетов (динамический импорт оставляем, чтобы не ломать архитектуру)
//     const { SocketManager } = await import("./Socket/socket.manager");
//     const { userRouter } = await import("./User/User.router");
//     const { AlbumRouter } = await import("./Album/Album.router");
//     const { HashtagRouter } = await import("./Hashtag/Hashtag.router");
//     const { PostRouter } = await import("./Post/Post.router");
//     const { friendshipRouter } = await import("./Friendship/Friendship.router");
//     const { ChatRouter } = await import("./Chat/Chat.router");
//     const GroupChatRouter = (await import("./GroupChat/GroupChat.router")).default;

//     SocketManager.initSocketServer(httpServer);

//     app.use(userRouter);
//     app.use(AlbumRouter);
//     app.use(HashtagRouter);
//     app.use(PostRouter);
//     app.use(friendshipRouter);
//     app.use(ChatRouter);
//     app.use("/group-chat", GroupChatRouter);

//     httpServer.listen(PORT, HOST, () => {
//       console.log(`http://${HOST}:${PORT}`);
//       console.log(`ws://${HOST}:${PORT}`);
//       console.log('✅ Успешно подключено к локальной БД в Docker (порт 5433)');
//     });
//   } catch (err) {
//     console.error('❌ Ошибка запуска:', err);
//     process.exit(1);
//   }
// }

// startServer();
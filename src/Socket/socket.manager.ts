import { Server as SocketServer } from "socket.io";
import { socketAuthMiddleware } from "../middlewares/socket-auth-middleware";
import { ChatService } from "../Chat/Chat.service";
import { parseIdToBigInt, ensureBigInt, sanitizeBigInts } from "../bigints";
import type {
    AuthenticatedSocket,
    SocketManagerContract,
} from "./socket.types";

const normalizeChatId = (value: unknown) => parseIdToBigInt(value as any);

const ok = <T>(data?: T) => ({ status: "ok" as const, data });
const fail = (message: string) => ({ status: "error" as const, message });
const onlineUsers = new Set<number>();

export const SocketManager: SocketManagerContract = {
    socketServer: null,

    initSocketServer(httpServer) {
        this.socketServer = new SocketServer(httpServer, {
            maxHttpBufferSize: 20 * 1024 * 1024,
            cors: {
                origin: "*",
            },
        });

        const io = this.socketServer;

        const emitChatUpdated = async (chatId: bigint, userIds?: Array<number | bigint>) => {
            if (!io) return;
            const participants = userIds
                ? userIds.map((user_id) => ({ user_id }))
                : await ChatService.getChatParticipants(chatId);

            await Promise.all(
                participants.map(async (participant) => {
                    const uid = typeof participant.user_id === "bigint"
                        ? participant.user_id
                        : BigInt(participant.user_id as any);
                    const chat = await ChatService.getChatById(
                        chatId,
                        uid,
                    );
                    io.to(`user-${String(uid)}`).emit("chat:updated", sanitizeBigInts(chat));
                }),
            );
        };

        // Настройка основного сокета
        this.socketServer.use(socketAuthMiddleware);

        this.socketServer.on("connection", (socket: AuthenticatedSocket) => {
            if (!io) return;

            socket.join(`user-${socket.data.userId}`);
            const userId = Number(socket.data.userId);

            onlineUsers.add(userId);

            // Оповещаем остальных, что этот пользователь онлайн
            socket.broadcast.emit("user:online", { id: userId });

            // Отправляем этому пользователю список уже онлайн
            socket.emit("users:initial_online", Array.from(onlineUsers));

            // Сообщаем Django bridge один раз
            this.socketServer?.of("/django-bridge").emit("server_event", {
                type: "user:online",
                id: userId,
            });

            const joinChat = async (
                data: { chatId?: number | string },
                ack?: (response: ReturnType<typeof ok> | ReturnType<typeof fail>) => void,
            ) => {
                const chatId = normalizeChatId(data?.chatId);
                if (!chatId) {
                    ack?.(fail("invalid chat id"));
                    return;
                }

                const isParticipant = await ChatService.isUserChatParticipant(
                    chatId,
                    socket.data.userId,
                );
                if (!isParticipant) {
                    ack?.(fail("you are not chat participant"));
                    return;
                }

                socket.join(`chat-${chatId}`);
                ack?.(ok());
            };

            const leaveChat = (data: { chatId?: number | string }) => {
                const chatId = normalizeChatId(data?.chatId);
                if (chatId) socket.leave(`chat-${chatId}`);
            };

            socket.on("chat:join", joinChat);
            socket.on("joinChat", joinChat);
            socket.on("chat:leave", leaveChat);
            socket.on("leaveChat", leaveChat);

            socket.on("users:get_online", (ack) => {
                ack?.(ok(Array.from(onlineUsers)));
            });

            socket.on("messages:read", async (data, ack) => {
                try {
                    const chatId = normalizeChatId(data?.chatId);
                    if (!chatId) { ack?.(fail("invalid chat id")); return; }

                    const isParticipant = await ChatService.isUserChatParticipant(chatId, socket.data.userId);
                    if (!isParticipant) { ack?.(fail("you are not chat participant")); return; }

                    const readCount = await ChatService.markMessagesAsRead(chatId, socket.data.userId);

                    io.to(`chat-${String(chatId)}`).emit("messages:read", {
                        chatId: String(chatId),
                        readerId: String(socket.data.userId),
                    });

                    this.socketServer?.of("/django-bridge").emit("server_event", {
                        type: "messages:read",
                        chatId: String(chatId),
                        readerId: String(socket.data.userId),
                    });

                    emitChatUpdated(chatId, [socket.data.userId]).catch((err) => console.error(err));

                    ack?.(ok({ readCount }));
                } catch (error) {
                    console.error("messages:read error", error);
                    ack?.(fail("unknown error"));
                }
            });
socket.on("message:send", async (data, ack) => {
  try {
    const chatId = normalizeChatId(data?.chatId);
    if (!chatId) { ack?.(fail("invalid chat id")); return; }

    // Відправляємо ack одразу (optimistic), не чекаємо upload
    ack?.(ok());

    const message = await ChatService.sendMessage(
      socket.data.userId,
      chatId,
      data?.text ?? "",
      data?.images ?? [],
    );

    if (typeof message === "string") {
      // Upload завершився з помилкою — нотифікуємо клієнта окремим евентом
      socket.emit("message:send_error", { chatId: String(chatId), error: message });
      return;
    }

    const safeMessage = sanitizeBigInts(message);

    io.to(`chat-${String(chatId)}`).emit("message:new", {
      chatId: String(chatId),
      message: safeMessage,
    });

    // emit to participant user rooms
    try {
      const participants = await ChatService.getChatParticipants(chatId);
      await Promise.all(
        participants.map(async (participant) => {
          const uid = typeof participant.user_id === "bigint"
            ? participant.user_id
            : BigInt(participant.user_id as any);
          io.to(`user-${String(uid)}`).emit("message:new", {
            chatId: String(chatId),
            message: safeMessage,
          });
        }),
      );
    } catch (err) {
      console.error("Failed to emit to participant user rooms:", err);
    }

    this.socketServer?.of("/django-bridge").emit("server_event", {
      type: "message:new",
      chatId: String(chatId),
      message: safeMessage,
    });

    emitChatUpdated(chatId).catch((err) =>
      console.error("⚠️ Ошибка обновления чатов в фоне:", err)
    );
  } catch (error) {
    console.error("message:send error", error);
    // ack вже відправлений, нотифікуємо окремо
    socket.emit("message:send_error", {
      chatId: String(data?.chatId ?? ""),
      error: "unknown error",
    });
  }
});

            socket.on("disconnect", () => {
                onlineUsers.delete(userId);
                io.emit("user:offline", { id: userId });

                this.socketServer?.of("/django-bridge").emit("server_event", {
                    type: "user:offline",
                    id: userId,
                });
            });
        }); // Конец основного сокета

        // Django bridge — отдельный неймспект без auth middleware
        const djangoBridge = this.socketServer.of("/django-bridge");

        this.socketServer.on("users:request_online", (socke:AuthenticatedSocket) => {
            socke.emit("users:response_online", Array.from(onlineUsers));
        })



        djangoBridge.on("connection", (socket) => {
    console.log("✅ Django підключився:", socket.id);

    // Сразу шлём Django наш полный список — без ожидания запроса
    socket.emit("server_event", {
        type: "sync",
        onlineUsers: Array.from(onlineUsers),
    });

    socket.on("django_event", async (data: { type: string; chatId?: string; message?: unknown; userId?: number | string; onlineUsers?: Array<number | string> }) => {
        console.log("📨 Подія від Django:", data);

        // --- НОВЫЙ ЕДИНЫЙ СНЭПШОТ ОТ DJANGO ---
        if (data.type === "sync") {
            const ids: Array<number | string> = data.onlineUsers ?? [];
            console.log("📥 Отримали від Django повний список онлайн:", ids);
            for (const raw of ids) {
                const uid = Number(raw);
                if (!onlineUsers.has(uid)) {
                    onlineUsers.add(uid);
                    io?.emit("user:online", { id: uid });
                }
            }
            return;
        }

        if (data.type === "users:request_online") {
            console.log("📤 Відповідаємо Django списком онлайн користувачів:", Array.from(onlineUsers));
            for (const uid of onlineUsers) {
                socket.emit("server_event", {
                    type: "user:online",
                    id: uid,
                });
            }
            return;
        }

        // --- ОБРАБОТКА ОНЛАЙНА ИЗ ДЖАНГО ---
        if (data.type === "user:online" && data.userId) {
            const uid = Number(data.userId);
            onlineUsers.add(uid);
            io?.emit("user:online", { id: uid });
            return; // Выходим, так как код ниже предназначен только для сообщений
        }

        if (data.type === "user:offline" && data.userId) {
            const uid = Number(data.userId);
            onlineUsers.delete(uid);
            io?.emit("user:offline", { id: uid });
            return;
        }

        if (data.type === "message:new" && data.chatId) {
            // 1. Отправляем тем, у кого чат открыт
            this.socketServer?.to(`chat-${data.chatId}`).emit("message:new", {
                chatId: data.chatId,
                message: data.message,
            });

            // 2. Now call emitChatUpdated in background
            try {
                const numericChatId = parseIdToBigInt(data.chatId);
                await emitChatUpdated(numericChatId);
            } catch (error) {
                console.error("❌ Ошибка обновления счетчиков для неактивных пользователей:", error);
            }
        }
    });

    socket.on("disconnect", () => {
        console.log("❌ Django відключився");
    });

    socket.on("users:get_online", (ack) => {
        ack?.(ok(Array.from(onlineUsers)));
    });
});
    },
};

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

export const SocketManager: SocketManagerContract = {
	socketServer: null,

	initSocketServer(httpServer) {
		this.socketServer = new SocketServer(httpServer, {
			maxHttpBufferSize: 20 * 1024 * 1024,
			cors: {
				origin: "*",
			},
		});

		this.socketServer.use(socketAuthMiddleware);

		this.socketServer.on("connection", (socket: AuthenticatedSocket) => {
			const io = this.socketServer;
			if (!io) return;

			socket.join(`user-${socket.data.userId}`);

			const emitChatUpdated = async (chatId: bigint, userIds?: Array<number | bigint>) => {
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

			socket.on(
				"messages:read",
				async (
					data: { chatId?: number | string },
					ack?: (response: ReturnType<typeof ok> | ReturnType<typeof fail>) => void,
				) => {
					try {
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

						const readCount = await ChatService.markMessagesAsRead(
							chatId,
							socket.data.userId,
						);
						await emitChatUpdated(chatId, [socket.data.userId]);
						ack?.(ok({ readCount }));
					} catch (error) {
						console.error("messages:read error", error);
						ack?.(fail("unknown error"));
					}
				},
			);

			socket.on(
				"message:send",
				async (
					data: { chatId?: number | string; text?: string; images?: string[] },
					ack?: (response: ReturnType<typeof ok> | ReturnType<typeof fail>) => void,
				) => {
					try {
						const chatId = normalizeChatId(data?.chatId);
						if (!chatId) {
							ack?.(fail("invalid chat id"));
							return;
						}

						const message = await ChatService.sendMessage(
							socket.data.userId,
							chatId,
							data?.text ?? "",
							data?.images ?? [],
						);
						if (typeof message === "string") {
							ack?.(fail(message));
							return;
						}

						const safeMessage = sanitizeBigInts(message);
						io.to(`chat-${String(chatId)}`).emit("message:new", {
							chatId: String(chatId),
							message: safeMessage,
						});

						await emitChatUpdated(chatId);
						ack?.(ok(safeMessage));
					} catch (error) {
						console.error("message:send error", error);
						ack?.(fail("unknown error"));
					}
				},
			);
		});
	},
};

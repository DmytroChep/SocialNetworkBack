import { getUserFromToken } from "../utils/auth-token";
import { ChatService } from "./Chat.service";
import type { ChatControllerContract } from "./Chat.types";
import { parseIdToBigInt } from "../bigints";

const parsePositiveInt = (value: unknown, fallback?: number): number | null => {
	if (value === undefined || value === null || value === "") return fallback ?? null;
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const limitFromQuery = (value: unknown, fallback: number) => {
	const parsed = parsePositiveInt(value, fallback);
	if (!parsed) return fallback;
	return Math.min(parsed, 50);
};

const getAuthenticatedUser = async (token?: string) => {
	return getUserFromToken(token);
};

export const ChatController: ChatControllerContract = {
	getChats: async (req, res, next) => {
		try {
			const user = await getAuthenticatedUser(res.locals.token);
			if (!user) {
				res.status(401).json("invalid token");
				return;
			}

			const cursorId = parseIdToBigInt(req.query.cursorId);
			const result = await ChatService.getPersonalChats(user.id, {
				limit: limitFromQuery(req.query.take, 20),
				...(cursorId ? { cursorId } : {}),
			});

			res.status(200).json({
				chats: result.items,
				hasMore: result.hasMore,
				nextCursor: result.nextCursor,
			});
		} catch (error) {
			next(error);
		}
	},

	createPersonalChat: async (req, res, next) => {
		try {
			const user = await getAuthenticatedUser(res.locals.token);
			if (!user) {
				res.status(401).json("invalid token");
				return;
			}

			const participantId = parseIdToBigInt(
				req.body.participantId ?? req.query.participantId,
			);
			if (!participantId) {
				res.status(400).json("invalid participant id");
				return;
			}

			const chat = await ChatService.getOrCreatePersonalChat(user.id, participantId);
			if (typeof chat === "string") {
				res.status(400).json(chat);
				return;
			}

			res.status(200).json(chat);
		} catch (error) {
			next(error);
		}
	},

	getMessages: async (req, res, next) => {
		try {
			const user = await getAuthenticatedUser(res.locals.token);
			if (!user) {
				res.status(401).json("invalid token");
				return;
			}

			const chatId = parseIdToBigInt(req.params.chatId);
			if (!chatId) {
				res.status(400).json("invalid chat id");
				return;
			}

			const isParticipant = await ChatService.isUserChatParticipant(chatId, user.id);
			if (!isParticipant) {
				res.status(403).json("you are not chat participant");
				return;
			}

			const cursorId = parseIdToBigInt(req.query.cursorId);
			const result = await ChatService.getMessages(chatId, {
				limit: limitFromQuery(req.query.limit, 10),
				...(cursorId ? { cursorId } : {}),
			}, user.id);

			res.status(200).json({
				messages: result.items,
				hasMore: result.hasMore,
				nextCursor: result.nextCursor,
			});
		} catch (error) {
			next(error);
		}
	},

	markMessagesAsRead: async (req, res, next) => {
		try {
			const user = await getAuthenticatedUser(res.locals.token);
			if (!user) {
				res.status(401).json("invalid token");
				return;
			}

			const chatId = parseIdToBigInt(req.params.chatId);
			if (!chatId) {
				res.status(400).json("invalid chat id");
				return;
			}

			const isParticipant = await ChatService.isUserChatParticipant(chatId, user.id);
			if (!isParticipant) {
				res.status(403).json("you are not chat participant");
				return;
			}

			const readCount = await ChatService.markMessagesAsRead(chatId, user.id);
			res.status(200).json({ readCount });
		} catch (error) {
			next(error);
		}
	},
};

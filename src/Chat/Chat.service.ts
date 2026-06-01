import { client } from "../config/client";
import { ChatRepository } from "./Chat.repository";
import type { ChatServiceContract } from "./Chat.types";

const isPositiveId = (value: number | bigint) =>
	typeof value === "bigint"
		? value > 0n
		: Number.isInteger(value) && value > 0;

const normalizeImages = (images?: string[]) =>
	(images ?? []).map((image) => image.trim()).filter(Boolean);

export const ChatService: ChatServiceContract = {
	...ChatRepository,

	getOrCreatePersonalChat: async (userId, participantId) => {
		if (!isPositiveId(participantId)) return "invalid participant id";
		if (userId === participantId) return "you cannot create chat with yourself";

		const participant = await client.user_app_user.findUnique({
			where: { id: Number(participantId) },
			select: { id: true },
		});
		if (!participant) return "participant not found";

		const existingChat = await ChatRepository.getPersonalChatByParticipants(
			userId,
			participantId,
		);
		if (existingChat) return existingChat;

		return ChatRepository.createPersonalChat(userId, participantId);
	},

	sendMessage: async (userId, chatId, text, images) => {
		if (!isPositiveId(chatId)) return "invalid chat id";

		const normalizedText = text.trim();
		const normalizedImages = normalizeImages(images);
		if (!normalizedText && normalizedImages.length === 0) {
			return "message text or image is required";
		}

		const isParticipant = await ChatRepository.isUserChatParticipant(chatId, userId);
		if (!isParticipant) return "you are not chat participant";

		return ChatRepository.createMessage(
			chatId,
			userId,
			normalizedText,
			normalizedImages,
		);
	},
};

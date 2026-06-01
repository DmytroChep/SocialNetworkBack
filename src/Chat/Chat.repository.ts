import { client } from "../config/client";
import { saveDataUriImage } from "../utils/media-files";
import { ensureBigInt } from "../bigints";
import type {
	ChatRepositoryContract,
	PaginatedResult,
	PaginationParams,
} from "./Chat.types";

const userSelect = {
	id: true,
	username: true,
	first_name: true,
	last_name: true,
	email: true,
	profile: {
		select: {
			id: true,
			user_id: true,
			avatar: true,
			pseudonym: true,
		},
	},
} as const;

const messageInclude = {
	sender: {
		select: userSelect,
	},
	images: true,
} as const;

const chatInclude = {
	users: {
		include: {
			user: {
				select: userSelect,
			},
		},
	},
	messages: {
		take: 1,
		orderBy: { created_at: "desc" as const },
		include: messageInclude,
	},
	_count: {
		select: {
			messages: true,
		},
	},
} as const;

const takeWithCursor = ({ limit, cursorId }: PaginationParams) => ({
	take: limit + 1,
	...(cursorId ? { cursor: { id: Number(cursorId) }, skip: 1 } : {}),
});

const paginate = <T extends { id: number | bigint }>(
	items: T[],
	limit: number,
): PaginatedResult<T> => {
	const hasMore = items.length > limit;
	const normalizedItems = hasMore ? items.slice(0, limit) : items;

	return {
		items: normalizedItems,
		hasMore,
		nextCursor: hasMore ? normalizedItems.at(-1)?.id ?? null : null,
	};
};

const withChatMeta = async (chat: any, currentUserId: number | bigint) => {
	const uid = Number(currentUserId as any);
	const unreadCount = await client.chat_app_message.count({
		where: {
			chat_id: chat.id,
			sender_id: { not: uid },
			readers: {
				none: {
					user_id: uid,
				},
			},
		},
	});

	return {
		...chat,
		lastMessage: chat.messages?.[0] ?? null,
		unreadCount,
	};
};

const normalizeMessageImages = (
	images: string[],
	chatId: number | bigint,
	userId: number | bigint,
) =>
	images
		.map((image) => image.trim())
		.filter(Boolean)
		.map((image, index) =>
			saveDataUriImage(image, "messages", `message_${String(chatId)}_${String(userId)}`, index),
		);

export const ChatRepository: ChatRepositoryContract = {
	getPersonalChats: async (userId, pagination) => {
		const uid = Number(userId as any);
		const chats = await client.chat_app_chat.findMany({
			...takeWithCursor(pagination),
			where: {
				is_group: false,
				users: {
					some: { user_id: uid },
				},
			},
			orderBy: { id: "desc" },
			include: chatInclude,
		});
		const page = paginate(chats, pagination.limit);
		const items = await Promise.all(
			page.items.map((chat) => withChatMeta(chat, uid)),
		);

		return { ...page, items };
	},

	getPersonalChatByParticipants: async (userId, participantId) => {
		const uid = Number(userId as any);
		const pid = Number(participantId as any);
		const chat = await client.chat_app_chat.findFirst({
			where: {
				is_group: false,
				AND: [
					{ users: { some: { user_id: uid } } },
					{ users: { some: { user_id: pid } } },
				],
				users: {
					every: {
						user_id: { in: [uid, pid] },
					},
				},
			},
			include: chatInclude,
		});

		return chat ? withChatMeta(chat, uid) : null;
	},

	getChatById: async (chatId, userId) => {
		const cid = Number(chatId as any);
		const uid = Number(userId as any);
		const chat = await client.chat_app_chat.findFirst({
			where: {
				id: cid,
				users: {
					some: { user_id: uid },
				},
			},
			include: chatInclude,
		});

		return chat ? withChatMeta(chat, uid) : null;
	},

	getChatParticipants: async (chatId) => {
		const cid = Number(chatId as any);
		const participants = await client.chat_app_chat_users.findMany({
			where: { chat_id: cid },
			select: { user_id: true },
		});

		return participants;
	},

	createPersonalChat: async (userId, participantId) => {
		const uid = Number(userId as any);
		const pid = Number(participantId as any);
		const chat = await client.chat_app_chat.create({
			data: {
				is_group: false,
				users: {
					create: [{ user_id: uid }, { user_id: pid }],
				},
			},
			include: chatInclude,
		});

		return withChatMeta(chat, uid);
	},

	isUserChatParticipant: async (chatId, userId) => {
		const cid = Number(chatId as any);
		const uid = Number(userId as any);
		const count = await client.chat_app_chat_users.count({
			where: { chat_id: cid, user_id: uid },
		});

		return count > 0;
	},

	getMessages: async (chatId, pagination) => {
		const cid = Number(chatId as any);
		const messages = await client.chat_app_message.findMany({
			...takeWithCursor(pagination),
			where: { chat_id: cid },
			orderBy: { created_at: "desc" },
			include: messageInclude,
		});

		const page = paginate(messages, pagination.limit);

		return {
			items: page.items,
			hasMore: page.hasMore,
			nextCursor: page.nextCursor,
		};
	},

	createMessage: async (chatId, userId, text, images = []) => {
		const cid = Number(chatId as any);
		const uid = Number(userId as any);
		const imagePaths = normalizeMessageImages(images, cid, uid);

		return client.chat_app_message.create({
			data: {
				created_at: new Date(),
				chat_id: cid,
				sender_id: uid,
				text,
				...(imagePaths.length > 0
					? {
							images: {
								create: imagePaths.map((image) => ({ image })),
							},
						}
					: {}),
			},
			include: messageInclude,
		});
	},

	markMessagesAsRead: async (chatId, userId) => {
		const cid = Number(chatId as any);
		const uid = Number(userId as any);
		const unreadMessages = await client.chat_app_message.findMany({
			where: {
				chat_id: cid,
				sender_id: { not: uid },
				readers: {
					none: { user_id: uid },
				},
			},
			select: { id: true },
		});

		if (unreadMessages.length === 0) return 0;

		await client.chat_app_message_readers.createMany({
			data: unreadMessages.map((message) => ({
				message_id: message.id,
				user_id: uid,
			})),
		});

		return unreadMessages.length;
	},
};

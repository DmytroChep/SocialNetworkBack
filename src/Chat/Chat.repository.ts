import { client } from "../config/client";
import { getMediaUrl, saveDataUriImage } from "../utils/media-files";
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

	const last = chat.messages?.[0] ?? null;
	const serializeUserSelect = (user: any) =>
		user
			? {
				  ...user,
				  profile: user.profile
					  ? { ...user.profile, avatar: getMediaUrl(user.profile.avatar) ?? user.profile.avatar }
					  : user.profile,
			  }
			: user;

	const serializeMessage = (m: any) =>
		m
			? {
				  ...m,
				  images: Array.isArray(m.images)
					  ? m.images.map((img: any) => ({ ...img, image: getMediaUrl(typeof img === "string" ? img : img.image) ?? (typeof img === "string" ? img : img.image) }))
					  : m.images,
				  sender: serializeUserSelect(m.sender),
			  }
			: m;

	return {
		...chat,
		lastMessage: serializeMessage(last),
		unreadCount,
	};
};

const normalizeMessageImages = async (
  images: string[],
  chatId: number | bigint,
  userId: number | bigint,
): Promise<string[]> => {
  const filtered = images.map((image) => image.trim()).filter(Boolean);

  const result: string[] = [];
  for (let index = 0; index < filtered.length; index++) {
    const path = await saveDataUriImage(
      filtered[index],
      "media/chat_app/message_images",
      `message_${String(chatId)}_${String(userId)}`,
      index,
    );
    result.push(path);
  }
  return result;
};


export const ChatRepository: ChatRepositoryContract = {
	getPersonalChats: async (userId, pagination) => {
		const uid = Number(userId as any);
		const chats = await client.chat_app_chat.findMany({
			...takeWithCursor(pagination),
			where: {
				users: {
					some: { user_id: uid },
				},
			},
			orderBy: { id: "desc" },
			include: chatInclude,
		});
		const page = paginate(chats, pagination.limit);
		const items = page.items;

		// Batch unread counts with a single grouped query to avoid many parallel DB calls
		const chatIds = items.map((c) => Number(c.id)).filter(Boolean);
		let unreadMap = new Map<number, number>();
		if (chatIds.length > 0) {
			const unread = await client.chat_app_message.groupBy({
				by: ["chat_id"],
				where: {
					chat_id: { in: chatIds },
					sender_id: { not: uid },
					readers: {
						none: {
							user_id: uid,
						},
					},
				},
				_count: { _all: true },
			});

			unreadMap = new Map(
				(unread as any[]).map((u) => [Number(u.chat_id), Number(u._count?._all ?? 0)]),
			);
		}

		const serializeUserSelect = (user: any) =>
			user
				? {
					  ...user,
					  profile: user.profile
						  ? { ...user.profile, avatar: getMediaUrl(user.profile.avatar) ?? user.profile.avatar }
						  : user.profile,
				  }
				: user;

		const serializeMessage = (m: any) =>
			m
				? {
					  ...m,
					  images: Array.isArray(m.images)
						  ? m.images.map((img: any) => ({ ...img, image: getMediaUrl(typeof img === "string" ? img : img.image) ?? (typeof img === "string" ? img : img.image) }))
						  : m.images,
					  sender: serializeUserSelect(m.sender),
				  }
				: m;

		const itemsWithMeta = items.map((chat) => ({
			...chat,
			lastMessage: serializeMessage(chat.messages?.[0] ?? null),
			unreadCount: unreadMap.get(Number(chat.id)) ?? 0,
		}));

		return { ...page, items: itemsWithMeta };
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
				users: { some: { user_id: uid } },
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

	getMessages: async (chatId, pagination, userId?) => {
    const cid = Number(chatId as any);
    const uid = userId ? Number(userId as any) : null;
    const messages = await client.chat_app_message.findMany({
        ...takeWithCursor(pagination),
        where: { chat_id: cid },
        orderBy: { created_at: "desc" },
        include: {
            ...messageInclude,
            readers: {
                select: { user_id: true },
            },
        },
    });

    const page = paginate(messages, pagination.limit);

	const itemsWithRead = page.items.map((m: any) => ({
        ...m,
        // is_read = true якщо хтось ІНШИЙ (не відправник) прочитав повідомлення
        is_read: m.readers?.some(
            (r: any) => Number(r.user_id) !== Number(m.sender_id)
        ) ?? false,
		images: Array.isArray(m.images)
			? m.images.map((img: any) => ({ ...img, image: getMediaUrl(typeof img === "string" ? img : img.image) ?? (typeof img === "string" ? img : img.image) }))
			: m.images,
		sender: m.sender
			? {
				  ...m.sender,
				  profile: m.sender.profile
					  ? { ...m.sender.profile, avatar: getMediaUrl(m.sender.profile.avatar) ?? m.sender.profile.avatar }
					  : m.sender.profile,
			  }
			: m.sender,
		readers: undefined,
    }));

    return {
        items: itemsWithRead,
        hasMore: page.hasMore,
        nextCursor: page.nextCursor,
    };
},

	createMessage: async (chatId, userId, text, images = []) => {
  const cid = Number(chatId as any);
  const uid = Number(userId as any);
  const imagePaths = await normalizeMessageImages(images, cid, uid);  // ✅ await

	const created = await client.chat_app_message.create({
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

	// Serialize created message: convert images and sender avatar to full URLs
	const serialized = {
		...created,
		images: Array.isArray(created.images)
			? created.images.map((img: any) => ({ ...img, image: getMediaUrl(typeof img === "string" ? img : img.image) ?? (typeof img === "string" ? img : img.image) }))
			: created.images,
		sender: created.sender
			? {
					...created.sender,
					profile: created.sender.profile
						? { ...created.sender.profile, avatar: getMediaUrl(created.sender.profile.avatar) ?? created.sender.profile.avatar }
						: created.sender.profile,
				}
			: created.sender,
	};

	return serialized;
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
			skipDuplicates: true, // ← додати
		});
		return unreadMessages.length;
	},
};

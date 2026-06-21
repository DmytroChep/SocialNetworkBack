import { client } from "../config/client";
import { ChatRepository } from "../Chat/Chat.repository";
import { deleteMediaFiles, saveDataUriImage } from "../utils/media-files";

const saveGroupAvatar = async (
  avatar: string | null | undefined,
  prefix: string,
): Promise<string | null | undefined> => {
  if (avatar === undefined) return undefined;
  if (!avatar) return null;

  return saveDataUriImage(avatar, "media/chat_app/group_avatars", prefix);  // ✅ вже повертає Promise<string>
};
export class GroupChatRepository {

    async createGroup(name: string, allMemberIds: number[], creatorId: number, avatar?: string | null) {
        const groupAvatar = await saveGroupAvatar(avatar, `group_${creatorId}`);
        const chatId = await client.$transaction(async (tx) => {
            const chat = await tx.chat_app_chat.create({
                data: {
                    name,
                    is_group: true,
                    avatar: groupAvatar ?? null,
                    admin_id: creatorId,
                    users: {
                        create: allMemberIds.map((userId) => ({
                            user_id: userId,
                        })),
                    },
                },
                select: {
                    id: true,
                },
            });

            return chat.id;
        });

        return ChatRepository.getChatById(chatId, creatorId);
    }

    async updateGroup(
        chatId: number,
        currentUserId: number,
        name: string,
        allMemberIds: number[],
        avatar?: string | null,
    ) {
        const currentChat = await client.chat_app_chat.findFirst({
            where: {
                id: chatId,
                is_group: true,
                admin_id: currentUserId,
            },
            select: {
                avatar: true,
                users: {
                    select: {
                        user_id: true,
                    },
                },
            },
        });

        if (!currentChat) {
            throw new Error("Ви не можете редагувати цю групу");
        }

        const nextAvatar = await saveGroupAvatar(avatar, `group_${chatId}_${currentUserId}`);

        await client.$transaction(async (tx) => {
            await tx.chat_app_chat.update({
                where: { id: chatId },
                data: {
                    name,
                    ...(nextAvatar !== undefined ? { avatar: nextAvatar } : {}),
                },
            });

            await tx.chat_app_chat_users.deleteMany({
                where: { chat_id: chatId },
            });

            await tx.chat_app_chat_users.createMany({
                data: allMemberIds.map((userId) => ({
                    chat_id: chatId,
                    user_id: userId,
                })),
            });
        });

        if (nextAvatar !== undefined && nextAvatar !== currentChat.avatar) {
            await deleteMediaFiles([currentChat.avatar]);
        }

        const previousUserIds = currentChat.users.map((user) => user.user_id);
        const nextUserIds = new Set(allMemberIds.map((userId) => String(userId)));
        const removedUserIds = previousUserIds.filter(
            (userId) => !nextUserIds.has(String(userId)),
        );
        const updatedChat = await ChatRepository.getChatById(chatId, currentUserId);

        return {
            chat: updatedChat,
            affectedUserIds: Array.from(
                new Set([
                    ...previousUserIds,
                    ...allMemberIds,
                ]),
            ),
            removedUserIds,
        };
    }

    async deleteGroup(chatId: number, currentUserId: number) {
        const chat = await client.chat_app_chat.findFirst({
            where: {
                id: chatId,
                is_group: true,
                admin_id: currentUserId,
            },
            include: {
                users: {
                    select: {
                        user_id: true,
                    },
                },
                messages: {
                    include: {
                        images: true,
                    },
                },
            },
        });

        if (!chat) {
            throw new Error("Ви не можете видалити цю групу");
        }

        const participantIds = chat.users.map((user) => user.user_id);
        const messageIds = chat.messages.map((message) => message.id);
        const mediaPaths = [
            chat.avatar,
            ...chat.messages.flatMap((message) =>
                message.images.map((image) => image.image),
            ),
        ];

        await client.$transaction(async (tx) => {
            if (messageIds.length > 0) {
                await tx.chat_app_message_readers.deleteMany({
                    where: { message_id: { in: messageIds } },
                });
                await tx.chat_app_messageimage.deleteMany({
                    where: { message_id: { in: messageIds } },
                });
                await tx.chat_app_message.deleteMany({
                    where: { id: { in: messageIds } },
                });
            }

            await tx.chat_app_chat_users.deleteMany({
                where: { chat_id: chatId },
            });
            await tx.chat_app_chat.delete({
                where: { id: chatId },
            });
        });

        await deleteMediaFiles(mediaPaths);

        return {
            chatId,
            participantIds,
        };
    }

    async removeMember(chatId: number, userId: number) {
        return await client.chat_app_chat_users.deleteMany({
        where: {
            chat_id: chatId,
            user_id: userId,
        },
        });
    }
}

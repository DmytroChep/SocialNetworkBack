import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

export class GroupChatRepository {

    async createGroup(name: string, allMemberIds: number[]) {
        return await prisma.$transaction(async (tx) => {
        const chat = await tx.chat.create({
            data: {
            name: name,
            is_group: true,
            avatar: null,
            },
        });

        await prisma.chatUser.createMany({
            data: allMemberIds.map((userId) => ({
                chat_id: chat.id,
                user_id: userId,
            })),
        });

        return chat;
        });
    }

    async removeMember(chatId: number, userId: number) {
        return await prisma.chatUser.deleteMany({
        where: {
            chat_id: chatId,
            user_id: userId,
        },
        });
    }
}
import { GroupChatRepository } from "./GroupChat.repository";
import { CreateGroupDto, RemoveMemberDto, UpdateGroupDto } from "./GroupChat.types";

const normalizeMemberIds = (creatorId: number, userIds: number[]) => {
    const memberIds = userIds
        .map(id => Number(id))
        .filter(id => Number.isInteger(id) && id > 0);

    return Array.from(new Set([Number(creatorId), ...memberIds]));
};

export class GroupChatService {
    private repository = new GroupChatRepository();

    async createGroupChat(dto: CreateGroupDto, creatorId: number) {
        if (!dto.name?.trim() || !dto.userIds || !Array.isArray(dto.userIds)) {
        throw new Error("Некоректні дані для створення групи");
        }

        const uniqueMemberIds = normalizeMemberIds(creatorId, dto.userIds);
        if (uniqueMemberIds.length < 2) {
        throw new Error("Додайте хоча б одного учасника групи");
        }

        return await this.repository.createGroup(dto.name.trim(), uniqueMemberIds, Number(creatorId), dto.avatar);
    }

    async updateGroupChat(chatId: number, dto: UpdateGroupDto, currentUserId: number) {
        if (!chatId || !dto.name?.trim() || !dto.userIds || !Array.isArray(dto.userIds)) {
        throw new Error("Некоректні дані для редагування групи");
        }

        const uniqueMemberIds = normalizeMemberIds(currentUserId, dto.userIds);
        if (uniqueMemberIds.length < 2) {
        throw new Error("Додайте хоча б одного учасника групи");
        }

        return await this.repository.updateGroup(
            Number(chatId),
            Number(currentUserId),
            dto.name.trim(),
            uniqueMemberIds,
            dto.avatar,
        );
    }

    async deleteGroupChat(chatId: number, currentUserId: number) {
        if (!chatId) {
        throw new Error("Некоректний чат");
        }

        return await this.repository.deleteGroup(Number(chatId), Number(currentUserId));
    }

    async removeMemberFromChat(dto: RemoveMemberDto, currentUserId: number) {
        if (!dto.chatId || !dto.userId) {
        throw new Error("Некоректні дані для видалення учасника");
        }

        return await this.repository.removeMember(Number(dto.chatId), Number(dto.userId));
    }
}

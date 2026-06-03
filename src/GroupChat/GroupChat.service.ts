import { GroupChatRepository } from "./GroupChat.repository";
import { CreateGroupDto, RemoveMemberDto } from "./GroupChat.types";

export class GroupChatService {
    private repository = new GroupChatRepository();

    async createGroupChat(dto: CreateGroupDto, creatorId: number) {
        if (!dto.name || !dto.userIds || !Array.isArray(dto.userIds)) {
        throw new Error("Некоректні дані для створення групи");
        }

        const memberIds = dto.userIds.map(id => Number(id));

        const uniqueMemberIds = Array.from(new Set([Number(creatorId), ...memberIds]));

        return await this.repository.createGroup(dto.name, uniqueMemberIds);
    }

    async removeMemberFromChat(dto: RemoveMemberDto, currentUserId: number) {
        if (!dto.chatId || !dto.userId) {
        throw new Error("Некоректні дані для видалення учасника");
        }

        return await this.repository.removeMember(Number(dto.chatId), Number(dto.userId));
    }
}
export interface CreateGroupDto {
    name: string;
    userIds: number[];
}

export interface RemoveMemberDto {
    chatId: number;
    userId: number;
}
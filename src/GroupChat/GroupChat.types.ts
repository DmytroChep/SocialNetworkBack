export interface CreateGroupDto {
    name: string;
    userIds: number[];
    avatar?: string | null;
}

export interface UpdateGroupDto {
    name?: string;
    userIds?: number[];
    avatar?: string | null;
}

export interface RemoveMemberDto {
    chatId: number;
    userId: number;
}

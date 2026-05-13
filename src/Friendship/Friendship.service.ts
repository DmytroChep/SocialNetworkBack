import { FriendshipRepository } from "./Friendship.repository";
import type { ServiceContract } from "./Friendship.types";

export const FriendshipService: ServiceContract = {
    userFriendships: async (userId) => {
        const id = Number(userId);
        if (isNaN(id)) return "Invalid ID";
        return await FriendshipRepository.userFriendships(id);
    },

    changeStatus: async (id, status) => {
        const validStatuses = ['PENDING', 'ACCEPTED', 'REJECTED'];
        if (!validStatuses.includes(status)) return "Invalid status";
        return await FriendshipRepository.changeStatus(id, status);
    },

    delete: async (id) => {
        return await FriendshipRepository.delete(id);
    },

    createRequest: async (senderId, receiverId) => {
        if (senderId === receiverId) return "You cannot be friends with yourself";
        return await FriendshipRepository.create(senderId, receiverId);
    }
};
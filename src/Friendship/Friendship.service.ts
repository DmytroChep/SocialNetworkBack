import { FriendshipRepository } from "./Friendship.repository";
import {
	FRIENDSHIP_STATUSES,
	type FriendshipStatusAction,
	type ServiceContract,
} from "./Friendship.types";

const isFriendshipStatus = (status: string): status is FriendshipStatusAction =>
	FRIENDSHIP_STATUSES.includes(status as FriendshipStatusAction);

export const FriendshipService: ServiceContract = {
	userFriendships: async (userId) => {
		const id = Number(userId);
		if (isNaN(id)) return "Invalid ID";
		return await FriendshipRepository.userFriendships(id);
	},

	changeStatus: async (id, status) => {
		if (isNaN(id)) return "Invalid ID";
		if (!isFriendshipStatus(status)) return "Invalid status";
		return await FriendshipRepository.changeStatus(id, status);
	},

	delete: async (id) => {
		if (isNaN(id)) return "Invalid ID";
		return await FriendshipRepository.delete(id);
	},

	createRequest: async (senderId, receiverId, status = "pending") => {
		if (isNaN(senderId) || isNaN(receiverId)) return "Invalid ID";
		if (senderId === receiverId) return "You cannot be friends with yourself";
		if (!isFriendshipStatus(status)) return "Invalid status";
		return await FriendshipRepository.create(senderId, receiverId, status);
	},
};

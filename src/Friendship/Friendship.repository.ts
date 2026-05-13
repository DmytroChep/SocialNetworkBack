import { client } from "../config/client";
import type { FriendshipWithUsers, RepositoryContract } from "./Friendship.types";

export const FriendshipRepository: RepositoryContract = {
    userFriendships: async (userId) => {
        return await client.friendship.findMany({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }]
            },
            include: {
                sender: { include: { currentAvatar: true } },
                receiver: { include: { currentAvatar: true } }
            }
        }) as FriendshipWithUsers[];
    },

    changeStatus: async (id, status) => {
        return await client.friendship.update({
            where: { id },
            data: { status }
        });
    },

    delete: async (id) => {
        return await client.friendship.delete({
            where: { id }
        });
    },

    create: async (senderId, receiverId) => {
        return await client.friendship.create({
            data: {
                senderId,
                receiverId,
                status: "PENDING"
            }
        });
    }
};
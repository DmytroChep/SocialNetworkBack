import { FriendshipService } from "./Friendship.service";
import type { ControllerContract } from "./Friendship.types";

export const FriendshipController: ControllerContract = {
    userFriendships: async (req, res) => {
        const response = await FriendshipService.userFriendships(req.params.userId as string);
        res.status(200).json(response);
    },

    changeStatus: async (req, res) => {
        const { requestId, friendshipId, status } = req.body;
        const response = await FriendshipService.changeStatus(Number(requestId ?? friendshipId), status);
        res.status(200).json(response);
    },

    deleteFriendship: async (req, res) => {
        const response = await FriendshipService.delete(Number(req.params.id));
        res.status(200).json(response);
    },

    createRequest: async (req, res) => {
        const { senderId, receiverId, fromUserId, toUserId } = req.body;
        const response = await FriendshipService.createRequest(
            Number(senderId ?? fromUserId),
            Number(receiverId ?? toUserId),
        );
        res.status(200).json(response);
    }
};

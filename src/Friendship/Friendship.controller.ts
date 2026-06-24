import { SocketManager } from "../Socket/socket.manager";
import { FriendshipService } from "./Friendship.service";
import type { ControllerContract } from "./Friendship.types";

export const FriendshipController: ControllerContract = {
    userFriendships: async (req, res) => {
        const response = await FriendshipService.userFriendships(req.params.userId as string);
        res.status(200).json(response);
    },

    changeStatus: async (req, res) => {
        const { requestId, friendshipId, status } = req.body;
        const response = await FriendshipService.changeStatus(
            Number(requestId ?? friendshipId),
            status,
        );
        res.status(200).json(response);
    },

    deleteFriendship: async (req, res) => {
        const response = await FriendshipService.delete(Number(req.params.id));
        res.status(200).json(response);
    },

    createRequest: async (req, res) => {
        const { senderId, receiverId, fromUserId, toUserId, status } = req.body;

        const senderIdNum = Number(senderId ?? fromUserId);
        const receiverIdNum = Number(receiverId ?? toUserId);

        const response = await FriendshipService.createRequest(
            senderIdNum,
            receiverIdNum,
            status,
        );

        // Шлём в Django если запрос создан (не строка-ошибка)
        if (response && typeof response === "object") {
            try {
                const fromUser = (response as any).from_user;

                SocketManager.socketServer?.of("/django-bridge").emit("server_event", {
                    type: "friend:request",
                    toUserId: receiverIdNum,
                    fromUserId: senderIdNum,
                    pseudonym: fromUser?.profile?.pseudonym ?? "",
                    username: fromUser?.username ?? "",
                });
            } catch (e) {
                console.error("Socket emit error:", e);
            }
        }

        res.status(200).json(response);
    },
};
import { Request, Response } from "express";
import { getUserFromToken } from "../utils/auth-token";
import { sanitizeBigInts } from "../bigints";
import { SocketManager } from "../Socket/socket.manager";
import { GroupChatService } from "./GroupChat.service";
import { CreateGroupDto, RemoveMemberDto, UpdateGroupDto } from "./GroupChat.types";

const parsePositiveId = (value: unknown): number | null => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const emitChatsChanged = (userIds: Array<number | bigint>) => {
    const io = SocketManager.socketServer;
    if (!io) return;

    userIds.forEach((userId) => {
        io.to(`user-${String(userId)}`).emit("chat:updated", null);
    });
};

const leaveChatRoom = (chatId: number, userIds: Array<number | bigint>) => {
    const io = SocketManager.socketServer;
    if (!io) return;

    userIds.forEach((userId) => {
        io.in(`user-${String(userId)}`).socketsLeave(`chat-${chatId}`);
    });
};

const getChatUserIds = (chat: any): Array<number | bigint> =>
    (chat?.users ?? []).map((member: any) => member.user_id).filter(Boolean);

export class GroupChatController {
    private service = new GroupChatService();

    createGroup = async (req: Request, res: Response) => {
        try {
            const dto: CreateGroupDto = req.body;
            const user = await getUserFromToken(res.locals.token);

            if (!user) {
                return res.status(401).json("bad token");
            }

            const newChat = await this.service.createGroupChat(dto, Number(user.id));
            emitChatsChanged(getChatUserIds(newChat));
            
            return res.status(201).json(newChat);
            } catch (error: any) {
            console.error("Error in GroupChatController (create):", error);

            return res.status(400).json({ message: error.message || "Помилка сервера" });
            }
        };

    updateGroup = async (req: Request<{ chatId: string }>, res: Response) => {
        try {
            const dto: UpdateGroupDto = req.body;
            const user = await getUserFromToken(res.locals.token);
            const chatId = parsePositiveId(req.params.chatId);

            if (!user) {
                return res.status(401).json("bad token");
            }

            if (!chatId) {
                return res.status(400).json({ message: "Некоректний чат" });
            }

            const updateResult = await this.service.updateGroupChat(chatId, dto, Number(user.id));
            leaveChatRoom(chatId, updateResult.removedUserIds);
            emitChatsChanged(updateResult.affectedUserIds);

            return res.status(200).json(updateResult.chat);
        } catch (error: any) {
            console.error("Error in GroupChatController (update):", error);

            return res.status(400).json({ message: error.message || "Помилка сервера" });
        }
    };

    deleteGroup = async (req: Request<{ chatId: string }>, res: Response) => {
        try {
            const user = await getUserFromToken(res.locals.token);
            const chatId = parsePositiveId(req.params.chatId);

            if (!user) {
                return res.status(401).json("bad token");
            }

            if (!chatId) {
                return res.status(400).json({ message: "Некоректний чат" });
            }

            const result = await this.service.deleteGroupChat(chatId, Number(user.id));
            leaveChatRoom(chatId, result.participantIds);
            emitChatsChanged(result.participantIds);

            return res.status(200).json(sanitizeBigInts(result));
        } catch (error: any) {
            console.error("Error in GroupChatController (delete):", error);

            return res.status(400).json({ message: error.message || "Помилка сервера" });
        }
    };

    removeMember = async (req: Request, res: Response) => {
        try {
            const dto: RemoveMemberDto = req.body;
            const user = await getUserFromToken(res.locals.token);

            if (!user) {
                return res.status(401).json("bad token");
            }

            await this.service.removeMemberFromChat(dto, Number(user.id));
            
            return res.status(200).json({ message: "Учасника успішно видалено з чату" });
            } catch (error: any) {
            console.error("Error in GroupChatController (removeMember):", error);

            return res.status(400).json({ message: error.message || "Помилка сервера" });
            }
    };
}

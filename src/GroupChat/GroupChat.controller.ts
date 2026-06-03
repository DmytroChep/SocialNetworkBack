import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { GroupChatService } from "./GroupChat.service";
import { CreateGroupDto, RemoveMemberDto } from "./GroupChat.types";

export class GroupChatController {
    private service = new GroupChatService();

    createGroup = async (req: Request, res: Response) => {
        try {
            const dto: CreateGroupDto = req.body;
            const token = res.locals.token;

            if (!token) {
                return res.status(401).json("bad token");
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || "YOUR_JWT_SECRET") as { id: number };
            const creatorId = decoded.id;

            if (!creatorId) {
                return res.status(401).json("bad token");
            }

            const newChat = await this.service.createGroupChat(dto, Number(creatorId));
            
            return res.status(201).json(newChat);
            } catch (error: any) {
            console.error("Error in GroupChatController (create):", error);
            
            if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
                return res.status(401).json("bad token");
            }
            
            return res.status(400).json({ message: error.message || "Помилка сервера" });
            }
        };

    removeMember = async (req: Request, res: Response) => {
        try {
            const dto: RemoveMemberDto = req.body;
            const token = res.locals.token;

            if (!token) {
                return res.status(401).json("bad token");
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || "YOUR_JWT_SECRET") as { id: number };
            const currentUserId = decoded.id;

            if (!currentUserId) {
                return res.status(401).json("bad token");
            }

            await this.service.removeMemberFromChat(dto, Number(currentUserId));
            
            return res.status(200).json({ message: "Учасника успішно видалено з чату" });
            } catch (error: any) {
            console.error("Error in GroupChatController (removeMember):", error);
            
            if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
                return res.status(401).json("bad token");
            }
            
            return res.status(400).json({ message: error.message || "Помилка сервера" });
            }
    };
}
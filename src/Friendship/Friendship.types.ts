import { Request, Response } from "express";
import { Prisma } from "../generated/prisma";

export type FriendshipWithUsers = Prisma.FriendshipGetPayload<{
    include: { 
        sender: { include: { currentAvatar: true } }, 
        receiver: { include: { currentAvatar: true } } 
    }
}>;

export interface RepositoryContract {
    userFriendships: (userId: number) => Promise<FriendshipWithUsers[]>;
    changeStatus: (id: number, status: string) => Promise<any>;
    delete: (id: number) => Promise<any>;
    create: (senderId: number, receiverId: number) => Promise<any>;
}

export interface ServiceContract {
    userFriendships: (userId: string) => Promise<FriendshipWithUsers[] | string>;
    changeStatus: (id: number, status: string) => Promise<any>;
    delete: (id: number) => Promise<any>;
    createRequest: (senderId: number, receiverId: number) => Promise<any>;
}

export interface ControllerContract {
    userFriendships: (req: Request, res: Response) => Promise<void>;
    changeStatus: (req: Request, res: Response) => Promise<void>;
    deleteFriendship: (req: Request, res: Response) => Promise<void>;
    createRequest: (req: Request, res: Response) => Promise<void>;
}
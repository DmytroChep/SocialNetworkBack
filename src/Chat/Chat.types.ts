import type { NextFunction, Request, Response } from "express";

export interface PaginationParams {
	limit: number;
	cursorId?: number | bigint;
}

export interface PaginatedResult<T> {
	items: T[];
	hasMore: boolean;
	nextCursor: number | bigint | null;
}

export interface CreatePersonalChatBody {
	participantId?: number | string;
}

export interface SendMessagePayload {
	text?: string;
	images?: string[];
}

export interface ChatControllerContract {
	getChats: (
		req: Request<object, unknown, object, { take?: string; cursorId?: string }>,
		res: Response,
		next: NextFunction,
	) => Promise<void>;
	createPersonalChat: (
		req: Request<object, unknown, CreatePersonalChatBody, { participantId?: string }>,
		res: Response,
		next: NextFunction,
	) => Promise<void>;
	getMessages: (
		req: Request<{ chatId: string }, unknown, object, { limit?: string; cursorId?: string }>,
		res: Response,
		next: NextFunction,
	) => Promise<void>;
	markMessagesAsRead: (
		req: Request<{ chatId: string }>,
		res: Response,
		next: NextFunction,
	) => Promise<void>;
}

export interface ChatRepositoryContract {
	getPersonalChats: (userId: number | bigint, pagination: PaginationParams) => Promise<PaginatedResult<any>>;
	getPersonalChatByParticipants: (userId: number | bigint, participantId: number | bigint) => Promise<any | null>;
	getChatById: (chatId: number | bigint, userId: number | bigint) => Promise<any | null>;
	getChatParticipants: (chatId: number | bigint) => Promise<Array<{ user_id: number | bigint }>>;
	createPersonalChat: (userId: number | bigint, participantId: number | bigint) => Promise<any>;
	isUserChatParticipant: (chatId: number | bigint, userId: number | bigint) => Promise<boolean>;
	getMessages: (
		chatId: number | bigint,
		pagination: PaginationParams,
		userId?: number | bigint
) => Promise<PaginatedResult<any>>;
	createMessage: (chatId: number | bigint, userId: number | bigint, text: string, images?: string[]) => Promise<any>;
	markMessagesAsRead: (chatId: number | bigint, userId: number | bigint) => Promise<number>;
}

export interface ChatServiceContract extends ChatRepositoryContract {
	getOrCreatePersonalChat: (userId: number | bigint, participantId: number | bigint) => Promise<any | string>;
	sendMessage: (userId: number | bigint, chatId: number | bigint, text: string, images?: string[]) => Promise<any | string>;
}

export type SocketAck<T = unknown> =
	| { status: "ok"; data?: T }
	| { status: "error"; message: string };

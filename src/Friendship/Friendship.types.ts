import { Request, Response } from "express";
import { Prisma } from "../generated/prisma";

export type FriendshipProfile = Prisma.ProfileGetPayload<{
	include: {
		user: {
			select: {
				id: true;
				email: true;
				username: true;
				first_name: true;
				last_name: true;
			};
		};
	};
}>;

export type ProfileFriendWithProfiles = Prisma.ProfileFriendGetPayload<{
	include: {
		from_profile: { include: typeof profileInclude };
		to_profile: { include: typeof profileInclude };
	};
}>;

export type FriendRequestWithProfiles = Prisma.FriendRequestGetPayload<{
	include: {
		from_profile: { include: typeof profileInclude };
		to_profile: { include: typeof profileInclude };
	};
}>;

export type UserFriendships = {
	friends: ProfileFriendWithProfiles[];
	incomingRequests: FriendRequestWithProfiles[];
	outgoingRequests: FriendRequestWithProfiles[];
	blacklistedRequests: FriendRequestWithProfiles[];
};

export type FriendshipStatusAction =
	| "ACCEPTED"
	| "REJECTED"
	| "PENDING"
	| "BLACKLISTED";

export const FRIENDSHIP_STATUSES: FriendshipStatusAction[] = [
	"ACCEPTED",
	"REJECTED",
	"PENDING",
	"BLACKLISTED",
];

export const profileInclude = {
	user: {
		select: {
			id: true,
			email: true,
			username: true,
			first_name: true,
			last_name: true,
		},
	},
} satisfies Prisma.ProfileInclude;

export interface RepositoryContract {
	userFriendships: (userId: number) => Promise<UserFriendships | string>;
	changeStatus: (id: number, status: FriendshipStatusAction) => Promise<any>;
	delete: (id: number) => Promise<any>;
	create: (
		senderId: number,
		receiverId: number,
		status?: FriendshipStatusAction,
	) => Promise<any>;
}

export interface ServiceContract {
	userFriendships: (userId: string) => Promise<UserFriendships | string>;
	changeStatus: (id: number, status: string) => Promise<any>;
	delete: (id: number) => Promise<any>;
	createRequest: (
		senderId: number,
		receiverId: number,
		status?: string,
	) => Promise<any>;
}

export interface ControllerContract {
	userFriendships: (req: Request, res: Response) => Promise<void>;
	changeStatus: (req: Request, res: Response) => Promise<void>;
	deleteFriendship: (req: Request, res: Response) => Promise<void>;
	createRequest: (req: Request, res: Response) => Promise<void>;
}

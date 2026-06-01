import { Request, Response } from "express";
import { Prisma } from "@prisma/client";

export type FriendshipProfile = Prisma.profile_app_profileGetPayload<{}> & {
	user?: any;
};

export const userInclude = {
	profile: {
		select: {
			id: true,
			user_id: true,
			avatar: true,
			pseudonym: true,
			signature: true,
			birth_date: true,
			is_text_signature: true,
			is_image_signature: true,
		},
	},
} as const;

export type FriendRequestWithProfiles = Prisma.user_app_friendshipGetPayload<{}> & {
	from_user?: any;
	to_user?: any;
	from_profile?: FriendshipProfile | null;
	to_profile?: FriendshipProfile | null;
};

export type ProfileFriendWithProfiles = FriendRequestWithProfiles;

export type FriendshipWithProfiles = ProfileFriendWithProfiles | FriendRequestWithProfiles;

export type UserFriendships = {
	friends: ProfileFriendWithProfiles[];
	incomingRequests: FriendRequestWithProfiles[];
	outgoingRequests: FriendRequestWithProfiles[];
	blacklistedRequests: FriendRequestWithProfiles[];
};

export type FriendshipStatusAction =
	| "accepted"
	| "rejected"
	| "pending"
	| "blacklisted";

export const FRIENDSHIP_STATUSES: FriendshipStatusAction[] = [
	"accepted",
	"rejected",
	"pending",
	"blacklisted",
];

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

import { Prisma } from "@prisma/client";
import { client } from "../config/client";
import { getSignatureFileName } from "../utils/media-files";
import {
	type FriendRequestWithProfiles,
	type FriendshipStatusAction,
	type ProfileFriendWithProfiles,
	type RepositoryContract,
	type UserFriendships,
} from "./Friendship.types";

const profileSelect = {
	id: true,
	user_id: true,
	avatar: true,
	pseudonym: true,
	signature: true,
	birth_date: true,
	is_text_signature: true,
	is_image_signature: true,
} as const;

const userSelect = {
	id: true,
	email: true,
	username: true,
	first_name: true,
	last_name: true,
	profile: {
		select: profileSelect,
	},
} as const;

const friendshipInclude = {
	from_user: {
		select: userSelect,
	},
	to_user: {
		select: userSelect,
	},
} as const;

const serializeProfile = (profile: any) => {
	const signatureFileName = getSignatureFileName(profile?.signature);
	const signature = signatureFileName ?? (profile?.signature?.startsWith("data:") ? null : profile?.signature ?? null);
	return profile ? { ...profile, signature } : profile;
};

const profileFromUser = (user: any) => {
	const profile = user?.profile ?? {
		id: user?.id ?? null,
		user_id: user?.id ?? null,
		avatar: null,
		pseudonym: null,
		signature: null,
		birth_date: null,
		is_text_signature: false,
		is_image_signature: false,
	};

	return serializeProfile({
		...profile,
		user: user
			? {
					id: user.id,
					email: user.email,
					username: user.username,
					first_name: user.first_name,
					last_name: user.last_name,
				}
			: null,
	});
};

const serializeFriendship = (friendship: any) => {
	const fromProfile = profileFromUser(friendship.from_user);
	const toProfile = profileFromUser(friendship.to_user);

	return {
		...friendship,
		from_profile_id: fromProfile?.id ?? friendship.from_user_id,
		to_profile_id: toProfile?.id ?? friendship.to_user_id,
		from_profile: fromProfile,
		to_profile: toProfile,
	};
};

const getUserById = async (userId: number) => {
	return client.user_app_user.findUnique({
		where: { id: userId },
		select: userSelect,
	});
};

const pairWhere = (fromUserId: number, toUserId: number) => ({
	OR: [
		{ from_user_id: fromUserId, to_user_id: toUserId },
		{ from_user_id: toUserId, to_user_id: fromUserId },
	],
});

const findExistingFriendship = (fromUserId: number, toUserId: number) => {
	return client.user_app_friendship.findFirst({
		where: {
			...pairWhere(fromUserId, toUserId),
			status: { equals: "accepted", mode: "insensitive" },
		},
		include: friendshipInclude,
	});
};

const findExistingRequest = (fromUserId: number, toUserId: number) => {
	return client.user_app_friendship.findFirst({
		where: pairWhere(fromUserId, toUserId),
		include: friendshipInclude,
	});
};

export const FriendshipRepository: RepositoryContract = {
	userFriendships: async (userId) => {
    const user = await getUserById(userId);
    if (!user) return "user not found";

    // Один запит — всі friendship де юзер є учасником
    const all = await client.user_app_friendship.findMany({
        where: {
            OR: [
                { from_user_id: userId },
                { to_user_id: userId },
            ],
        },
        include: friendshipInclude,
        orderBy: { created_at: "desc" },
    });

    const friends: typeof all = [];
    const incomingRequests: typeof all = [];
    const outgoingRequests: typeof all = [];
    const blacklistedRequests: typeof all = [];

    for (const f of all) {
        const status = (f.status ?? "").toLowerCase();
        if (status === "accepted") {
            friends.push(f);
        } else if (status === "blacklisted") {
            blacklistedRequests.push(f);
        } else if (status === "pending") {
			if (f.to_user_id === BigInt(userId)) incomingRequests.push(f);
            else outgoingRequests.push(f);
        }
    }

    return {
        friends: friends.map(serializeFriendship),
        incomingRequests: incomingRequests.map(serializeFriendship),
        outgoingRequests: outgoingRequests.map(serializeFriendship),
        blacklistedRequests: blacklistedRequests.map(serializeFriendship),
    } satisfies UserFriendships;
},

	changeStatus: async (id, status: FriendshipStatusAction) => {
		const request = await client.user_app_friendship.findUnique({
			where: { id },
			include: friendshipInclude,
		});

		if (!request) return "friend request not found";

		const normalizedStatus = String(status).toLowerCase();

		if (normalizedStatus === "rejected") {
			await client.user_app_friendship.delete({ where: { id } });
			return "friend request rejected";
		}

		const updatedRequest = await client.user_app_friendship.update({
			where: { id },
			data: { status: normalizedStatus },
			include: friendshipInclude,
		});

		return serializeFriendship(updatedRequest);
	},

	delete: async (id) => {
		try {
			await client.user_app_friendship.delete({ where: { id } });
			return "friendship deleted successfully";
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
				return "friendship not found";
			}
			throw error;
		}
	},

	create: async (senderId, receiverId, status = "pending") => {
		const normalizedStatus = String(status ?? "pending").toLowerCase();

		const [sender, receiver] = await Promise.all([
			getUserById(senderId),
			getUserById(receiverId),
		]);

		if (!sender || !receiver) return "user not found";

		const existingFriendship = await findExistingFriendship(senderId, receiverId);
		if (existingFriendship) return "users are already friends";

		const existingRequest = await findExistingRequest(senderId, receiverId);
if (existingRequest) {
    if (normalizedStatus === "blacklisted" && (existingRequest.status ?? "").toLowerCase() !== "blacklisted") {
        const updatedRequest = await client.user_app_friendship.update({
            where: { id: existingRequest.id },
            data: { status: "blacklisted" },
            include: friendshipInclude,
        });
        return serializeFriendship(updatedRequest);
    }

    // ← ДОДАТИ ЦЕ: якщо статус не pending і не blacklisted — перестворюємо
    const existingStatus = (existingRequest.status ?? "").toLowerCase();
    if (existingStatus !== "pending" && existingStatus !== "blacklisted") {
        await client.user_app_friendship.delete({ where: { id: existingRequest.id } });
        // падаємо вниз до create
    } else {
        return serializeFriendship(existingRequest);
    }
}

		const request = await client.user_app_friendship.create({
			data: {
				from_user_id: senderId,
				to_user_id: receiverId,
				status: normalizedStatus,
				created_at: new Date(),
			},
			include: friendshipInclude,
		});

		return serializeFriendship(request);
	},
};

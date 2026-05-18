import { Prisma } from "../generated/prisma";
import { client } from "../config/client";
import {
	profileInclude,
	type FriendRequestWithProfiles,
	type FriendshipStatusAction,
	type ProfileFriendWithProfiles,
	type RepositoryContract,
	type UserFriendships,
} from "./Friendship.types";

const friendshipInclude = {
	from_profile: { include: profileInclude },
	to_profile: { include: profileInclude },
};

const getProfileByUserId = async (userId: number) => {
	return client.profile.findUnique({
		where: { user_id: userId },
	});
};

const findExistingFriendship = (fromProfileId: number, toProfileId: number) => {
	return client.profileFriend.findFirst({
		where: {
			OR: [
				{ from_profile_id: fromProfileId, to_profile_id: toProfileId },
				{ from_profile_id: toProfileId, to_profile_id: fromProfileId },
			],
		},
		include: friendshipInclude,
	});
};

const findExistingRequest = (fromProfileId: number, toProfileId: number) => {
	return client.friendRequest.findFirst({
		where: {
			OR: [
				{ from_profile_id: fromProfileId, to_profile_id: toProfileId },
				{ from_profile_id: toProfileId, to_profile_id: fromProfileId },
			],
		},
		include: friendshipInclude,
	});
};

const createFriendshipFromRequest = async (
	request: FriendRequestWithProfiles,
): Promise<ProfileFriendWithProfiles | string> => {
	if (request.status === "BLACKLISTED") return "friend request is blacklisted";

	return client.$transaction(async (tx) => {
		const existingFriendship = await tx.profileFriend.findFirst({
			where: {
				OR: [
					{
						from_profile_id: request.from_profile_id,
						to_profile_id: request.to_profile_id,
					},
					{
						from_profile_id: request.to_profile_id,
						to_profile_id: request.from_profile_id,
					},
				],
			},
			include: friendshipInclude,
		});

		await tx.friendRequest.delete({
			where: { id: request.id },
		});

		if (existingFriendship) return existingFriendship;

		return tx.profileFriend.create({
			data: {
				from_profile_id: request.from_profile_id,
				to_profile_id: request.to_profile_id,
			},
			include: friendshipInclude,
		});
	});
};

export const FriendshipRepository: RepositoryContract = {
	userFriendships: async (userId) => {
		const profile = await getProfileByUserId(userId);
		if (!profile) return "profile not found";

		const [friends, incomingRequests, outgoingRequests, blacklistedRequests] =
			await Promise.all([
				client.profileFriend.findMany({
					where: {
						OR: [
							{ from_profile_id: profile.id },
							{ to_profile_id: profile.id },
						],
					},
					include: friendshipInclude,
				}),
				client.friendRequest.findMany({
					where: { to_profile_id: profile.id, status: "PENDING" },
					include: friendshipInclude,
					orderBy: { created_at: "desc" },
				}),
				client.friendRequest.findMany({
					where: { from_profile_id: profile.id, status: "PENDING" },
					include: friendshipInclude,
					orderBy: { created_at: "desc" },
				}),
				client.friendRequest.findMany({
					where: {
						status: "BLACKLISTED",
						OR: [
							{ from_profile_id: profile.id },
							{ to_profile_id: profile.id },
						],
					},
					include: friendshipInclude,
					orderBy: { created_at: "desc" },
				}),
			]);

		return {
			friends,
			incomingRequests,
			outgoingRequests,
			blacklistedRequests,
		} satisfies UserFriendships;
	},

	changeStatus: async (id, status: FriendshipStatusAction) => {
		const request = await client.friendRequest.findUnique({
			where: { id },
			include: friendshipInclude,
		});

		if (!request) return "friend request not found";

		if (status === "PENDING" || status === "BLACKLISTED") {
			return client.friendRequest.update({
				where: { id },
				data: { status },
				include: friendshipInclude,
			});
		}

		if (status === "REJECTED") {
			await client.friendRequest.delete({ where: { id } });
			return "friend request rejected";
		}

		return createFriendshipFromRequest(request);
	},

	delete: async (id) => {
		try {
			await client.profileFriend.delete({
				where: { id },
			});
			return "friendship deleted successfully";
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
				return "friendship not found";
			}
			throw error;
		}
	},

	create: async (senderId, receiverId, status = "PENDING") => {
		const [senderProfile, receiverProfile] = await Promise.all([
			getProfileByUserId(senderId),
			getProfileByUserId(receiverId),
		]);

		if (!senderProfile || !receiverProfile) return "profile not found";

		const existingFriendship = await findExistingFriendship(
			senderProfile.id,
			receiverProfile.id,
		);
		if (existingFriendship) return "users are already friends";

		const existingRequest = await findExistingRequest(
			senderProfile.id,
			receiverProfile.id,
		);
		if (existingRequest) {
			if (status === "BLACKLISTED" && existingRequest.status !== "BLACKLISTED") {
				return client.friendRequest.update({
					where: { id: existingRequest.id },
					data: { status: "BLACKLISTED" },
					include: friendshipInclude,
				});
			}

			return existingRequest;
		}

		return client.friendRequest.create({
			data: {
				from_profile_id: senderProfile.id,
				to_profile_id: receiverProfile.id,
				status,
			},
			include: friendshipInclude,
		});
	},
};

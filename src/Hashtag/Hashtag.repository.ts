import { client } from "../config/client";
import { Prisma } from "../generated/prisma";
import type { RepositoryContract } from "./Hashtag.types";

export const HashtagRepository: RepositoryContract = {
	create: async (hashtagData) => {
		try {
			const hashtag = await client.hashtag.create({
				data: hashtagData,
			});
			return hashtag;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2002") {
					return "hashtag already exists";
				}
				return "error creating hashtag";
			}
			throw error;
		}
	},
	getAll: async () => {
		try {
			const hashtags = await client.hashtag.findMany();
			return hashtags;
		} catch (error) {
			return "error fetching hashtags";
		}
	},
	getById: async (id) => {
		try {
			const hashtag = await client.hashtag.findUnique({
				where: { id },
				include: { posts: true },
			});
			return hashtag;
		} catch (error) {
			return "error fetching hashtag";
		}
	},
	update: async (id, hashtagData) => {
		try {
			const hashtag = await client.hashtag.update({
				where: { id },
				data: hashtagData,
			});
			if (!hashtag) {
				return "hashtag not found";
			}
			return hashtag;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2025") {
					return "hashtag not found";
				}
			}
			return "error updating hashtag";
		}
	},
	delete: async (id) => {
		try {
			await client.hashtag.delete({
				where: { id },
			});
			return "hashtag deleted successfully";
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2025") {
					return "hashtag not found";
				}
			}
			return "error deleting hashtag";
		}
	},
};

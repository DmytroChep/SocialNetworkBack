import { client } from "../config/client";
import { Prisma } from "../generated/prisma";
import type { RepositoryContract } from "./Hashtag.types";

const serializeHashtag = (tag: any) => ({
	...tag,
	title: tag.name,
	posts: Array.isArray(tag.posts)
		? tag.posts.map((postTag: any) => ({
				postId: postTag.post_id,
				hashtagId: postTag.tag_id,
				post: postTag.post,
			}))
		: tag.posts,
});

const serializeHashtagResult = (value: any) =>
	Array.isArray(value) ? value.map(serializeHashtag) : serializeHashtag(value);

export const HashtagRepository: RepositoryContract = {
	create: async (hashtagData) => {
		try {
			const hashtag = await client.tag.create({
				data: hashtagData,
			});
			return serializeHashtag(hashtag);
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
			const hashtags = await client.tag.findMany();
			return serializeHashtagResult(hashtags);
		} catch (error) {
			return "error fetching hashtags";
		}
	},
	getById: async (id) => {
		try {
			const hashtag = await client.tag.findUnique({
				where: { id },
				include: { posts: { include: { post: true } } },
			});
			return hashtag ? serializeHashtag(hashtag) : hashtag;
		} catch (error) {
			return "error fetching hashtag";
		}
	},
	update: async (id, hashtagData) => {
		try {
			const hashtag = await client.tag.update({
				where: { id },
				data: hashtagData,
			});
			if (!hashtag) {
				return "hashtag not found";
			}
			return serializeHashtag(hashtag);
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
			await client.tag.delete({
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
	getOrCreate: async (name: string) => {
		try {
			const trimmedName = name.trim().toLowerCase();
			if (!trimmedName) {
				return "hashtag name cannot be empty";
			}
			
			const existingHashtag = await client.tag.findUnique({
				where: { name: trimmedName },
			});
			
			if (existingHashtag) {
				return serializeHashtag(existingHashtag);
			}
			
			const newHashtag = await client.tag.create({
				data: { name: trimmedName },
			});
			
			return serializeHashtag(newHashtag);
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2002") {
					// Handle race condition - another process created it
					const existing = await client.tag.findUnique({
						where: { name: name.trim().toLowerCase() },
					});
					if (existing) {
						return serializeHashtag(existing);
					}
				}
				return "error creating or fetching hashtag";
			}
			throw error;
		}
	},
	getOrCreateMultiple: async (names: string[]) => {
		try {
			const results = [];
			for (const name of names) {
				const result = await HashtagRepository.getOrCreate(name);
				if (typeof result === "string") {
					return result;
				}
				results.push(result);
			}
			return results;
		} catch (error) {
			return "error creating or fetching hashtags";
		}
	},
};

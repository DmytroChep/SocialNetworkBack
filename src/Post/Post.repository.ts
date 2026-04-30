import { client } from "../config/client";
import { Prisma } from "../generated/prisma";
import type { RepositoryContract } from "./Post.types";

const postInclude = {
	images: true,
	hashtags: { include: { hashtag: true } },
	author: { select: { password: false, id: true, email: true, authorName: true, userName: true, status: true, birthDate: true, sign: true, currentAvatarId: true, currentAvatar: true } }
};

export const PostRepository: RepositoryContract = {
	create: async (postData) => {
		try {
			const post = await client.post.create({
				data: postData,
				include: postInclude,
			});
			return post;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				return "error creating post";
			}
			throw error;
		}
	},

	getById: async (id) => {
		try {
			const post = await client.post.findUnique({
				where: { id },
				include: postInclude,
			});
			return post;
		} catch (error) {
			return "error fetching post";
		}
	},

	getAll: async () => {
		try {
			const posts = await client.post.findMany({
				include: postInclude,
				orderBy: { id: "desc" },
			});
			return posts;
		} catch (error) {
			return "error fetching posts";
		}
	},

	getByAuthorId: async (authorId) => {
		try {
			const posts = await client.post.findMany({
				where: { authorId },
				include: postInclude,
				orderBy: { id: "desc" },
			});
			return posts;
		} catch (error) {
			return "error fetching posts by author";
		}
	},

	update: async (id, postData) => {
		try {
			const post = await client.post.update({
				where: { id },
				data: postData,
				include: postInclude,
			});
			return post;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2025") {
					return "post not found";
				}
			}
			return "error updating post";
		}
	},

	delete: async (id) => {
		try {
			await client.post.delete({
				where: { id },
			});
			return "post deleted successfully";
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2025") {
					return "post not found";
				}
			}
			return "error deleting post";
		}
	},

	addImages: async (postId, images) => {
		try {
			const post = await client.post.update({
				where: { id: postId },
				data: {
					images: {
						create: images
					}
				},
				include: postInclude
			});
			return post;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				return "error adding images to post";
			}
			throw error;
		}
	},

	deleteImage: async (imageId) => {
		try {
			await client.postImage.delete({
				where: { id: imageId }
			});
			return "image deleted successfully";
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2025") {
					return "image not found";
				}
			}
			return "error deleting image";
		}
	},

	replaceImages: async (postId, images) => {
		try {
			const post = await client.post.update({
				where: { id: postId },
				data: {
					images: {
						deleteMany: {},
						create: images
					}
				},
				include: postInclude
			});
			return post;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				return "error replacing images for post";
			}
			throw error;
		}
	},
};

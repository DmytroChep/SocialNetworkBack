import { client } from "../config/client";
import { Prisma } from "../generated/prisma";
import { deleteMediaFiles } from "../utils/media-files";
import type { RepositoryContract } from "./Post.types";

const postInclude = {
	images: true,
	links: true,
	tags: { include: { tag: true } },
	author: {
		select: {
			id: true,
			email: true,
			username: true,
			first_name: true,
			last_name: true,
			profile: true,
		},
	},
	likes: true,
	hearts: true,
	views: true,
};

type PostImagePath = {
	original_image?: string | null;
	compressed_image?: string | null;
};

const getPostImagePaths = (images: PostImagePath[] = []) =>
	images.flatMap((image) => [image.original_image, image.compressed_image]);

const getCreatedPostImagePaths = (postData: any) =>
	Array.isArray(postData?.images?.create)
		? getPostImagePaths(postData.images.create)
		: [];

const getRemovedPostImagePaths = (
	previousImages: PostImagePath[],
	nextImages: PostImagePath[],
) => {
	const nextPaths = new Set(getPostImagePaths(nextImages).filter(Boolean));
	return getPostImagePaths(previousImages).filter(
		(image) => image && !nextPaths.has(image),
	);
};

const serializeUser = (user: any) => {
	const avatar = user.profile?.avatar
		? {
				id: user.profile.id,
				image: user.profile.avatar,
				userId: user.id,
			}
		: null;

	return {
		...user,
		authorName: user.first_name || user.profile?.pseudonym || null,
		userName: user.username,
		status: user.profile?.pseudonym ?? null,
		birthDate: user.profile?.birth_date ?? null,
		sign: user.profile?.signature ?? null,
		currentAvatarId: avatar?.id ?? null,
		currentAvatar: avatar,
	};
};

const serializePost = (post: any) => ({
	...post,
	description: post.content ?? null,
	link: post.links?.[0]?.url ?? null,
	heartLike: Array.isArray(post.hearts) ? post.hearts.length : 0,
	thumbsUpLike: Array.isArray(post.likes) ? post.likes.length : 0,
	views: Array.isArray(post.views) ? post.views.length : 0,
	authorId: post.author_id,
	author: post.author ? serializeUser(post.author) : post.author,
	images: Array.isArray(post.images)
		? post.images.map((image: any) => ({
				...image,
				url: image.original_image,
				postId: image.post_id,
			}))
		: [],
	hashtags: Array.isArray(post.tags)
		? post.tags.map((tagLink: any) => ({
				postId: tagLink.post_id,
				hashtagId: tagLink.tag_id,
				hashtag: tagLink.tag
					? {
							...tagLink.tag,
							title: tagLink.tag.name,
						}
					: null,
			}))
		: [],
});

const serializePostResult = (value: any) =>
	Array.isArray(value) ? value.map(serializePost) : serializePost(value);

export const PostRepository: RepositoryContract = {
	create: async (postData) => {
		const createdImagePaths = getCreatedPostImagePaths(postData);

		try {
			const post = await client.post.create({
				data: postData,
				include: postInclude,
			});
			return serializePost(post);
		} catch (error) {
			deleteMediaFiles(createdImagePaths);
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
			return post ? serializePost(post) : post;
		} catch (error) {
			return "error fetching post";
		}
	},

	getAll: async ({ limit = 5, cursor } = {}) => {
		try {
			const safeLimit = Math.min(Math.max(limit, 1), 20);
			const posts = await client.post.findMany({
				take: safeLimit + 1,
				...(cursor
					? {
							cursor: { id: cursor },
							skip: 1,
						}
					: {}),
				include: postInclude,
				orderBy: { id: "desc" },
			});

			const hasMore = posts.length > safeLimit;
			const items = posts.slice(0, safeLimit);

			return {
				items: serializePostResult(items),
				nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
				hasMore,
			};
		} catch (error) {
			return "error fetching posts";
		}
	},

	getByAuthorId: async (author_id) => {
		try {
			const posts = await client.post.findMany({
				where: { author_id },
				include: postInclude,
				orderBy: { id: "desc" },
			});
			return serializePostResult(posts);
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
			return serializePost(post);
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
			const post = await client.post.findUnique({
				where: { id },
				include: { images: true },
			});

			if (!post) return "post not found";

			await client.$transaction(async (tx) => {
				await tx.post.update({
					where: { id },
					data: {
						tags: { deleteMany: {} },
						images: { deleteMany: {} },
						links: { deleteMany: {} },
						likes: { deleteMany: {} },
						hearts: { deleteMany: {} },
						views: { deleteMany: {} },
					},
				});
				await tx.post.delete({
					where: { id },
				});
			});
			deleteMediaFiles(getPostImagePaths(post.images));
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
		const createdImagePaths = getPostImagePaths(images);

		try {
			const post = await client.post.update({
				where: { id: postId },
				data: {
					images: {
						create: images,
					},
				},
				include: postInclude,
			});
			return serializePost(post);
		} catch (error) {
			deleteMediaFiles(createdImagePaths);
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				return "error adding images to post";
			}
			throw error;
		}
	},

	deleteImage: async (imageId) => {
		try {
			const image = await client.postImage.findUnique({
				where: { id: imageId },
			});

			if (!image) return "image not found";

			await client.postImage.delete({
				where: { id: imageId },
			});
			deleteMediaFiles(getPostImagePaths([image]));
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
		const createdImagePaths = getPostImagePaths(images);

		try {
			const existingImages = await client.postImage.findMany({
				where: { post_id: postId },
			});
			const post = await client.post.update({
				where: { id: postId },
				data: {
					images: {
						deleteMany: {},
						create: images,
					},
				},
				include: postInclude,
			});
			deleteMediaFiles(getRemovedPostImagePaths(existingImages, images));
			return serializePost(post);
		} catch (error) {
			deleteMediaFiles(createdImagePaths);
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				return "error replacing images for post";
			}
			throw error;
		}
	},
	heartIncrease: async (postId: number, userEmail: string) => {
		try {
			const user = await client.user.findUnique({
				where: { email: userEmail },
			});

			if (!user) return "user not found";

			const existing = await client.postHeart.findFirst({
				where: {
					user_id: user.id,
					post_id: postId,
				},
			});

			if (existing) {
				await client.postHeart.delete({
					where: {
						id: existing.id,
					},
				});

				return "unliked";
			} else {
				await client.postHeart.create({
					data: {
						user_id: user.id,
						post_id: postId,
					},
				});

				return "liked";
			}
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				return "error heart toggle";
			}
			throw error;
		}
	},
	thumbUpIncrease: async (postId: number, userEmail: string) => {
		try {
			const user = await client.user.findUnique({
				where: { email: userEmail },
			});

			if (!user) return "user not found";

			const existing = await client.postLike.findFirst({
				where: {
					user_id: user.id,
					post_id: postId,
				},
			});

			if (existing) {
				await client.postLike.delete({
					where: {
						id: existing.id,
					},
				});

				return "unliked";
			} else {
				await client.postLike.create({
					data: {
						user_id: user.id,
						post_id: postId,
					},
				});

				return "liked";
			}
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				return "error thumbsUp toggle";
			}
			throw error;
		}
	},

	viewsIncrease: async (postId, userEmail) => {
		try {
			const user = await client.user.findUnique({
				where: { email: userEmail },
			});

			if (!user) {
				return "user is not found";
			}
			await client.postView.create({
				data: {
					post_id: postId,
					user_id: user.id,
				},
			});

			return "success";
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				return "error increasing views";
			}
			throw error;
		}
	},
};

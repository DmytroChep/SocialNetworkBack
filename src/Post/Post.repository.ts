import { client } from "../config/client";
import { Prisma } from "@prisma/client";
import { DEFAULT_AVATAR_PATH, deleteMediaFiles, getMediaUrl, getSignatureFileName } from "../utils/media-files";
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
    const profile = user.profile ?? null;
    const avatarPathRaw = profile?.avatar || DEFAULT_AVATAR_PATH;
    const avatarPath = (() => {
        if (!avatarPathRaw) return avatarPathRaw;
        if (avatarPathRaw.startsWith("http")) return avatarPathRaw;
        if (avatarPathRaw.includes("/")) return avatarPathRaw;
        const base = avatarPathRaw.replace(/\.[^/.]+$/, "");
        return `profile_app/avatars/${base}`;
    })();

    const signatureRaw = profile?.signature ?? null;
    const signatureFileName = getSignatureFileName(signatureRaw);
    const signatureCandidate = signatureFileName ?? (signatureRaw?.startsWith("data:") ? null : signatureRaw ?? null);
    const signature = (() => {
        if (!signatureCandidate) return signatureCandidate;
        if (signatureCandidate.startsWith("http")) return signatureCandidate;
        if (signatureCandidate.includes("/")) return signatureCandidate;
        const base = signatureCandidate.replace(/\.[^/.]+$/, "");
        return `profile_app/signatures/${base}`;
    })();

    const avatar = {
        id: profile?.id ?? user.id,
        image: getMediaUrl(avatarPath) ?? avatarPath,
        userId: user.id,
    };

    return {
        ...user,
        profile: profile ? { 
            ...profile, 
            avatar: getMediaUrl(avatarPath) ?? avatarPath, 
            signature: getMediaUrl(signature) ?? signature 
        } : profile,
        authorName: user.first_name || profile?.pseudonym || null,
        userName: user.username,
        status: profile?.pseudonym ?? null,
        birthDate: profile?.birth_date ?? null,
        sign: getMediaUrl(signature) ?? signature,
        signatureImage: getMediaUrl(signature) ?? signature,
        currentAvatarId: avatar.id,
        currentAvatar: avatar,
        avatars: [avatar],
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
				original_image: getMediaUrl(image.original_image) ?? image.original_image,
				compressed_image: getMediaUrl(image.compressed_image) ?? image.compressed_image,
				url: getMediaUrl(image.original_image) ?? image.original_image,
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
			const payload = {
				...postData,
				created_at: postData?.created_at ?? new Date(),
			};

			const post = await client.post_app_post.create({
				data: payload,
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
			const post = await client.post_app_post.findUnique({
				where: { id },
				include: postInclude,
			});
			return post ? serializePost(post) : post;
		} catch (error) {
			return "error fetching post";
		}
	},

	getAll: async ({ limit = 3, cursor } = {}) => {
		try {
			const safeLimit = Math.min(Math.max(limit, 1), 20);
			const posts = await client.post_app_post.findMany({
				take: safeLimit + 1,
				...(cursor
					? {
							cursor: { id: Number(cursor) as number },
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
			const posts = await client.post_app_post.findMany({
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
			const post = await client.post_app_post.update({
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
			const post = await client.post_app_post.findUnique({
				where: { id },
				include: { images: true },
			});

			if (!post) return "post not found";

			await client.$transaction(async (tx) => {
				await tx.post_app_post.update({
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
				await tx.post_app_post.delete({
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
			const post = await client.post_app_post.update({
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
			const image = await client.post_app_postimage.findUnique({
				where: { id: imageId },
			});

			if (!image) return "image not found";

			await client.post_app_postimage.delete({
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
			const existingImages = await client.post_app_postimage.findMany({
				where: { post_id: postId },
			});
			const post = await client.post_app_post.update({
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
			const user = await client.user_app_user.findUnique({
				where: { email: userEmail },
			});

			if (!user) return "user not found";

			const existing = await client.post_app_postheart.findFirst({
				where: {
					user_id: user.id,
					post_id: postId,
				},
			});

			if (existing) {
				await client.post_app_postheart.delete({
					where: {
						id: existing.id,
					},
				});

				return "unliked";
			} else {
				await client.post_app_postheart.create({
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
			const user = await client.user_app_user.findUnique({
				where: { email: userEmail },
			});

			if (!user) return "user not found";

			const existing = await client.post_app_postlike.findFirst({
				where: {
					user_id: user.id,
					post_id: postId,
				},
			});

			if (existing) {
				await client.post_app_postlike.delete({
					where: {
						id: existing.id,
					},
				});

				return "unliked";
			} else {
				await client.post_app_postlike.create({
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
			const user = await client.user_app_user.findUnique({
				where: { email: userEmail },
			});

			if (!user) {
				return "user is not found";
			}
			await client.$executeRaw`
				INSERT INTO post_app_postview (post_id, user_id)
				VALUES (${postId}, ${user.id})
				ON CONFLICT (user_id, post_id) DO NOTHING
			`;

			return "success";
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				return "error increasing views";
			}
			throw error;
		}
	},
};

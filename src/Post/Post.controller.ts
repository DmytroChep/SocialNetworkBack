import { ENV } from "../config";
import { PostService } from "./Post.service";
import { HashtagService } from "../Hashtag/Hashtag.service";
import type { ControllerContract } from "./Post.types";
import jwt from "jsonwebtoken";
import { saveDataUriImage } from "../utils/media-files";

const parseId = (value: unknown): number | null => {
	const id = Number(value);
	return Number.isInteger(id) && id > 0 ? id : null;
};

const parsePositiveInt = (value: unknown): number | undefined => {
	if (value === undefined) return undefined;
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const decodeToken = (token?: string): { email: string } | null => {
	if (!token) return null;
	try {
		return jwt.verify(token, ENV.SECRET_KEY) as { email: string };
	} catch {
		return null;
	}
};

const isStringArray = (v: unknown): v is string[] =>
	Array.isArray(v) && v.every(i => typeof i === "string");

const isNumberArray = (v: unknown): v is number[] =>
	Array.isArray(v) && v.every(i => typeof i === "number");

const isImageArray = (
	v: unknown
): v is Array<{ original_image?: string; compressed_image?: string | null; url?: string; image?: string }> =>
	Array.isArray(v) &&
	v.every(
		i =>
			typeof i === "object" &&
			i !== null &&
			(typeof (i as any).original_image === "string" ||
				typeof (i as any).url === "string" ||
				typeof (i as any).image === "string")
	);

const normalizeImages = (
	images: Array<{ original_image?: string; compressed_image?: string | null; url?: string; image?: string }>,
	filePrefix: string,
) =>
	images.map((image, index) => {
		const originalImage = image.original_image ?? image.url ?? image.image ?? "";
		const compressedImage = image.compressed_image ?? null;

		const originalSaved = saveDataUriImage(originalImage, "posts", filePrefix, index);
		const compressedSaved = compressedImage
			? saveDataUriImage(compressedImage, "posts", `${filePrefix}_compressed`, index)
			: originalSaved;

		return {
			original_image: originalSaved,
			compressed_image: compressedSaved,
		};
	});

const bad = (res: any, msg: string) => res.status(400).json(msg);
const unauthorized = (res: any) => res.status(401).json("invalid token");

export const PostController: ControllerContract = {
	create: async (req, res) => {
		const body = req.body.post ?? req.body;
		const {
			title,
			content,
			description,
			topic,
			author_id,
			authorId,
			tag_ids,
			hashtagIds,
			hashtags,
			links,
			link,
			images,
		} = body;

		if (!title?.trim()) return bad(res, "title is required");

		const postContent = typeof content === "string" ? content : description;

		const parsedAuthorId = parseId(author_id ?? authorId);
		if (!parsedAuthorId) return bad(res, "invalid authorId");

		const data: any = {
			title: title.trim(),
			content: typeof postContent === "string" ? postContent.trim() : "",
			topic: typeof topic === "string" ? topic : undefined,
			author: { connect: { id: parsedAuthorId } },
		};

		// Handle hashtag IDs
		const tagIds = isNumberArray(tag_ids)
			? tag_ids
			: isNumberArray(hashtagIds)
				? hashtagIds
				: undefined;

		// Handle hashtag names
		const hashtagNames = isStringArray(hashtags) ? hashtags : undefined;

		// Process hashtags: combine IDs and names
		try {
			const allTags: { tag_id: number | bigint }[] = [];

			// Add existing hashtags by ID
			if (tagIds) {
				allTags.push(...tagIds.map(id => ({ tag_id: typeof id === 'bigint' ? id : BigInt(id) })));
			}

			// Create new hashtags from names
			if (hashtagNames) {
				const createdHashtags = await HashtagService.getOrCreateMultiple(hashtagNames);
				if (typeof createdHashtags === "string") {
					return bad(res, createdHashtags);
				}
				allTags.push(...createdHashtags.map((tag: any) => ({ tag_id: typeof tag.id === 'bigint' ? tag.id : BigInt(tag.id) })));
			}

			if (allTags.length > 0) {
				data.tags = { create: allTags };
			}
		} catch (error) {
			return bad(res, "error processing hashtags");
		}

		const postLinks = isStringArray(links)
			? links
			: typeof link === "string" && link.trim() !== ""
				? [link]
				: undefined;

		if (postLinks)
			data.links = { create: postLinks.map(url => ({ url })) };

		if (isImageArray(images))
			data.images = { create: normalizeImages(images, `post_${parsedAuthorId}`) };

		const result = await PostService.create(data);
		if (typeof result === "string") return bad(res, result);

		res.status(201).json(result);
	},

	getById: async (req, res) => {
		const id = parseId(req.params.id);
		if (!id) return bad(res, "invalid post id");

		const post = await PostService.getById(id);
		if (typeof post === "string") return bad(res, post);
		if (!post) return res.status(404).json("post not found");

		res.json(post);
	},

	getAll: async (req, res) => {
		const cursor = parsePositiveInt(req.query.cursor);
		const result = await PostService.getAll({
			limit: parsePositiveInt(req.query.limit) ?? 5,
			...(cursor ? { cursor } : {}),
		});
		if (typeof result === "string") return bad(res, result);
		res.json(result);
	},

	getByAuthorId: async (req, res) => {
		const authorId = parseId(req.params.authorId);
		if (!authorId) return bad(res, "invalid author id");

		const result = await PostService.getByAuthorId(authorId);
		if (typeof result === "string") return bad(res, result);

		res.json(result);
	},

	update: async (req, res) => {
		const id = parseId(req.params.id);
		if (!id) return bad(res, "invalid post id");

		const { title, content, description, topic, tag_ids, hashtagIds, hashtags, links, link } = req.body;
		const data: any = {};

		if (title !== undefined) {
			if (!title.trim()) return bad(res, "invalid title");
			data.title = title.trim();
		}

		const postContent = content !== undefined ? content : description;

		if (postContent !== undefined) {
			if (postContent === null) {
				data.content = "";
			} else if (typeof postContent !== "string") {
				return bad(res, "invalid description");
			} else {
				data.content = postContent.trim();
			}
		}

		if (topic !== undefined) data.topic = topic;

		// Handle hashtag IDs and names
		const tagIds = isNumberArray(tag_ids)
			? tag_ids
			: isNumberArray(hashtagIds)
				? hashtagIds
				: undefined;

		const hashtagNames = isStringArray(hashtags) ? hashtags : undefined;

		// Process hashtags: combine IDs and names
		if (tagIds !== undefined || hashtagNames !== undefined) {
			try {
				const allTags: { tag_id: number }[] = [];

				// Add existing hashtags by ID
				if (tagIds) {
					allTags.push(...tagIds.map(id => ({ tag_id: id })));
				}

				// Create new hashtags from names
				if (hashtagNames) {
					const createdHashtags = await HashtagService.getOrCreateMultiple(hashtagNames);
					if (typeof createdHashtags === "string") {
						return bad(res, createdHashtags);
					}
					allTags.push(...createdHashtags.map((tag: any) => ({ tag_id: tag.id })));
				}

				data.tags = {
					deleteMany: {},
					create: allTags,
				};
			} catch (error) {
				return bad(res, "error processing hashtags");
			}
		}

		const postLinks = isStringArray(links)
			? links
			: typeof link === "string"
				? [link]
				: link === null
					? []
				: undefined;

		if (postLinks)
			data.links = {
				deleteMany: {},
				create: postLinks.filter(Boolean).map(url => ({ url })),
			};

		const result = await PostService.update(id, data);
		if (typeof result === "string") return bad(res, result);

		res.json(result);
	},

	delete: async (req, res) => {
		const id = parseId(req.params.id);
		if (!id) return bad(res, "invalid post id");

		const result = await PostService.delete(id);
		if (typeof result === "string") return bad(res, result);

		res.json(result);
	},

	addImages: async (req, res) => {
		const id = parseId(req.params.id);
		if (!id) return bad(res, "invalid post id");
		if (!isImageArray(req.body.images)) return bad(res, "invalid images");

		const result = await PostService.addImages(id, normalizeImages(req.body.images, `post_${id}`));
		if (typeof result === "string") return bad(res, result);

		res.json(result);
	},

	replaceImages: async (req, res) => {
		const id = parseId(req.params.id);
		if (!id) return bad(res, "invalid post id");
		if (!isImageArray(req.body.images)) return bad(res, "invalid images");

		const result = await PostService.replaceImages(id, normalizeImages(req.body.images, `post_${id}`));
		if (typeof result === "string") return bad(res, result);

		res.json(result);
	},

	deleteImage: async (req, res) => {
		const id = parseId(req.params.imageId);
		if (!id) return bad(res, "invalid image id");

		const result = await PostService.deleteImage(id);
		if (typeof result === "string") return bad(res, result);

		res.json(result);
	},

	thumbUpIncrease: async (req, res) => {
		const id = parseId(req.params.id);
		if (!id) return bad(res, "invalid post id");

		const decoded = decodeToken(res.locals.token);
		if (!decoded) return unauthorized(res);

		const status = await PostService.thumbUpIncrease(id, decoded.email);
		res.json({ status });
	},

	heartIncrease: async (req, res) => {
		const id = parseId(req.params.id);
		if (!id) return bad(res, "invalid post id");

		const decoded = decodeToken(res.locals.token);
		if (!decoded) return unauthorized(res);

		const status = await PostService.heartIncrease(id, decoded.email);
		res.json({ status });
	},

	viewsIncrease: async (req, res) => {
		const id = parseId(req.params.id);
		if (!id) return bad(res, "invalid post id");

		const decoded = decodeToken(res.locals.token);
		if (!decoded) return unauthorized(res);

		const status = await PostService.viewsIncrease(id, decoded.email);
		res.json({ status });
	},
};

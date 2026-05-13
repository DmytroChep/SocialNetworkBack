import { PostService } from "./Post.service";
import type { ControllerContract } from "./Post.types";

type CreatePostBody = {
	title: string;
	authorId: number;
	description?: string | null;
	topic?: string | null;
	link?: string | null;
	hashtagIds?: number[];
	images?: Array<{ url: string }>;
};

type UpdatePostBody = {
	title?: string;
	description?: string | null;
	topic?: string | null;
	link?: string | null;
	hashtagIds?: number[];
};

export const PostController: ControllerContract = {
	create: async (req, res) => {
		const { title, authorId, description, topic, link, hashtagIds, images } = req.body as CreatePostBody;

		if (!title || !authorId) {
			res.status(400).json("title and authorId are required");
			return;
		}

		const hashtagsInput = hashtagIds && Array.isArray(hashtagIds) && hashtagIds.length > 0
			? { create: hashtagIds.map((id: number) => ({ hashtagId: id })) }
			: undefined;

		const imagesInput = images && Array.isArray(images) && images.length > 0
			? { create: images }
			: undefined;

		const postData = {
			title,
			authorId,
			...(description && { description }),
			...(topic && { topic }),
			...(link && { link }),
			...(hashtagsInput && { hashtags: hashtagsInput }),
			...(imagesInput && { images: imagesInput }),
		};

		const response = await PostService.create(postData);

		if (typeof response === "string") {
			res.status(400).json(response);
			return;
		}

		res.status(201).json(response);
	},

	getById: async (req, res) => {
		const id = Number((req.params as Record<string, string>).id);

		if (!id || isNaN(id)) {
			res.status(400).json("invalid post id");
			return;
		}

		const response = await PostService.getById(id);

		if (typeof response === "string") {
			res.status(400).json(response);
			return;
		}

		if (!response) {
			res.status(404).json("post not found");
			return;
		}

		res.status(200).json(response);
	},

	getAll: async (req, res) => {
		const response = await PostService.getAll();

		if (typeof response === "string") {
			res.status(400).json(response);
			return;
		}

		res.status(200).json(response);
	},

	getByAuthorId: async (req, res) => {
		const authorId = Number((req.params as Record<string, string>).authorId);

		if (!authorId || isNaN(authorId)) {
			res.status(400).json("invalid author id");
			return;
		}

		const response = await PostService.getByAuthorId(authorId);

		if (typeof response === "string") {
			res.status(400).json(response);
			return;
		}

		res.status(200).json(response);
	},

	update: async (req, res) => {
		const id = Number((req.params as Record<string, string>).id);

		if (!id || isNaN(id)) {
			res.status(400).json("invalid post id");
			return;
		}

		const { title, description, topic, link, hashtagIds } = req.body as UpdatePostBody;

		const hashtagsUpdate = hashtagIds && Array.isArray(hashtagIds) && hashtagIds.length > 0
			? { deleteMany: {}, create: hashtagIds.map((id: number) => ({ hashtagId: id })) }
			: undefined;

		const postData = {
			...(title && { title }),
			...(description !== undefined && { description }),
			...(topic !== undefined && { topic }),
			...(link !== undefined && { link }),
			...(hashtagsUpdate && { hashtags: hashtagsUpdate }),
		};

		const response = await PostService.update(id, postData);

		if (typeof response === "string") {
			res.status(400).json(response);
			return;
		}

		res.status(200).json(response);
	},

	delete: async (req, res) => {
		const id = Number((req.params as Record<string, string>).id);

		if (!id || isNaN(id)) {
			res.status(400).json("invalid post id");
			return;
		}

		const response = await PostService.delete(id);
		res.status(200).json(response);
	},

	addImages: async (req, res) => {
		const postId = Number((req.params as Record<string, string>).id);
		const { images } = req.body;

		if (!postId || isNaN(postId)) {
			res.status(400).json("invalid post id");
			return;
		}

		if (!images || !Array.isArray(images)) {
			res.status(400).json("images must be an array");
			return;
		}

		const response = await PostService.addImages(postId, images);

		if (typeof response === "string") {
			res.status(400).json(response);
			return;
		}

		res.status(200).json(response);
	},

	deleteImage: async (req, res) => {
		const imageId = Number((req.params as Record<string, string>).imageId);

		if (!imageId || isNaN(imageId)) {
			res.status(400).json("invalid image id");
			return;
		}

		const response = await PostService.deleteImage(imageId);
		res.status(200).json(response);
	},

	replaceImages: async (req, res) => {
		const postId = Number((req.params as Record<string, string>).id);
		const { images } = req.body;

		if (!postId || isNaN(postId)) {
			res.status(400).json("invalid post id");
			return;
		}

		if (!images || !Array.isArray(images)) {
			res.status(400).json("images must be an array");
			return;
		}

		const response = await PostService.replaceImages(postId, images);

		if (typeof response === "string") {
			res.status(400).json(response);
			return;
		}

		res.status(200).json(response);
	},
};

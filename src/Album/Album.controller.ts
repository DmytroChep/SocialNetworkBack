import { AlbumService } from "./Album.service";
import type { ControllerContract } from "./Album.types";

export const AlbumController: ControllerContract = {
	create: async (req, res) => {
		const { name, topic, year, userId, images } = req.body;

		if (!name || !userId) {
			res.status(400).json("name and userId are required");
			return;
		}

		const albumData = {
			name,
			topic: topic || null,
			year: year || null,
			userId,
			images: images ? {
				create: images
			} : undefined
		};

		const response = await AlbumService.create(albumData as any);

		if (typeof response === "string") {
			res.status(400).json(response);
			return;
		}

		res.status(201).json(response);
	},
	getById: async (req, res) => {
		const id = Number(req.params.id);

		if (!id) {
			res.status(400).json("invalid album id");
			return;
		}

		const response = await AlbumService.getById(id);

		if (typeof response === "string") {
			res.status(400).json(response);
			return;
		}

		if (!response) {
			res.status(404).json("album not found");
			return;
		}

		res.status(200).json(response);
	},
	getByUserId: async (req, res) => {
		const userId = Number(req.params.userId);

		if (!userId) {
			res.status(400).json("invalid user id");
			return;
		}

		const response = await AlbumService.getByUserId(userId);

		if (typeof response === "string") {
			res.status(400).json(response);
			return;
		}

		res.status(200).json(response);
	},
	update: async (req, res) => {
		const id = Number(req.params.id);
		const albumData = req.body;

		if (!id) {
			res.status(400).json("invalid album id");
			return;
		}

		const response = await AlbumService.update(id, albumData);

		if (typeof response === "string") {
			res.status(400).json(response);
			return;
		}

		res.status(200).json(response);
	},
	delete: async (req, res) => {
		const id = Number(req.params.id);

		if (!id) {
			res.status(400).json("invalid album id");
			return;
		}

		const response = await AlbumService.delete(id);
		res.status(200).json(response);
	},
	addImages: async (req, res) => {
		const albumId = Number(req.params.id);
		const { images } = req.body;

		if (!albumId) {
			res.status(400).json("invalid album id");
			return;
		}

		if (!images || !Array.isArray(images)) {
			res.status(400).json("images must be an array");
			return;
		}

		const response = await AlbumService.addImages(albumId, images);

		if (typeof response === "string") {
			res.status(400).json(response);
			return;
		}

		res.status(200).json(response);
	},
	deleteImage: async (req, res) => {
		const imageId = Number(req.params.imageId);

		if (!imageId) {
			res.status(400).json("invalid image id");
			return;
		}

		const response = await AlbumService.deleteImage(imageId);
		res.status(200).json(response);
	},
	replaceImages: async (req, res) => {
		const albumId = Number(req.params.id);
		const { images } = req.body;

		if (!albumId) {
			res.status(400).json("invalid album id");
			return;
		}

		if (!images || !Array.isArray(images)) {
			res.status(400).json("images must be an array");
			return;
		}

		const response = await AlbumService.replaceImages(albumId, images);

		if (typeof response === "string") {
			res.status(400).json(response);
			return;
		}

		res.status(200).json(response);
	},
};

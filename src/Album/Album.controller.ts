import type { Prisma } from "../generated/prisma";
import { AlbumService } from "./Album.service";
import type { ControllerContract } from "./Album.types";

const parseId = (
	id: string | string[] | undefined,
): number | null => {
	if (typeof id !== "string") {
		return null;
	}

	const parsed = Number(id);

	return !isNaN(parsed) && parsed > 0
		? parsed
		: null;
};
type ImageInput = {
	image: string;
	is_shown?: boolean;
};

const isImageArray = (value: unknown): value is ImageInput[] =>
	Array.isArray(value) &&
	value.every(
		(item) =>
			typeof item === "object" &&
			item !== null &&
			typeof item.image === "string",
	);

export const AlbumController: ControllerContract = {
	create: async (req, res) => {
		try {
			const {
				name,
				theme,
				topic,
				year,
				profile_id,
				profileId,
				userId,
				images,
			}: {
				name?: unknown;
				theme?: unknown;
				topic?: unknown;
				year?: unknown;
				profile_id?: unknown;
				profileId?: unknown;
				userId?: unknown;
				images?: unknown;
			} = req.body;

			if (typeof name !== "string" || name.trim() === "") {
				res.status(400).json("name is required and must be a non-empty string");
				return;
			}

			const profileIdValue =
				typeof profile_id === "number"
					? profile_id
					: typeof profileId === "number"
						? profileId
						: null;
			const userIdValue = typeof userId === "number" ? userId : null;

			if (!profileIdValue && !userIdValue) {
				res.status(400).json("userId is required");
				return;
			}

			const parsedYear =
				typeof year === "number"
					? year
					: typeof year === "string" && year.trim() !== ""
						? Number(year)
						: null;

			if (
				parsedYear !== null &&
				(!Number.isInteger(parsedYear) || parsedYear <= 0)
			) {
				res.status(400).json("year must be a positive number");
				return;
			}

			const albumData: Prisma.AlbumCreateInput = {
				name: name.trim(),

				theme:
					typeof theme === "string"
						? theme.trim()
						: typeof topic === "string"
							? topic.trim()
							: null,

				year: parsedYear,

				profile: {
					connect: profileIdValue
						? { id: profileIdValue }
						: { user_id: userIdValue as number },
				},
			};

			if (isImageArray(images) && images.length > 0) {
				albumData.images = {
					create: images.map((img) => ({
						image: img.image,
						is_shown: img.is_shown ?? true,
					})),
				};
			}

			const response = await AlbumService.create(albumData);

			if (typeof response === "string") {
				res.status(400).json(response);
				return;
			}

			res.status(201).json(response);
		} catch (error) {
			res.status(500).json(error);
		}
	},

	getById: async (req, res) => {
		const id = parseId(req.params.id);

		if (!id) {
			res.status(400).json("invalid album id");
			return;
		}

		const response = await AlbumService.getById(id);

		if (!response) {
			res.status(404).json("album not found");
			return;
		}

		res.status(200).json(response);
	},

	getByProfileId: async (req, res) => {
		const profileId = parseId(req.params.profileId);

		if (!profileId) {
			res.status(400).json("invalid profile id");
			return;
		}

		const response = await AlbumService.getByProfileId(profileId);

		res.status(200).json(response);
	},

	getByUserId: async (req, res) => {
		const userId = parseId(req.params.userId);

		if (!userId) {
			res.status(400).json("invalid user id");
			return;
		}

		const response = await AlbumService.getByUserId(userId);

		res.status(200).json(response);
	},

	update: async (req, res) => {
		try {
			const id = parseId(req.params.id);

			if (!id) {
				res.status(400).json("invalid album id");
				return;
			}

			const { name, theme, topic, year } = req.body;

			if (
				name !== undefined &&
				(typeof name !== "string" || name.trim() === "")
			) {
				res.status(400).json("name must be a non-empty string");
				return;
			}

			const parsedYear =
				typeof year === "number"
					? year
					: typeof year === "string" && year.trim() !== ""
						? Number(year)
						: year;

			if (
				parsedYear !== undefined &&
				parsedYear !== null &&
				(typeof parsedYear !== "number" || parsedYear <= 0)
			) {
				res.status(400).json("year must be a positive number");
				return;
			}

			const updateData: Prisma.AlbumUpdateInput = {};

			if (typeof name === "string") {
				updateData.name = {
					set: name.trim(),
				};
			}

			if (theme === null) {
				updateData.theme = {
					set: null,
				};
			}

			if (typeof theme === "string") {
				updateData.theme = {
					set: theme.trim(),
				};
			}

			if (typeof topic === "string") {
				updateData.theme = {
					set: topic.trim(),
				};
			}

			if (parsedYear === null) {
				updateData.year = {
					set: null,
				};
			}

			if (typeof parsedYear === "number") {
				updateData.year = {
					set: parsedYear,
				};
			}

			const response = await AlbumService.update(id, updateData);

			if (typeof response === "string") {
				res.status(400).json(response);
				return;
			}

			res.status(200).json(response);
		} catch (error) {
			res.status(500).json(error);
		}
	},

	delete: async (req, res) => {
		const id = parseId(req.params.id);

		if (!id) {
			res.status(400).json("invalid album id");
			return;
		}

		const response = await AlbumService.delete(id);

		if (typeof response === "string") {
			res.status(400).json(response);
			return;
		}

		res.status(200).json(response);
	},

	addImages: async (req, res) => {
		const albumId = parseId(req.params.id);
		const images = req.body.images as unknown;

		if (!albumId) {
			res.status(400).json("invalid album id");
			return;
		}

		if (!isImageArray(images) || images.length === 0) {
			res.status(400).json("images must be a non-empty array");
			return;
		}

		const response = await AlbumService.addImages(
			albumId,
			images.map((img) => ({
				image: img.image,
				is_shown: img.is_shown ?? true,
			})),
		);

		res.status(200).json(response);
	},

	deleteImage: async (req, res) => {
		const imageId = parseId(req.params.imageId);

		if (!imageId) {
			res.status(400).json("invalid image id");
			return;
		}

		const response = await AlbumService.deleteImage(imageId);

		res.status(200).json(response);
	},

	replaceImages: async (req, res) => {
		const albumId = parseId(req.params.id);
		const images = req.body.images as unknown;

		if (!albumId) {
			res.status(400).json("invalid album id");
			return;
		}

		if (!isImageArray(images) || images.length === 0) {
			res.status(400).json("images must be a non-empty array");
			return;
		}

		const response = await AlbumService.replaceImages(
			albumId,
			images.map((img) => ({
				image: img.image,
				is_shown: img.is_shown ?? true,
			})),
		);

		res.status(200).json(response);
	}
};

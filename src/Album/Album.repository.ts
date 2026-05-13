import { client } from "../config/client";
import { Prisma } from "../generated/prisma";
import type { RepositoryContract } from "./Album.types";

const albumInclude = { images: true, profile: true };

const serializeAlbum = (album: any) => ({
	...album,
	topic: album.theme ?? null,
	year: album.year === null || album.year === undefined ? null : String(album.year),
	userId: album.profile?.user_id ?? album.profile_id,
	images: Array.isArray(album.images)
		? album.images.map((image: any) => ({
				...image,
				albumId: image.album_id,
			}))
		: [],
});

const serializeAlbumResult = (value: any) =>
	Array.isArray(value) ? value.map(serializeAlbum) : serializeAlbum(value);

export const AlbumRepository: RepositoryContract = {
	create: async (albumData) => {
		try {
			const album = await client.album.create({
				data: albumData,
				include: albumInclude,
			});
			return serializeAlbum(album);
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				return "error creating album";
			}
			throw error;
		}
	},

	getById: async (id) => {
		try {
			const album = await client.album.findUnique({
				where: { id },
				include: albumInclude,
			});
			return album ? serializeAlbum(album) : album;
		} catch {
			return "error fetching album";
		}
	},

	getByProfileId: async (profileId) => {
		try {
			const albums = await client.album.findMany({
				where: { profile_id: profileId },
				include: albumInclude,
			});
			return serializeAlbumResult(albums);
		} catch {
			return "error fetching albums";
		}
	},

	getByUserId: async (userId) => {
		try {
			const albums = await client.album.findMany({
				where: {
					profile: {
						user: { id: userId },
					},
				},
				include: albumInclude,
			});
			return serializeAlbumResult(albums);
		} catch {
			return "error fetching albums";
		}
	},

	update: async (id, albumData) => {
		try {
			const album = await client.album.update({
				where: { id },
				data: albumData,
				include: albumInclude,
			});
			return serializeAlbum(album);
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
				return "album not found";
			}
			return "error updating album";
		}
	},

	delete: async (id) => {
		try {
			await client.albumImage.deleteMany({ where: { album_id: id } });
			await client.album.delete({ where: { id } });
			return "album deleted successfully";
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
				return "album not found";
			}
			return "error deleting album";
		}
	},

	addImages: async (albumId, images) => {
		try {
			const album = await client.album.update({
				where: { id: albumId },
				data: { images: { create: images } },
				include: albumInclude,
			});
			return serializeAlbum(album);
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
				return "album not found";
			}
			return "error adding images to album";
		}
	},

	deleteImage: async (imageId) => {
		try {
			await client.albumImage.delete({ where: { id: imageId } });
			return "image deleted successfully";
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
				return "image not found";
			}
			return "error deleting image";
		}
	},

	replaceImages: async (albumId, images) => {
		try {
			await client.albumImage.deleteMany({ where: { album_id: albumId } });
			const album = await client.album.update({
				where: { id: albumId },
				data: { images: { create: images } },
				include: albumInclude,
			});
			return serializeAlbum(album);
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
				return "album not found";
			}
			return "error replacing images";
		}
	},
};

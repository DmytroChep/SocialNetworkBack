import { client } from "../config/client";
import { Prisma } from "../generated/prisma";
import type { RepositoryContract } from "./Album.types";

export const AlbumRepository: RepositoryContract = {
	create: async (albumData) => {
		try {
			const album = await client.album.create({
				data: albumData,
				include: { images: true }
			});
			return album;
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
				include: { images: true },
			});
			return album;
		} catch (error) {
			return "error fetching album";
		}
	},
	getByUserId: async (userId) => {
		try {
			const albums = await client.album.findMany({
				where: { userId },
				include: { images: true },	
			});
			console.log(albums)
			return albums;
		} catch (error) {
			return "error fetching albums";
		}
	},
	update: async (id, albumData) => {
		try {
			const album = await client.album.update({
				where: { id },
				data: albumData,
			});
			if (!album) {
				return "album not found";
			}
			return album;
		} catch (error) {
			console.log(error)
			return "error updating album";
		}
	},
	delete: async (id) => {
		try {
			await client.album.delete({
				where: { id },
			});
			return "album deleted successfully";
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2025") {
					return "album not found";
				}
			}
			return "error deleting album";
		}
	},
	addImages: async (albumId, images) => {
		try {
			const album = await client.album.update({
				where: { id: albumId },
				data: {
					images: {
						create: images
					}
				},
				include: { images: true }
			});
			return album;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				console.log(error)
				return "error adding images to album";
			}
			throw error;
		}
	},
	deleteImage: async (imageId) => {
		try {
			await client.albumImage.delete({
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
	replaceImages: async (albumId, images) => {
		try {
			// Удаляем старые картинки
			await client.albumImage.deleteMany({
				where: { albumId }
			});
			// Добавляем новые
			const album = await client.album.update({
				where: { id: albumId },
				data: {
					images: {
						create: images
					}
				},
				include: { images: true }
			});
			return album;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				return "error replacing images";
			}
			throw error;
		}
	},
};

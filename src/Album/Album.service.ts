import { AlbumRepository } from "./Album.repository";
import type { ServiceContract } from "./Album.types";

export const AlbumService: ServiceContract = {
	create: async (albumData) =>
		AlbumRepository.create(albumData),

	getById: async (id) =>
		AlbumRepository.getById(id),

	getByProfileId: async (profileId) =>
		AlbumRepository.getByProfileId(profileId),

	getByUserId: async (userId) =>
		AlbumRepository.getByUserId(userId),

	update: async (id, albumData) =>
		AlbumRepository.update(id, albumData),

	delete: async (id) =>
		AlbumRepository.delete(id),

	addImages: async (albumId, images) =>
		AlbumRepository.addImages(albumId, images),

	deleteImage: async (imageId) =>
		AlbumRepository.deleteImage(imageId),

	replaceImages: async (albumId, images) =>
		AlbumRepository.replaceImages(albumId, images),
};

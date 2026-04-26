import { AlbumRepository } from "./Album.repository";
import type { ServiceContract } from "./Album.types";

export const AlbumService: ServiceContract = {
	create: async (albumData) => {
		const response = await AlbumRepository.create(albumData);
		return response;
	},
	getById: async (id) => {
		const response = await AlbumRepository.getById(id);
		return response;
	},
	getByUserId: async (userId) => {
		const response = await AlbumRepository.getByUserId(userId);
		return response;
	},
	update: async (id, albumData) => {
		const response = await AlbumRepository.update(id, albumData);
		return response;
	},
	delete: async (id) => {
		const response = await AlbumRepository.delete(id);
		return response;
	},
};

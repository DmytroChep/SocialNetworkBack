import { HashtagRepository } from "./Hashtag.repository";
import type { ServiceContract } from "./Hashtag.types";

export const HashtagService: ServiceContract = {
	create: async (hashtagData) => {
		const response = await HashtagRepository.create(hashtagData);
		return response;
	},
	getAll: async () => {
		const response = await HashtagRepository.getAll();
		return response;
	},
	getById: async (id) => {
		const response = await HashtagRepository.getById(id);
		return response;
	},
	update: async (id, hashtagData) => {
		const response = await HashtagRepository.update(id, hashtagData);
		return response;
	},
	delete: async (id) => {
		const response = await HashtagRepository.delete(id);
		return response;
	},
};

import { PostRepository } from "./Post.repository";
import type { ServiceContract } from "./Post.types";

export const PostService: ServiceContract = {
	create: async (postData) => {
		return PostRepository.create(postData);
	},

	getById: async (id) => {
		return PostRepository.getById(id);
	},

	getAll: async () => {
		return PostRepository.getAll();
	},

	getByAuthorId: async (authorId) => {
		return PostRepository.getByAuthorId(authorId);
	},

	update: async (id, postData) => {
		return PostRepository.update(id, postData);
	},

	delete: async (id) => {
		return PostRepository.delete(id);
	},

	addImages: async (postId, images) => {
		return PostRepository.addImages(postId, images);
	},

	deleteImage: async (imageId) => {
		return PostRepository.deleteImage(imageId);
	},

	replaceImages: async (postId, images) => {
		return PostRepository.replaceImages(postId, images);
	},
};

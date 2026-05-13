import { PostRepository } from "./Post.repository";
import type { ServiceContract } from "./Post.types";

export const PostService: ServiceContract = {
	create: (postData) =>
		PostRepository.create(postData),

	getById: (id) =>
		PostRepository.getById(id),

	getAll: (params) =>
		PostRepository.getAll(params),

	getByAuthorId: (authorId) =>
		PostRepository.getByAuthorId(authorId),

	update: (id, postData) =>
		PostRepository.update(id, postData),

	delete: (id) =>
		PostRepository.delete(id),

	addImages: (postId, images) =>
		PostRepository.addImages(postId, images),

	deleteImage: (imageId) =>
		PostRepository.deleteImage(imageId),

	replaceImages: (postId, images) =>
		PostRepository.replaceImages(postId, images),

	heartIncrease: (postId, userEmail) =>
		PostRepository.heartIncrease(postId, userEmail),

	thumbUpIncrease: (postId, userEmail) =>
		PostRepository.thumbUpIncrease(postId, userEmail),

	viewsIncrease: (postId, userEmail) =>
		PostRepository.viewsIncrease(postId, userEmail),
};

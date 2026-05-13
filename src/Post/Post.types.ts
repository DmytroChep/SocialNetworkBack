import type { Request, Response } from "express";
import { Prisma } from "../generated/prisma";

export type Post = Prisma.PostGetPayload<{}>;
export type PostWithRelations = Prisma.PostGetPayload<{
	include: { 
		images: true; 
		hashtags: { include: { hashtag: true } };
		author: { select: { password: false; id: true; email: true; authorName: true; userName: true; status: true; birthDate: true; sign: true; currentAvatarId: true; currentAvatar: true; } }
	};
}>;

interface CreatePostRequest {
	title: string;
	description?: string | null;
	authorId: number;
	topic?: string | null;
	link?: string | null;
	hashtagIds?: number[];
}

interface UpdatePostRequest {
	title?: string;
	description?: string | null;
	topic?: string | null;
	link?: string | null;
	hashtagIds?: number[];
}

export interface RepositoryContract {
	create: (postData: Prisma.PostUncheckedCreateInput) => Promise<PostWithRelations | string>;
	getById: (id: number) => Promise<PostWithRelations | string | null>;
	getAll: () => Promise<PostWithRelations[] | string>;
	getByAuthorId: (authorId: number) => Promise<PostWithRelations[] | string>;
	update: (id: number, postData: Prisma.PostUncheckedUpdateInput) => Promise<PostWithRelations | string>;
	delete: (id: number) => Promise<string>;
	addImages: (postId: number, images: Prisma.PostImageUncheckedCreateInput[]) => Promise<PostWithRelations | string>;
	deleteImage: (imageId: number) => Promise<string>;
	replaceImages: (postId: number, images: Prisma.PostImageUncheckedCreateInput[]) => Promise<PostWithRelations | string>;
}

export interface ServiceContract {
	create: (postData: Prisma.PostUncheckedCreateInput) => Promise<PostWithRelations | string>;
	getById: (id: number) => Promise<PostWithRelations | string | null>;
	getAll: () => Promise<PostWithRelations[] | string>;
	getByAuthorId: (authorId: number) => Promise<PostWithRelations[] | string>;
	update: (id: number, postData: Prisma.PostUncheckedUpdateInput) => Promise<PostWithRelations | string>;
	delete: (id: number) => Promise<string>;
	addImages: (postId: number, images: Prisma.PostImageUncheckedCreateInput[]) => Promise<PostWithRelations | string>;
	deleteImage: (imageId: number) => Promise<string>;
	replaceImages: (postId: number, images: Prisma.PostImageUncheckedCreateInput[]) => Promise<PostWithRelations | string>;
}

export interface ControllerContract {
	create: (req: Request, res: Response) => Promise<void>;
	getById: (req: Request, res: Response) => Promise<void>;
	getAll: (req: Request, res: Response) => Promise<void>;
	getByAuthorId: (req: Request, res: Response) => Promise<void>;
	update: (req: Request, res: Response) => Promise<void>;
	delete: (req: Request, res: Response) => Promise<void>;
	addImages: (req: Request, res: Response) => Promise<void>;
	deleteImage: (req: Request, res: Response) => Promise<void>;
	replaceImages: (req: Request, res: Response) => Promise<void>;
}


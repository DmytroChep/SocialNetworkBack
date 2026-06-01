import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";

export type Post = Prisma.post_app_postGetPayload<{}>;
export type PostWithRelations = Prisma.post_app_postGetPayload<{
	include: { 
		images: true; 
		links: true;
		tags: { include: { tag: true } };
		likes: true;
		hearts: true;
		views: true;
		author: { select: { id: true; email: true; username: true; first_name: true; last_name: true; profile: true; } }
	};
}>;

export interface PostPaginationParams {
	limit?: number;
	cursor?: number | bigint;
}

export interface PaginatedPostsResult {
	items: any[];
	nextCursor: number | bigint | null;
	hasMore: boolean;
}

interface CreatePostRequest {
	title: string;
	description?: string | null;
	authorId: number;
	topic?: string | null;
	link?: string | null;
	hashtagIds?: number[];
	hashtags?: string[];
}

interface UpdatePostRequest {
	title?: string;
	description?: string | null;
	topic?: string | null;
	link?: string | null;
	hashtagIds?: number[];
	hashtags?: string[];
}

export interface RepositoryContract {
	create: (postData: any) => Promise<any | string>;
	getById: (id: number) => Promise<any | string | null>;
	getAll: (params?: PostPaginationParams) => Promise<PaginatedPostsResult | string>;
	getByAuthorId: (authorId: number) => Promise<any[] | string>;
	update: (id: number, postData: any) => Promise<any | string>;
	delete: (id: number) => Promise<string>;
	addImages: (postId: number, images: any[]) => Promise<any | string>;
	deleteImage: (imageId: number) => Promise<string>;
	replaceImages: (postId: number, images: any[]) => Promise<any | string>;
	thumbUpIncrease: (postId: number, email:string) => Promise<string>,
	heartIncrease: (postId: number, email:string) => Promise<string>,
	viewsIncrease: (postId: number, email:string) => Promise<string>
}

export interface ServiceContract {
	create: (postData: any) => Promise<any | string>;
	getById: (id: number, userId?: number) => Promise<any | string | null>;
	getAll: (params?: PostPaginationParams) => Promise<PaginatedPostsResult | string>;
	getByAuthorId: (authorId: number, userId?: number) => Promise<any[] | string>;
	update: (id: number, postData: any) => Promise<any | string>;
	delete: (id: number) => Promise<string>;
	addImages: (postId: number, images: any[]) => Promise<any | string>;
	deleteImage: (imageId: number) => Promise<string>;
	replaceImages: (postId: number, images: any[]) => Promise<any | string>;
	thumbUpIncrease: (postId: number, email:string) => Promise<string>,
	heartIncrease: (postId: number, email:string) => Promise<string>,
	viewsIncrease: (postId: number, userEmail: string) => Promise<string>
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
	thumbUpIncrease: (req: Request, res: Response) => Promise<void>,
	heartIncrease: (req: Request, res: Response) => Promise<void>,
	viewsIncrease: (req: Request, res: Response) => Promise<void>
}

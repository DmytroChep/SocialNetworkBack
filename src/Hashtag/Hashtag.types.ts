import type { Request, Response } from "express";
import { Prisma } from "../generated/prisma";

export type Hashtag = Prisma.HashtagGetPayload<{}>;
export type HashtagWithPosts = Prisma.HashtagGetPayload<{ include: { posts: true } }>;
export type CreateHashtag = Prisma.HashtagUncheckedCreateInput;
export type UpdateHashtag = Prisma.HashtagUncheckedUpdateInput;

export interface RepositoryContract {
	create: (hashtagData: CreateHashtag) => Promise<Hashtag | string>;
	getAll: () => Promise<Hashtag[] | string>;
	getById: (id: number) => Promise<HashtagWithPosts | string | null>;
	update: (id: number, hashtagData: UpdateHashtag) => Promise<Hashtag | string>;
	delete: (id: number) => Promise<string>;
}

export interface ServiceContract {
	create: (hashtagData: CreateHashtag) => Promise<Hashtag | string>;
	getAll: () => Promise<Hashtag[] | string>;
	getById: (id: number) => Promise<HashtagWithPosts | string | null>;
	update: (id: number, hashtagData: UpdateHashtag) => Promise<Hashtag | string>;
	delete: (id: number) => Promise<string>;
}

export interface ControllerContract {
	create: (req: Request<any>, res: Response<any>) => Promise<void>;
	getAll: (req: Request<any>, res: Response<any>) => Promise<void>;
	getById: (req: Request<any>, res: Response<any>) => Promise<void>;
	update: (req: Request<any>, res: Response<any>) => Promise<void>;
	delete: (req: Request<any>, res: Response<any>) => Promise<void>;
}

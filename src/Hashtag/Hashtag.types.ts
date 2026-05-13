import type { Request, Response } from "express";
import { Prisma } from "../generated/prisma";

export type Hashtag = Prisma.TagGetPayload<{}>;
export type HashtagWithPosts = Prisma.TagGetPayload<{
	include: {
		posts: {
			include: {
				post: true;
			};
		};
	};
}>;
export type CreateHashtag = Prisma.TagUncheckedCreateInput;
export type UpdateHashtag = Prisma.TagUncheckedUpdateInput;

export interface RepositoryContract {
	create: (hashtagData: CreateHashtag) => Promise<any | string>;
	getAll: () => Promise<any[] | string>;
	getById: (id: number) => Promise<any | string | null>;
	update: (id: number, hashtagData: UpdateHashtag) => Promise<any | string>;
	delete: (id: number) => Promise<string>;
	getOrCreate: (name: string) => Promise<any | string>;
	getOrCreateMultiple: (names: string[]) => Promise<any[] | string>;
}

export interface ServiceContract {
	create: (hashtagData: CreateHashtag) => Promise<any | string>;
	getAll: () => Promise<any[] | string>;
	getById: (id: number) => Promise<any | string | null>;
	update: (id: number, hashtagData: UpdateHashtag) => Promise<any | string>;
	delete: (id: number) => Promise<string>;
	getOrCreate: (name: string) => Promise<any | string>;
	getOrCreateMultiple: (names: string[]) => Promise<any[] | string>;
}

export interface ControllerContract {
	create: (req: Request<any>, res: Response<any>) => Promise<void>;
	getAll: (req: Request<any>, res: Response<any>) => Promise<void>;
	getById: (req: Request<any>, res: Response<any>) => Promise<void>;
	update: (req: Request<any>, res: Response<any>) => Promise<void>;
	delete: (req: Request<any>, res: Response<any>) => Promise<void>;
}

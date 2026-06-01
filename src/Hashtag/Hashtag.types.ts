import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";

export type Hashtag = Prisma.post_app_tagGetPayload<{}>;
export type HashtagWithPosts = Prisma.post_app_tagGetPayload<{
	include: {
		posts: {
			include: {
				post: true;
			};
		};
	};
}>;
export type CreateHashtag = Prisma.post_app_tagUncheckedCreateInput;
export type UpdateHashtag = Prisma.post_app_tagUncheckedUpdateInput;

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

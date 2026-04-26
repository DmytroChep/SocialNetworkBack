import type { Request, Response } from "express";
import { Prisma } from "../generated/prisma";

export type Album = Prisma.AlbumGetPayload<{}>;
export type AlbumWithImages = Prisma.AlbumGetPayload<{ include: { images: true } }>;
export type CreateAlbum = Prisma.AlbumUncheckedCreateInput;
export type UpdateAlbum = Prisma.AlbumUncheckedUpdateInput;
export type CreateAlbumImage = Prisma.AlbumImageUncheckedCreateInput;

export interface RepositoryContract {
	create: (albumData: CreateAlbum) => Promise<Album | string>;
	getById: (id: number) => Promise<AlbumWithImages | string | null>;
	getByUserId: (userId: number) => Promise<AlbumWithImages[] | string>;
	update: (id: number, albumData: UpdateAlbum) => Promise<Album | string>;
	delete: (id: number) => Promise<string>;
}

export interface ServiceContract {
	create: (albumData: CreateAlbum) => Promise<Album | string>;
	getById: (id: number) => Promise<AlbumWithImages | string | null>;
	getByUserId: (userId: number) => Promise<AlbumWithImages[] | string>;
	update: (id: number, albumData: UpdateAlbum) => Promise<Album | string>;
	delete: (id: number) => Promise<string>;
}

export interface ControllerContract {
	create: (req: Request<any>, res: Response<any>) => Promise<void>;
	getById: (req: Request<any>, res: Response<any>) => Promise<void>;
	getByUserId: (req: Request<any>, res: Response<any>) => Promise<void>;
	update: (req: Request<any>, res: Response<any>) => Promise<void>;
	delete: (req: Request<any>, res: Response<any>) => Promise<void>;
}

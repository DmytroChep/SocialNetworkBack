import type { Request, Response } from "express";
import type { Prisma } from "../generated/prisma";

export type Album = Prisma.AlbumGetPayload<{}>;

export type AlbumWithImages = Prisma.AlbumGetPayload<{
	include: {
		images: true;
	};
}>;

export type CreateAlbum = Prisma.AlbumCreateInput;

export type UpdateAlbum = Prisma.AlbumUpdateInput;

export type CreateAlbumImage = Prisma.AlbumImageCreateWithoutAlbumInput;

export type ErrorResponse = string;

export interface RepositoryContract {
	create: (
		albumData: any,
	) => Promise<any | ErrorResponse>;

	getById: (
		id: number,
	) => Promise<any | ErrorResponse | null>;

	getByProfileId: (
		profileId: number,
	) => Promise<any[] | ErrorResponse>;

	getByUserId: (
		userId: number,
	) => Promise<any[] | ErrorResponse>;

	update: (
		id: number,
		albumData: any,
	) => Promise<any | ErrorResponse>;

	delete: (
		id: number,
	) => Promise<ErrorResponse>;

	addImages: (
		albumId: number,
		images: CreateAlbumImage[],
	) => Promise<any | ErrorResponse>;

	deleteImage: (
		imageId: number,
	) => Promise<ErrorResponse>;

	replaceImages: (
		albumId: number,
		images: CreateAlbumImage[],
	) => Promise<any | ErrorResponse>;
}

export interface ServiceContract {
	create: (
		albumData: any,
	) => Promise<any | ErrorResponse>;

	getById: (
		id: number,
	) => Promise<any | ErrorResponse | null>;

	getByProfileId: (
		profileId: number,
	) => Promise<any[] | ErrorResponse>;

	getByUserId: (
		userId: number,
	) => Promise<any[] | ErrorResponse>;

	update: (
		id: number,
		albumData: any,
	) => Promise<any | ErrorResponse>;

	delete: (
		id: number,
	) => Promise<ErrorResponse>;

	addImages: (
		albumId: number,
		images: CreateAlbumImage[],
	) => Promise<any | ErrorResponse>;

	deleteImage: (
		imageId: number,
	) => Promise<ErrorResponse>;

	replaceImages: (
		albumId: number,
		images: CreateAlbumImage[],
	) => Promise<any | ErrorResponse>;
}

export interface ControllerContract {
	create: (
		req: Request,
		res: Response,
	) => Promise<void>;

	getById: (
		req: Request,
		res: Response,
	) => Promise<void>;

	getByProfileId: (
		req: Request,
		res: Response,
	) => Promise<void>;

	getByUserId: (
		req: Request,
		res: Response,
	) => Promise<void>;

	update: (
		req: Request,
		res: Response,
	) => Promise<void>;

	delete: (
		req: Request,
		res: Response,
	) => Promise<void>;

	addImages: (
		req: Request,
		res: Response,
	) => Promise<void>;

	deleteImage: (
		req: Request,
		res: Response,
	) => Promise<void>;

	replaceImages: (
		req: Request,
		res: Response,
	) => Promise<void>;
}

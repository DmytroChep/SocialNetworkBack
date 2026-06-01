import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";

export type Album = Prisma.profile_app_albumGetPayload<{}>;

export type AlbumWithImages = Prisma.profile_app_albumGetPayload<{
	include: {
		images: true;
	};
}>;

export type CreateAlbum = Prisma.profile_app_albumCreateInput;

export type UpdateAlbum = Prisma.profile_app_albumUpdateInput;

export type CreateAlbumImage = Prisma.profile_app_albumimageCreateWithoutAlbumInput;

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
	) => Promise<any | ErrorResponse>;

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
	) => Promise<any | ErrorResponse>;

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

import { client } from "../config/client";
import { Prisma } from "@prisma/client";
import { deleteMediaFiles } from "../utils/media-files";
import type { RepositoryContract } from "./Album.types";

const albumInclude = { images: true, profile: true };

type AlbumImagePath = { image?: string | null };

const getAlbumImagePaths = (images: AlbumImagePath[] = []) =>
    images.map((image) => image.image);

const getCreatedAlbumImagePaths = (albumData: any) =>
    Array.isArray(albumData?.images?.create)
        ? getAlbumImagePaths(albumData.images.create)
        : [];

const getRemovedAlbumImagePaths = (
    previousImages: AlbumImagePath[],
    nextImages: AlbumImagePath[],
) => {
    const nextPaths = new Set(getAlbumImagePaths(nextImages).filter(Boolean));
    return getAlbumImagePaths(previousImages).filter(
        (image) => image && !nextPaths.has(image),
    );
};

const serializeAlbum = (album: any) => ({
    ...album,
    topic: album.theme ?? null,
    year: album.year === null || album.year === undefined ? null : String(album.year),
    userId: album.profile?.user_id ?? album.profile_id,
    images: Array.isArray(album.images)
        ? album.images.map((image: any) => ({
                ...image,
                albumId: image.album_id,
            }))
        : [],
});

const serializeAlbumResult = (value: any) =>
    Array.isArray(value) ? value.map(serializeAlbum) : serializeAlbum(value);

export const AlbumRepository: RepositoryContract = {
    create: async (albumData) => {
        const createdImagePaths = getCreatedAlbumImagePaths(albumData);

        try {
            const album = await client.profile_app_album.create({
                data: albumData,
                include: albumInclude,
            });
            return serializeAlbum(album);
        } catch (error) {
            deleteMediaFiles(createdImagePaths);
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                return "error creating album";
            }
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const album = await client.profile_app_album.findUnique({
                where: { id },
                include: albumInclude,
            });
            return album ? serializeAlbum(album) : album;
        } catch {
            return "error fetching album";
        }
    },

    getByProfileId: async (profileId) => {
        try {
            const albums = await client.profile_app_album.findMany({
                where: { profile_id: profileId },
                include: albumInclude,
            });
            return serializeAlbumResult(albums);
        } catch {
            return "error fetching albums";
        }
    },

    getByUserId: async (userId) => {
        try {
            const albums = await client.profile_app_album.findMany({
                where: {
                    profile: {
                        user: { id: userId },
                    },
                },
                include: albumInclude,
            });
            return serializeAlbumResult(albums);
        } catch {
            return "error fetching albums";
        }
    },

    update: async (id, albumData) => {
        try {
            const album = await client.profile_app_album.update({
                where: { id },
                data: albumData,
                include: albumInclude,
            });
            return serializeAlbum(album);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                return "album not found";
            }
            return "error updating album";
        }
    },

    delete: async (id) => {
        try {
            const album = await client.profile_app_album.findUnique({
                where: { id },
                include: { images: true },
            });

            if (!album) return "album not found";

            await client.$transaction(async (tx) => {
                await tx.profile_app_albumimage.deleteMany({ where: { album_id: id } });
                await tx.profile_app_album.delete({ where: { id } });
            });
            deleteMediaFiles(getAlbumImagePaths(album.images));
            return { success: true, message: "album deleted successfully" };
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                return "album not found";
            }
            return "error deleting album";
        }
    },

    addImages: async (albumId, images) => {
        const createdImagePaths = getAlbumImagePaths(images);

        try {
            const album = await client.profile_app_album.update({
                where: { id: albumId },
                data: { images: { create: images } },
                include: albumInclude,
            });
            return serializeAlbum(album);
        } catch (error) {
            deleteMediaFiles(createdImagePaths);
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                return "album not found";
            }
            return "error adding images to album";
        }
    },

    deleteImage: async (imageId) => {
        try {
            const image = await client.profile_app_albumimage.findUnique({
                where: { id: imageId },
            });

            if (!image) return "image not found";

            await client.profile_app_albumimage.delete({ where: { id: imageId } });
            deleteMediaFiles(getAlbumImagePaths([image]));
            return "image deleted successfully";
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                return "image not found";
            }
            return "error deleting image";
        }
    },

    replaceImages: async (albumId, images) => {
        const createdImagePaths = getAlbumImagePaths(images);

        try {
            const existingImages = await client.profile_app_albumimage.findMany({
                where: { album_id: albumId },
            });
            const album = await client.profile_app_album.update({
                where: { id: albumId },
                data: {
                    images: {
                        deleteMany: {},
                        create: images,
                    },
                },
                include: albumInclude,
            });
            deleteMediaFiles(getRemovedAlbumImagePaths(existingImages, images));
            return serializeAlbum(album);
        } catch (error) {
            deleteMediaFiles(createdImagePaths);
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                return "album not found";
            }
            return "error replacing images";
        }
    },
};

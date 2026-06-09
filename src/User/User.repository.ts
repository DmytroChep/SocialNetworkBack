import { compare, hash } from "bcrypt";
import { client } from "../config/client";
import { Prisma } from "../generated/prisma";
import {
    DEFAULT_AVATAR_PATH,
    deleteMediaFile,
    deleteMediaFiles,
} from "../utils/media-files";
import type { RepositoryContract, UserWithoutPassword } from "./User.types";

type EmailVerificationRow = {
    id: number;
    user_id: number;
    code: string;
    new_email: string | null;
    expires_at: Date;
};

type MediaImage = {
    image?: string | null;
    original_image?: string | null;
    compressed_image?: string | null;
};

const imagePaths = (images: MediaImage[] = []) =>
    images.flatMap((image) => [
        image.image,
        image.original_image,
        image.compressed_image,
    ]);

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

const serializeUser = (user: any) => {
    const profile = user.profile ?? null;
    const avatarPath = profile?.avatar || DEFAULT_AVATAR_PATH;
    const avatar = {
        id: profile?.id ?? user.id,
        image: avatarPath,
        userId: user.id,
    };

    return {
        ...user,
        profile: profile ? { ...profile, avatar: avatarPath } : profile,
        authorName: user.first_name || profile?.pseudonym || null,
        userName: user.username,
        status: profile?.pseudonym ?? null,
        birthDate: profile?.birth_date ?? null,
        sign: profile?.signature ?? null,
        currentAvatarId: avatar.id,
        currentAvatar: avatar,
        avatars: [avatar],
        albums: Array.isArray(profile?.albums)
            ? profile.albums.map(serializeAlbum)
            : [],
    };
};

const toUserCreateData = (userData: any) => {
    const username = userData.username ?? userData.userName ?? userData.email;
    const firstName = userData.first_name ?? userData.authorName ?? "";
    const lastName = userData.last_name ?? "";

    return {
        email: userData.email,
        password: userData.password,
        username,
        first_name: firstName,
        last_name: lastName,
        is_active: userData.is_active ?? true,
        is_staff: userData.is_staff ?? false,
        is_superuser: userData.is_superuser ?? false,
        profile: {
            create: {
                birth_date: userData.birth_date ?? userData.birthDate ?? null,
                signature: userData.signature ?? userData.sign ?? null,
                pseudonym: userData.pseudonym ?? userData.status ?? null,
                avatar:
                    userData.avatar ??
                    userData.currentAvatar?.image ??
                    DEFAULT_AVATAR_PATH,
            },
        },
    };
};

const toUserUpdateData = (userData: any) => {
    const userUpdate: any = {};
    const profileUpdate: any = {};

    if (userData.email !== undefined) userUpdate.email = userData.email;
    if (userData.password !== undefined) userUpdate.password = userData.password;
    if (userData.username !== undefined || userData.userName !== undefined) {
        userUpdate.username = userData.username ?? userData.userName;
    }
    if (userData.first_name !== undefined || userData.authorName !== undefined) {
        userUpdate.first_name = userData.first_name ?? userData.authorName;
    }
    if (userData.last_name !== undefined) userUpdate.last_name = userData.last_name;
    if (userData.is_active !== undefined) userUpdate.is_active = userData.is_active;
    if (userData.is_staff !== undefined) userUpdate.is_staff = userData.is_staff;
    if (userData.is_superuser !== undefined) userUpdate.is_superuser = userData.is_superuser;

    if (userData.birth_date !== undefined || userData.birthDate !== undefined) {
        profileUpdate.birth_date = userData.birth_date ?? userData.birthDate;
    }
    if (userData.signature !== undefined || userData.sign !== undefined) {
        profileUpdate.signature = userData.signature ?? userData.sign;
    }
    if (userData.pseudonym !== undefined || userData.status !== undefined) {
        profileUpdate.pseudonym = userData.pseudonym ?? userData.status;
    }
    if (userData.avatar !== undefined || userData.currentAvatar?.image !== undefined) {
        profileUpdate.avatar =
            userData.avatar ?? userData.currentAvatar?.image ?? DEFAULT_AVATAR_PATH;
    }

    if (Object.keys(profileUpdate).length > 0) {
        userUpdate.profile = {
            upsert: {
                create: profileUpdate,
                update: profileUpdate,
            },
        };
    }

    return userUpdate;
};

export const UserRepository: RepositoryContract = {
    registration: async (userData) => {
        const createData = toUserCreateData(userData);
        const existing = await client.user.findFirst({
            where: {
                OR: [
                    { email: createData.email },
                    { username: createData.username },
                ],
            },
        });

        if (existing) {
            return "user already exists";
        }

        const password = await hash(createData.password, 10);

        return client.user.create({
            data: {
                ...createData,
                password,
            },
        });
    },

    login: async (UserData) => {
        const user = await client.user.findUnique({
            where: { email: UserData.email },
        });

        if (user == null) {
            return "user doesn't exists";
        }

        const isPasswordCorrect = await compare(UserData.password, user.password);

        if (!isPasswordCorrect) {
            return "password not correct";
        }

        return user;
    },

    me: async (UserEmail) => {
        const user = await client.user.findUnique({
            where: { email: UserEmail },
            include: {
                profile: {
                    include: {
                        albums: {
                            include: { images: true },
                        },
                    },
                },
            },
        });
        if (user === null) {
            return "user not found";
        }
        return serializeUser(user);
    },

    updateUser: async (userData, id) => {
        if (typeof userData.password === "string") {
            userData.password = await hash(userData.password, 10);
        }
        const data = toUserUpdateData(userData);
        const previousProfile = await client.profile.findUnique({
            where: { user_id: Number(id) },
            select: { avatar: true },
        });

        try {
            const user = await client.user.update({
                where: {
                    id: Number(id),
                },
                data,
                include: {
                    profile: {
                        include: {
                            albums: {
                                include: { images: true },
                            },
                        },
                    },
                },
            });

            const nextAvatar = user.profile?.avatar;
            if (previousProfile?.avatar && previousProfile.avatar !== nextAvatar) {
                deleteMediaFile(previousProfile.avatar);
            }

            return serializeUser(user);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === "P2025") {
                    return "user not found";
                }
            }
            throw error;
        }
    },

    sendCodeVerify: async (email, code, newEmail) => {
        try {
            const user = await client.user.findUnique({
                where: { email },
            });

            if (!user) {
                return "user not found";
            }

            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

            await client.$executeRaw`
                DELETE FROM user_app_emailverification
                WHERE user_id = ${user.id}
            `;

            await client.$executeRaw`
                INSERT INTO user_app_emailverification (user_id, code, new_email, expires_at)
                VALUES (${user.id}, ${code}, ${newEmail ?? null}, ${expiresAt})
            `;

            return "status success";
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                return "error creating verification code";
            }
            throw error;
        }
    },

    checkIsCodeExists: async (email, code) => {
        const verifications = email
            ? await client.$queryRaw<EmailVerificationRow[]>`
            SELECT ev.id, ev.user_id, ev.code, ev.new_email, ev.expires_at
            FROM user_app_emailverification ev
            INNER JOIN user_app_user u ON u.id = ev.user_id
            WHERE u.email = ${email}
            LIMIT 1
        `
            : await client.$queryRaw<EmailVerificationRow[]>`
            SELECT id, user_id, code, new_email, expires_at
            FROM user_app_emailverification
            WHERE code = ${code}
            LIMIT 1
        `;
        const [verification] = verifications;

        if (!verification) {
            return false;
        }

        const expiresAt = new Date(verification.expires_at);

        if (expiresAt.getTime() < Date.now()) {
            await client.$executeRaw`
                DELETE FROM user_app_emailverification
                WHERE id = ${verification.id}
            `;
            return false;
        }

        const isValid = verification.code === code;

        if (isValid) {
            await client.$executeRaw`
                DELETE FROM user_app_emailverification
                WHERE id = ${verification.id}
            `;
        }

        return isValid;
    },

    updatePassword: async (userData) => {
        const hashedPassword = await hash(userData.password, 10);

        try {
            await client.user.update({
                where: {
                    email: userData.email,
                },
                data: { password: hashedPassword },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                return "user not found";
            }
            throw error;
        }

        return "success";
    },

    updateAvatar: async (imagePath: string, userId: string) => {
        try {
            const id = Number(userId);
            if (isNaN(id)) throw new Error("Invalid User ID");

            const previousProfile = await client.profile.findUnique({
                where: { user_id: id },
                select: { avatar: true },
            });
            const nextAvatar = imagePath || DEFAULT_AVATAR_PATH;

            const profile = await client.profile.upsert({
                where: { user_id: id },
                update: { avatar: nextAvatar },
                create: {
                    user_id: id,
                    avatar: nextAvatar,
                },
            });

            if (previousProfile?.avatar && previousProfile.avatar !== nextAvatar) {
                deleteMediaFile(previousProfile.avatar);
            }

            return {
                id: profile.id,
                image: profile.avatar || DEFAULT_AVATAR_PATH,
                userId: id,
            };
        } catch (error) {
            console.error("DB Error:", error);
            deleteMediaFile(imagePath);
            return "error updating avatar";
        }
    },

    userById: async (userId) => {
        try {
            const user = await client.user.findUnique({
                where: { id: userId },
                include: {
                    profile: {
                        include: {
                            albums: {
                                include: { images: true },
                            },
                        },
                    },
                },
            });

            if (!user) {
                return "user not found";
            }

            return serializeUser(user);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === "P2025") {
                    return "user not found";
                }
            }
            throw error;
        }
    },

    allUsers: async () => {
        const users = await client.user.findMany({
            include: {
                profile: {
                    include: {
                        albums: {
                            include: { images: true },
                        },
                    },
                },
            },
            orderBy: { id: "desc" },
        });

        return users.map((user) => {
            const { password, ...userWithoutPassword } = serializeUser(user);
            return userWithoutPassword;
        }) as UserWithoutPassword[];
    },

    deleteUser: async (id) => {
        const user = await client.user.findUnique({
            where: { id },
            include: {
                profile: {
                    include: {
                        albums: {
                            include: { images: true },
                        },
                    },
                },
                posts: {
                    include: { images: true },
                },
            },
        });

        if (!user) return "user not found";

        const sentMessages = await client.message.findMany({
            where: { sender_id: id },
            include: { images: true },
        });
        const profileId = user.profile?.id;
        const albumIds = user.profile?.albums.map((album) => album.id) ?? [];
        const postIds = user.posts.map((post) => post.id);
        const messageIds = sentMessages.map((message) => message.id);

        const filesToDelete = [
            user.profile?.avatar,
            user.profile?.signature,
            ...(user.profile?.albums.flatMap((album) => imagePaths(album.images)) ?? []),
            ...user.posts.flatMap((post) => imagePaths(post.images)),
            ...sentMessages.flatMap((message) => imagePaths(message.images)),
        ];

        await client.$transaction(async (tx) => {
            if (profileId) {
                await tx.friendRequest.deleteMany({
                    where: {
                        OR: [
                            { from_profile_id: profileId },
                            { to_profile_id: profileId },
                        ],
                    },
                });
                await tx.profileFriend.deleteMany({
                    where: {
                        OR: [
                            { from_profile_id: profileId },
                            { to_profile_id: profileId },
                        ],
                    },
                });
            }

            if (postIds.length > 0) {
                await tx.postTag.deleteMany({ where: { post_id: { in: postIds } } });
                await tx.postImage.deleteMany({ where: { post_id: { in: postIds } } });
                await tx.postLink.deleteMany({ where: { post_id: { in: postIds } } });
                await tx.postLike.deleteMany({ where: { post_id: { in: postIds } } });
                await tx.postHeart.deleteMany({ where: { post_id: { in: postIds } } });
                await tx.postView.deleteMany({ where: { post_id: { in: postIds } } });
                await tx.post.deleteMany({ where: { id: { in: postIds } } });
            }

            await tx.postLike.deleteMany({ where: { user_id: id } });
            await tx.postHeart.deleteMany({ where: { user_id: id } });
            await tx.postView.deleteMany({ where: { user_id: id } });

            if (messageIds.length > 0) {
                await tx.messageReader.deleteMany({
                    where: { message_id: { in: messageIds } },
                });
                await tx.messageImage.deleteMany({
                    where: { message_id: { in: messageIds } },
                });
                await tx.message.deleteMany({ where: { id: { in: messageIds } } });
            }

            await tx.messageReader.deleteMany({ where: { user_id: id } });
            await tx.chatUser.deleteMany({ where: { user_id: id } });

            if (albumIds.length > 0) {
                await tx.albumImage.deleteMany({ where: { album_id: { in: albumIds } } });
                await tx.album.deleteMany({ where: { id: { in: albumIds } } });
            }

            if (profileId) {
                await tx.profile.delete({ where: { id: profileId } });
            }

            await tx.emailVerification.deleteMany({ where: { user_id: id } });
            await tx.userGroup.deleteMany({ where: { user_id: id } });
            await tx.userPermission.deleteMany({ where: { user_id: id } });
            await tx.djangoAdminLog.deleteMany({ where: { user_id: id } });
            await tx.user.delete({ where: { id } });
        });

        deleteMediaFiles(filesToDelete);

        return "user deleted successfully";
    },
    updateUserStatus: async (userId: number, status: string) => {
        return await client.user.update({
            where: { id: userId },
            data: { 
                status: status,
                last_login: status === 'offline' ? new Date() : null 
            },
        });
    }
};


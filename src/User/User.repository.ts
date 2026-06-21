import { compare, hash } from "bcrypt";

import {
    DEFAULT_AVATAR_PATH,
    deleteMediaFile,
    deleteMediaFiles,
    deleteSignatureFile,
    getMediaUrl,
    getSignatureFileName,
    isDataUriImage,
    saveSignatureImage,
} from "../utils/media-files";
import type { RepositoryContract, UserWithoutPassword } from "./User.types";
import { Prisma } from "@prisma/client";
import { client } from "../config/client";

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

const hasOwn = (value: any, key: string) =>
    value && Object.prototype.hasOwnProperty.call(value, key);

const profileField = (userData: any, key: string) => {
    if (hasOwn(userData, key)) return userData[key];
    if (hasOwn(userData?.profile, key)) return userData.profile[key];
    return undefined;
};

const signatureField = (userData: any) => {
    if (hasOwn(userData, "signature")) return userData.signature;
    if (hasOwn(userData, "sign")) return userData.sign;
    if (hasOwn(userData?.profile, "signature")) return userData.profile.signature;
    return undefined;
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

const serializeUser = (user: any) => {
    const profile = user.profile ?? null;
    const avatarPathRaw = profile?.avatar || DEFAULT_AVATAR_PATH;
    const avatarPath = (() => {
        if (!avatarPathRaw) return avatarPathRaw;
        if (avatarPathRaw.startsWith("http")) return avatarPathRaw;
        if (avatarPathRaw.includes("/")) return avatarPathRaw;
        const base = avatarPathRaw.replace(/\.[^/.]+$/, "");
        return `profile_app/avatars/${base}`;
    })();

    const signatureRaw = profile?.signature ?? null;
    const signatureFileName = getSignatureFileName(signatureRaw);
    const signatureCandidate = signatureFileName ?? (signatureRaw?.startsWith("data:") ? null : signatureRaw ?? null);
    const signature = (() => {
        if (!signatureCandidate) return signatureCandidate;
        if (signatureCandidate.startsWith("http")) return signatureCandidate;
        if (signatureCandidate.includes("/")) return signatureCandidate;
        const base = signatureCandidate.replace(/\.[^/.]+$/, "");
        return `profile_app/signatures/${base}`;
    })();

    const avatar = {
        id: profile?.id ?? user.id,
        image: getMediaUrl(avatarPath) ?? avatarPath,
        userId: user.id,
    };

    return {
        ...user,
        profile: profile ? { 
            ...profile, 
            avatar: getMediaUrl(avatarPath) ?? avatarPath, 
            signature: getMediaUrl(signature) ?? signature 
        } : profile,
        authorName: user.first_name || profile?.pseudonym || null,
        userName: user.username,
        status: profile?.pseudonym ?? null,
        birthDate: profile?.birth_date ?? null,
        sign: getMediaUrl(signature) ?? signature,
        signatureImage: getMediaUrl(signature) ?? signature,
        currentAvatarId: avatar.id,
        currentAvatar: avatar,
        avatars: [avatar],
    };
};

const toUserCreateData = async (userData: any) => {
  const username = userData.username ?? userData.userName ?? userData.email;
  const firstName = userData.first_name ?? userData.authorName ?? "";
  const lastName = userData.last_name ?? "";
  const signature = signatureField(userData);

  return {
    email: userData.email,
    password: userData.password,
    username,
    first_name: firstName,
    last_name: lastName,
    is_active: userData.is_active ?? true,
    is_staff: userData.is_staff ?? false,
    is_superuser: userData.is_superuser ?? false,
    date_joined: new Date(),
    profile: {
      create: {
        birth_date: userData.birth_date ?? userData.birthDate ?? null,
        signature: signature !== undefined
          ? await saveSignatureImage(signature, `signature_${username}`)  // ✅ await
          : null,
        pseudonym: userData.pseudonym ?? userData.status ?? null,
        avatar:
          userData.avatar ??
          userData.currentAvatar?.image ??
          DEFAULT_AVATAR_PATH,
        is_text_signature: false,
        is_image_signature: false,
      },
    },
  };
};

const toUserUpdateData = (userData: any, normalizedSignature?: string | null) => {
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

    if (userData.birth_date !== undefined || userData.birthDate !== undefined || profileField(userData, "birth_date") !== undefined) {
        profileUpdate.birth_date = userData.birth_date ?? userData.birthDate ?? profileField(userData, "birth_date");
    }
    if (signatureField(userData) !== undefined) {
        profileUpdate.signature = normalizedSignature ?? null;
    }
    if (userData.pseudonym !== undefined || userData.status !== undefined || profileField(userData, "pseudonym") !== undefined) {
        profileUpdate.pseudonym = userData.pseudonym ?? userData.status ?? profileField(userData, "pseudonym");
    }
    if (profileField(userData, "is_image_signature") !== undefined) {
        profileUpdate.is_image_signature = profileField(userData, "is_image_signature");
    }
    if (profileField(userData, "is_text_signature") !== undefined) {
        profileUpdate.is_text_signature = profileField(userData, "is_text_signature");
    }
    if (userData.avatar !== undefined || userData.currentAvatar?.image !== undefined) {
        profileUpdate.avatar =
            userData.avatar ?? userData.currentAvatar?.image ?? DEFAULT_AVATAR_PATH;
    }

    if (Object.keys(profileUpdate).length > 0) {
        const createProfile = {
            ...profileUpdate,
            // Ensure required boolean fields exist when creating a new profile during upsert
            is_text_signature: profileUpdate.is_text_signature ?? false,
            is_image_signature: profileUpdate.is_image_signature ?? false,
        };

        userUpdate.profile = {
            upsert: {
                create: createProfile,
                update: profileUpdate,
            },
        };
    }

    return userUpdate;
};

export const UserRepository: RepositoryContract = {
    registration: async (userData) => {
        const createData = await toUserCreateData(userData);
        const existing = await client.user_app_user.findFirst({
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

        const created = await client.user_app_user.create({
            data: {
                ...createData,
                password,
            },
            include: {
                profile: {
                    include: {
                        albums: { include: { images: true } },
                    },
                },
            },
        });

        return serializeUser(created);
    },

    login: async (UserData) => {
        const user = await client.user_app_user.findUnique({
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
        const user = await client.user_app_user.findUnique({
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
        const userId = Number(id);
        const incomingSignature = signatureField(userData);
        const normalizedSignature = incomingSignature !== undefined
            ? await saveSignatureImage(incomingSignature, `signature_${userId}`)
            : undefined;
        const createdSignature = isDataUriImage(incomingSignature) ? normalizedSignature : null;
        const data = toUserUpdateData(userData, normalizedSignature);
        const previousProfile = await client.profile_app_profile.findUnique({
            where: { user_id: userId },
            select: { avatar: true, signature: true },
        });

        try {
            const user = await client.user_app_user.update({
                where: {
                    id: userId,
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
            const nextSignature = user.profile?.signature;
            if (previousProfile?.avatar && previousProfile.avatar !== nextAvatar) {
                deleteMediaFile(previousProfile.avatar);
            }
            if (previousProfile?.signature && previousProfile.signature !== nextSignature) {
                deleteSignatureFile(previousProfile.signature);
            }

            return serializeUser(user);
        } catch (error) {
            if (createdSignature) deleteSignatureFile(createdSignature);
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
            const user = await client.user_app_user.findUnique({
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
            await client.user_app_user.update({
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

            const previousProfile = await client.profile_app_profile.findUnique({
                where: { user_id: id },
                select: { avatar: true },
            });
            const nextAvatar = imagePath || DEFAULT_AVATAR_PATH;

            const profile = await client.profile_app_profile.upsert({
                where: { user_id: id },
                update: { avatar: nextAvatar },
                create: {
                    user_id: id,
                    avatar: nextAvatar,
                    is_text_signature: false,
                    is_image_signature: false,
                },
            });

            if (previousProfile?.avatar && previousProfile.avatar !== nextAvatar) {
                deleteMediaFile(previousProfile.avatar);
            }

            return {
                id: profile.id,
                image: (getMediaUrl(profile.avatar) ?? profile.avatar) || DEFAULT_AVATAR_PATH,
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
            const user = await client.user_app_user.findUnique({
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
        const users = await client.user_app_user.findMany({
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
        const user = await client.user_app_user.findUnique({
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

        const sentMessages = await client.chat_app_message.findMany({
            where: { sender_id: id },
            include: { images: true },
        });
        const profileId = user.profile?.id;
        const albumIds = user.profile?.albums.map((album) => album.id) ?? [];
        const postIds = user.posts.map((post) => post.id);
        const messageIds = sentMessages.map((message) => message.id);

        const filesToDelete = [
            user.profile?.avatar,
            ...(user.profile?.albums.flatMap((album) => imagePaths(album.images)) ?? []),
            ...user.posts.flatMap((post) => imagePaths(post.images)),
            ...sentMessages.flatMap((message) => imagePaths(message.images)),
        ];

        await client.$transaction(async (tx) => {
            await tx.$executeRaw`
                DELETE FROM user_app_friendship
                WHERE from_user_id = ${id} OR to_user_id = ${id}
            `;

            if (postIds.length > 0) {
                await tx.post_app_post_tags.deleteMany({ where: { post_id: { in: postIds } } });
                await tx.post_app_postimage.deleteMany({ where: { post_id: { in: postIds } } });
                await tx.post_app_postlink.deleteMany({ where: { post_id: { in: postIds } } });
                await tx.post_app_postlike.deleteMany({ where: { post_id: { in: postIds } } });
                await tx.post_app_postheart.deleteMany({ where: { post_id: { in: postIds } } });
                await tx.post_app_postview.deleteMany({ where: { post_id: { in: postIds } } });
                await tx.post_app_post.deleteMany({ where: { id: { in: postIds } } });
            }

            await tx.post_app_postlike.deleteMany({ where: { user_id: id } });
            await tx.post_app_postheart.deleteMany({ where: { user_id: id } });
            await tx.post_app_postview.deleteMany({ where: { user_id: id } });

            if (messageIds.length > 0) {
                await tx.chat_app_message_readers.deleteMany({
                    where: { message_id: { in: messageIds } },
                });
                await tx.chat_app_messageimage.deleteMany({
                    where: { message_id: { in: messageIds } },
                });
                await tx.chat_app_message.deleteMany({ where: { id: { in: messageIds } } });
            }

            await tx.chat_app_message_readers.deleteMany({ where: { user_id: id } });
            await tx.chat_app_chat_users.deleteMany({ where: { user_id: id } });

            if (albumIds.length > 0) {
                await tx.profile_app_albumimage.deleteMany({ where: { album_id: { in: albumIds } } });
                await tx.profile_app_album.deleteMany({ where: { id: { in: albumIds } } });
            }

            if (profileId) {
                await tx.profile_app_profile.delete({ where: { id: profileId } });
            }

            await tx.$executeRaw`
                DELETE FROM user_app_emailverification
                WHERE user_id = ${id}
            `;
            await tx.user_app_user_groups.deleteMany({ where: { user_id: id } });
            await tx.user_app_user_user_permissions.deleteMany({ where: { user_id: id } });
            await tx.django_admin_log.deleteMany({ where: { user_id: id } });
            await tx.user_app_user.delete({ where: { id } });
        });

        deleteMediaFiles(filesToDelete);
        deleteSignatureFile(user.profile?.signature);

        return "user deleted successfully";
    },

    updateUserStatus: async (userId: number, status: string) => {
        const db = client as any;
        const model = db.user || db.user_app_user; 

        return await model.update({
            where: { id: userId },
            data: {

                status: status, 
                last_login: status === 'offline' ? new Date() : null
            },
        });
    },
};

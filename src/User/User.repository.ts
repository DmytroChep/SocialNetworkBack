import { compare, hash } from "bcrypt";
import { client } from "../config/client";
import { Prisma } from "../generated/prisma";
import type { RepositoryContract, UserWithoutPassword } from "./User.types";
import { error } from "node:console";

type EmailVerificationRow = {
	id: number;
	user_id: number;
	code: string;
	new_email: string | null;
	expires_at: Date;
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
	const avatar = profile?.avatar
		? {
				id: profile.id,
				image: profile.avatar,
				userId: user.id,
			}
		: null;

	return {
		...user,
		authorName: user.first_name || profile?.pseudonym || null,
		userName: user.username,
		status: profile?.pseudonym ?? null,
		birthDate: profile?.birth_date ?? null,
		sign: profile?.signature ?? null,
		currentAvatarId: avatar?.id ?? null,
		currentAvatar: avatar,
		avatars: avatar ? [avatar] : [],
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
				avatar: userData.avatar ?? userData.currentAvatar?.image ?? null,
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
		profileUpdate.avatar = userData.avatar ?? userData.currentAvatar?.image;
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

			const profile = await client.profile.upsert({
				where: { user_id: id },
				update: { avatar: imagePath },
				create: {
					user_id: id,
					avatar: imagePath,
				},
			});
			return {
				id: profile.id,
				image: profile.avatar,
				userId: id,
			};
		} catch (error) {
			console.error("DB Error:", error);
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
						}
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
};

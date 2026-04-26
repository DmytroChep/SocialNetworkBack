import { compare, hash } from "bcrypt";
import { client } from "../config/client";
import { Prisma } from "../generated/prisma";
import type { RepositoryContract } from "./User.types";
import { error } from "node:console";


export const UserRepository: RepositoryContract = {
    registration: async (UserData) => {
        UserData.password = await hash(UserData.password, 10);
        const user = client.user.create({
            data: UserData,
        });

        if (
            !client.user.findUnique({
                where: { email: UserData.email },
            })
        ) {
            return "user already exists!";
        }

        return user;
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
			include: { currentAvatar: true, avatars: true, albums: true } 
		});
		if (user === null) {
			return "user not found";
		}
		return user;
	},
	updateUser: async (userData, id) => {

		if (typeof userData.password === 'string') {
			userData.password = await hash(userData.password, 10);
		}


		const user = await client.user.update({
			where: {
				id: Number(id),
			},
			data: userData,
		});

        if (!user) {
            return "user not found";
        }

		return user;
	},
	sendCodeVerify: async (code) => {
		try {
			const gmailCode = await client.gmailCode.create({ data: { code: code } });
			if (!gmailCode) {
				return "error";
			}
			return "status success";
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2024") {
					return "error code P2024";
				}
			}
			throw error;
		}
	},
	checkIsCodeExists: async (code) => {
		try {
			const gmailCode = await client.gmailCode.findUnique({
				where: { code: code },
			});
			if (!gmailCode) {
				return false;
			}
			if (gmailCode) {
				return true;
			}
			await client.gmailCode.delete({
				where: { code: code },
			});
			return gmailCode;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2024") {
					return "error code P2024";
				}
			}
			throw error;
		}
	},
	updatePassword: async (userData) => {
		const hashedPassword = await hash(userData.password, 10);
		const user = await client.user.update({
			where: {
				email: userData.email,
			},
			data: { ...userData, password: hashedPassword },
		});

		if (!user) {
			return "user not found";
		}

		return "success";
	},
    updateAvatar: async (imagePath: string, userId: string) => {
		try {
			const id = Number(userId);
			if (isNaN(id)) throw new Error("Invalid User ID");

			return await client.$transaction(async (tx) => {
				const newAvatar = await tx.userAvatar.create({
					data: {
						image: imagePath, 
						userId: id,
					},
				});

				await tx.user.update({
					where: { id: id },
					data: { currentAvatarId: newAvatar.id },
				});

				return newAvatar;
			});
		} catch (error) {
			console.error("DB Error:", error);
			return null;
		}
	},
};

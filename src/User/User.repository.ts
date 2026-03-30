import { compare, hash } from "bcrypt";
import { client } from "../config/client";
import { Prisma } from "../generated/prisma";
import type { RepositoryContract } from "./User.types";

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
		console.log(UserData);
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
		const user = await client.user.findUnique({ where: { email: UserEmail } });
		if (user === null) {
			return "user not found";
		}
		return user;
	},
	updateUser: async (userData, id) => {
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
};

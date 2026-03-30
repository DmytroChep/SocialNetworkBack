import jwt, { sign } from "jsonwebtoken";
import { ENV } from "../config/env";
import { UserRepository } from "./User.repository";
import type { Email, ServiceContract } from "./User.types";

export const UserService: ServiceContract = {
	registration: async (UserData) => {
		const user = await UserRepository.registration(UserData);

		if (typeof user === "string") {
			return user;
		}

		return jwt.sign({ email: user.email }, ENV.SECRET_KEY, {
			expiresIn: "7d",
		});
	},
	login: async (UserData) => {
		const user = await UserRepository.login(UserData);
		if (!user) {
			return "user not found";
		}
		if (typeof user === "string") {
			return user;
		}

		return jwt.sign({ email: user.email }, ENV.SECRET_KEY, {
			expiresIn: "30d",
		});
	},
	me: async (JWT) => {
		console.log(JWT);

		const email = jwt.verify(JWT, ENV.SECRET_KEY) as Email;

		const user = await UserRepository.me(email.email);

		if (typeof user === "string") {
			return user;
		}

		const { password, ...userWithoutPassword } = user;

		return userWithoutPassword;
	},
	updateUser: async (userData, id) => {
		const response = await UserRepository.updateUser(userData, id);

		return response;
	}
};

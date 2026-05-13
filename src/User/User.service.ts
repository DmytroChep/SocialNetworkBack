import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { UserRepository } from "./User.repository";
import type { Email, ServiceContract } from "./User.types";
import { sendEmail } from "../config/email";
import fs from "fs";
import path from "path";

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

        const email = jwt.verify(JWT, ENV.SECRET_KEY) as Email;

        const user = await UserRepository.me(email.email);

        if (typeof user === "string") {
            return user;
        }

        const { password, ...userWithoutPassword } = user;


        return userWithoutPassword;
    },
    updateUser: async (userData, id) => {
        const userId = Number(id)

        if (isNaN(userId)){
            return "user id must be a number"
        }

        const response = await UserRepository.updateUser(userData, userId);

		return response;
	},
	sendCodeVerify: async (gmail) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(gmail)) {
			return "invalid email format";
		}

		const code = Math.floor(100000 + Math.random() * 900000);
		console.log(gmail);
		try {
			await sendEmail(
				"hi! Here is your auth code:",
				`
                <div style="display: block; text-align: center; font-family: sans-serif;">
                    <p>your code is:</p>
                    <h1 style="font-size: 32px; color: #333; background-color: #6d6d6dff">${code}<a href="http:
                    <hr style="width: 50%; margin: 20px auto;">
                </div>`,
				`${gmail}`,
			);
		} catch (error) {
			console.log(error);
			return String(error);
		}

		const status = await UserRepository.sendCodeVerify(code);
		return status;
	},
	checkIsCodeExists: async (code) => {
		const isCodeExists = await UserRepository.checkIsCodeExists(code);

		return isCodeExists
	},
	updatePassword: async (userData) => {
		const response = await UserRepository.updatePassword(userData);

		return response;
	},
    updateAvatar: async (imagePath, userId) => {
        const response = await UserRepository.updateAvatar(imagePath, userId);

        if (!response) {
            return "error updating avatar";
        }

        return response;
    },
    allUsers: async () => {
        return await UserRepository.allUsers();
    },
};

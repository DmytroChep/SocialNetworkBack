import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { sendEmail } from "../config/email";
import { UserRepository } from "./User.repository";
import type { ServiceContract } from "./User.types";

export const parseId = (id?: string): number | null => {
    if (!id) return null;

    const parsed = Number(id);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        return null;
    }

    return parsed;
};

export const UserService: ServiceContract = {
    registration: async (userData) => {
        const user = await UserRepository.registration(userData);
        if (typeof user === "string") {
            return user;
        }
        return jwt.sign({ email: user.email }, ENV.SECRET_KEY, { expiresIn: "7d" });
    },

    login: async (userData) => {
        const user = await UserRepository.login(userData);
        if (typeof user === "string") {
            return user;
        }
        if (!user) {
            return "user doesn't exists";
        }
        return jwt.sign({ email: user.email }, ENV.SECRET_KEY, { expiresIn: "30d" });
    },

    me: async (token) => {
        const decoded = jwt.verify(token, ENV.SECRET_KEY) as { email: string };
        const user = await UserRepository.me(decoded.email);
        if (typeof user === "string") {
            return user;
        }
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    },

    updateUser: async (userData, id) => {
        const userId = parseId(id);
        if (!userId) {
            return "invalid user id";
        }
        return UserRepository.updateUser(userData, userId);
    },

    sendCodeVerify: async (userGmail) => {
        const code = String(Math.floor(100000 + Math.random() * 900000));
        const result = await UserRepository.sendCodeVerify(userGmail, code);

        if (result !== "status success") {
            return result;
        }

        await sendEmail(
            "Email verification",
            `<p>Your verification code: <b>${code}</b></p>`,
            userGmail,
        );

        return result;
    },

    checkIsCodeExists: async (email, code) => {
        return UserRepository.checkIsCodeExists(email, code);
    },

    updatePassword: async (userData) => {
        return UserRepository.updatePassword(userData);
    },

    updateAvatar: async (image, userId) => {
        return UserRepository.updateAvatar(image, userId);
    },

    userById: async (id) => {
        const userId = parseId(id);
        if (!userId) {
            return "invalid user id";
        }
        return UserRepository.userById(userId);
    },

    allUsers: async () => {
        return await UserRepository.allUsers();
    },

    deleteUser: async (id) => {
        const userId = parseId(id);
        if (!userId) return "invalid user id";

        return UserRepository.deleteUser(userId);
    },

    updateUserStatus: async (id: string, status: string) => {
        const userId = parseId(id);
        
        if (!userId) {
            return "invalid user id";
        }

        if (status !== 'online' && status !== 'offline') {
            return "invalid status";
        }

        return UserRepository.updateUserStatus(userId, status);
    },
};

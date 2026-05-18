import { UserService } from "./User.service";
import type { ControllerContract } from "./User.types";

export const UserController: ControllerContract = {
    registration: async (req, res) => {
        const body = req.body;
        const response = await UserService.registration(body);
        res.status(200).json(response);
    },

    login: async (req, res) => {
        const body = req.body;
        const response = await UserService.login(body);
        res.status(200).json(response);
    },

    me: async (req, res) => {
        const response = await UserService.me(res.locals.token);

        if (typeof response === "string") {
            res.status(400).json(response);
            return;
        }

        if (!response) {
            res.status(404).json("user not found");
            return;
        }

        res.status(200).json(response);
    },

    updateUser: async (req, res) => {
        const userData = req.body;
        const id = req.params.id;
        const response = await UserService.updateUser(userData, id);
        res.status(200).json(response);
    },

    sendCodeVerify: async (req, res) => {
        const gmail = req.query.gmail;
        if (!gmail || typeof gmail !== "string" || gmail.trim() === "") {
            res.status(400).json("not writed email");
            return;
        }

        const response = await UserService.sendCodeVerify(gmail);
        res.status(200).json(response);
    },

    checkIsCodeExists: async (req, res) => {
        const email = req.query.email;
        const code = req.query.code;

        if (typeof code !== "string" || code.trim() === "") {
            res.status(400).json("not writed code");
            return;
        }

        const response = await UserService.checkIsCodeExists(
            typeof email === "string" && email.trim() !== "" ? email : undefined,
            code,
        );
        res.status(200).json(response);
    },

    updatePassword: async (req, res) => {
        const userData = req.body;
        const response = await UserService.updatePassword(userData);
        res.status(200).json(response);
    },

    updateAvatar: async (req, res) => {
        const { imagePath, image, userId, user_id } = req.body;

        const response = await UserService.updateAvatar(
            imagePath || image,
            String(userId || user_id || ""),
        );

        if (response === "error updating avatar") {
            res.status(400).json(response);
            return;
        }
        res.status(200).json(response);
    },

    async userById(req, res) {
        const userId = req.params.userId;
        const response = await UserService.userById(userId);

        if (typeof response === "string") {
            res.status(400).json(response);
            return;
        }

        res.status(200).json(response);
    },

    allUsers: async (req, res) => {
        const response = await UserService.allUsers();
        res.status(200).json(response);
    },

    deleteUser: async (req, res) => {
        const response = await UserService.deleteUser(req.params.id);
        res.status(response === "user not found" ? 404 : 200).json(response);
    },
};

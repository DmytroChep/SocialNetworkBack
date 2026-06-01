import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";

export type User = Prisma.user_app_userGetPayload<{}>;
export type UserWithProfile = Prisma.user_app_userGetPayload<{ include: { profile: true } }>;
export type UserWithoutPassword = Omit<UserWithProfile, "password">;

export type LoginUser = {
    email: string;
    password: string;
};

export interface IUserUpdatePassword {
    password: string;
    email: string;
}

export type UpdateUser = Prisma.user_app_userUncheckedUpdateInput;

export type Email = { email: string };

export type CreateUser = Prisma.user_app_userUncheckedCreateInput & {
    profile?: any;
};

export interface RepositoryContract {
    registration: (UserData: CreateUser) => Promise<User | string>;
    login: (UserData: LoginUser) => Promise<User | string | null>;
    me: (UserEmail: string) => Promise<any | string>;
    updateUser: (userData: any, id: number) => Promise<any | string>;
    sendCodeVerify: (
        email: string,
        code: string,
        newEmail?: string,
    ) => Promise<string>;
    checkIsCodeExists: (
        email: string | undefined,
        code: string,
    ) => Promise<boolean | string>;
    updatePassword: (userData: IUserUpdatePassword) => Promise<string>;
    updateAvatar: (image: string, userId: string) => Promise<any>;
    userById: (userId: number) => Promise<any>;
    allUsers: () => Promise<UserWithoutPassword[]>;
    deleteUser: (id: number) => Promise<string>;
}

export interface ServiceContract {
    registration: (UserData: CreateUser) => Promise<string>;
    login: (UserData: LoginUser) => Promise<LoginUser | string>;
    me: (JWT: string) => Promise<UserWithoutPassword | string | null>;
    updateUser: (userData: UpdateUser, id: string) => Promise<UpdateUser | string>;
    sendCodeVerify: (userGmail: string) => Promise<string>;
    checkIsCodeExists: (
        email: string | undefined,
        code: string,
    ) => Promise<boolean | string>;
    updatePassword: (userData: IUserUpdatePassword) => Promise<string>;
    updateAvatar: (image: string, userId: string) => Promise<any | string>;
    userById: (id: string) => Promise<any | string>;
    allUsers: () => Promise<UserWithoutPassword[]>;
    deleteUser: (id: string) => Promise<string>;
}

export interface ControllerContract {
    registration: (
        req: Request<object, CreateUser | string, CreateUser, object>,
        res: Response<CreateUser | string>,
    ) => Promise<void>;
    login: (
        req: Request<object, LoginUser | string, LoginUser>,
        res: Response<LoginUser | string>,
    ) => Promise<void>;
    me: (
        req: Request<object, UserWithoutPassword, string, object, { token: string }>,
        res: Response<UserWithoutPassword | string, { token: string }>,
    ) => Promise<void>;
    updateUser: (
        req: Request<{ id: string }, UpdateUser | string, User, object>,
        res: Response<UpdateUser | string>,
    ) => Promise<void>;
    sendCodeVerify: (
        req: Request<{ gmail: string }, string, string>,
        res: Response<string>,
    ) => Promise<void>;
    checkIsCodeExists: (
        req: Request<object, string, string>,
        res: Response<boolean | string>,
    ) => Promise<void>;
    updatePassword: (
        req: Request<
            IUserUpdatePassword,
            IUserUpdatePassword | string,
            IUserUpdatePassword
        >,
        res: Response<string>,
    ) => Promise<void>;
    updateAvatar: (req: Request, res: Response) => Promise<void>;
    userById: (
        req: Request<{ userId: string }, any | string, object, object>,
        res: Response<any | string>,
    ) => Promise<void>;
    allUsers: (req: Request, res: Response) => Promise<void>;
    deleteUser: (req: Request<{ id: string }>, res: Response<string>) => Promise<void>;
}

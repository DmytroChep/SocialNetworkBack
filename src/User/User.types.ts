import type { Request, Response } from "express";
import { Prisma } from "../generated/prisma";

export type User = Prisma.UserGetPayload<{}>;
export type UserWithCurrentAvatar = Prisma.UserGetPayload<{ include: { currentAvatar: true } }>;
export type UserWithoutPassword = Omit<Prisma.UserGetPayload<{ include: { currentAvatar: true } }>, "password">;
export type LoginUser = Omit<
	Prisma.UserGetPayload<{}>,
	"firstname" | "secondName" | "avatar" | "isAdmin"
>;
export interface IUserUpdatePassword {
	password: string;
	email: string;
}

export type UpdateUser = Prisma.UserUncheckedUpdateInput;

export type Email = { email: string };

export type CreateUser = Prisma.UserUncheckedCreateInput;


export interface RepositoryContract {
	registration: (UserData: CreateUser) => Promise<CreateUser | string>;
	login: (UserData: LoginUser) => Promise<LoginUser | string | null>;
	me: (UserEmail: string) => Promise<UserWithCurrentAvatar | string>;
	updateUser: (
		userData: UpdateUser,
		id: number,
	) => Promise<UpdateUser | string>;
	sendCodeVerify: (code: number) => Promise<string>;
	checkIsCodeExists: (code: number) => Promise<boolean | string>;
	updatePassword: (userData: IUserUpdatePassword) => Promise<string>;
	updateAvatar: (image: string, userId: string) => Promise<any>;
}

export interface ServiceContract {
	registration: (UserData: CreateUser) => Promise<string>;
	login: (UserData: LoginUser) => Promise<LoginUser | string>;
	me: (JWT: string) => Promise<UserWithoutPassword | string | null>;
	updateUser: (
		userData: UpdateUser,
		id: number,
	) => Promise<UpdateUser | string>;
	sendCodeVerify: (userGmail: string) => Promise<string>;
	checkIsCodeExists: (code: number) => Promise<boolean | string>;
	updatePassword: (userData: IUserUpdatePassword) => Promise<string>;
	updateAvatar: (image: string, userId: string) => Promise<any | string>;
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
		req: Request<
			object,
			UserWithoutPassword,
			string,
			object,
			{ token: string }
		>,
		res: Response<UserWithoutPassword | string, { token: string }>,
	) => Promise<void>;
	updateUser: (
		req: Request<{ id: number }, UpdateUser | string, User, object>,
		res: Response<UpdateUser | string>,
	) => Promise<void>;
	sendCodeVerify: (
		req: Request<{ gmail: string }, string, string>,
		res: Response<string>,
	) => Promise<void>;
	checkIsCodeExists: (
		req: Request<{ code: number }, string, string>,
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
}

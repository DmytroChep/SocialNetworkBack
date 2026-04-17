import type { Request, Response } from "express";
import { Prisma } from "../generated/prisma";

export type User = Prisma.UserGetPayload<{}>;
export type UserWithoutPassword = Omit<Prisma.UserGetPayload<{}>, "password">;
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
	me: (UserEmail: string) => Promise<User | string>;
	updateUser: (
		userData: UpdateUser,
		id: number,
	) => Promise<UpdateUser | string>;
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
	updateAvatar: (req: Request, res: Response) => Promise<void>;
}

import type { Request, Response } from "express";
import { Prisma } from "../generated/prisma";

export type User = Prisma.UserGetPayload<{}>;
export type UserWithProfile = Prisma.UserGetPayload<{ include: { profile: true } }>;
export type UserWithoutPassword = Omit<UserWithProfile, "password">;

export type LoginUser = {
	email: string;
	password: string;
};

export interface IUserUpdatePassword {
	password: string;
	email: string;
}

export type UpdateUser = Prisma.UserUncheckedUpdateInput;

export type Email = { email: string };

export type CreateUser = Prisma.UserUncheckedCreateInput & {
	profile?: Prisma.ProfileUncheckedCreateNestedOneWithoutUserInput;
};


export interface RepositoryContract {
	registration: (UserData: CreateUser) => Promise<User | string>;
	login: (UserData: LoginUser) => Promise<User | string | null>;
	me: (UserEmail: string) => Promise<any | string>;
	updateUser: (
		userData: any,
		id: number,
	) => Promise<any | string>;
	sendCodeVerify: (email: string, code: string, newEmail?: string) => Promise<string>;
	checkIsCodeExists: (email: string | undefined, code: string) => Promise<boolean | string>;
	updatePassword: (userData: IUserUpdatePassword) => Promise<string>;
	updateAvatar: (image: string, userId: string) => Promise<any>;
}

export interface ServiceContract {
	registration: (UserData: CreateUser) => Promise<string>;
	login: (UserData: LoginUser) => Promise<LoginUser | string>;
	me: (JWT: string) => Promise<UserWithoutPassword | string | null>;
	updateUser: (
		userData: any,
		id: string,
	) => Promise<any | string>;
	sendCodeVerify: (userGmail: string) => Promise<string>;
	checkIsCodeExists: (email: string | undefined, code: string) => Promise<boolean | string>;
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
}

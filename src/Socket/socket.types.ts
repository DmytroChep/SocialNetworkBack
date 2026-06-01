import type { Server as HttpServer } from "node:http";
import type { Server as SocketServer, Socket } from "socket.io";

export interface SocketData {
	userId: bigint;
	email: string;
}

export type AuthenticatedSocket = Socket<any, any, any, SocketData>;
export type AppSocketServer = SocketServer<any, any, any, SocketData>;

export interface SocketManagerContract {
	socketServer: AppSocketServer | null;
	initSocketServer: (httpServer: HttpServer) => void;
}

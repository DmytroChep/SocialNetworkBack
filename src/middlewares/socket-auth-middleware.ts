import type { Socket } from "socket.io";
import { getUserFromToken, readBearerToken } from "../utils/auth-token";

export async function socketAuthMiddleware(
	socket: Socket,
	next: (err?: Error) => void,
) {
	const authToken =
		typeof socket.handshake.auth?.token === "string"
			? socket.handshake.auth.token
			: undefined;
	const headerToken =
		socket.handshake.headers.authorization ?? socket.handshake.headers.token;
	const token = readBearerToken(authToken ?? headerToken);

	const user = await getUserFromToken(token);
	if (!user) {
		next(new Error("Authentication error: invalid token"));
		return;
	}

	socket.data.userId = user.id;
	socket.data.email = user.email;
	next();
}

import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { client } from "../config/client";

export interface AuthenticatedUser {
	id: bigint;
	email: string;
}

export const readBearerToken = (value?: string | string[] | null): string | null => {
	const raw = Array.isArray(value) ? value[0] : value;
	if (!raw) return null;

	if (raw.startsWith("Bearer ")) {
		return raw.split(" ")[1] || null;
	}

	return raw;
};

export const getUserFromToken = async (
	token?: string | null,
): Promise<AuthenticatedUser | null> => {
	const finalToken = readBearerToken(token);
	if (!finalToken) return null;

	try {
		const decoded = jwt.verify(finalToken, ENV.SECRET_KEY) as { email?: string };
		if (!decoded.email) return null;

		const user = await client.user_app_user.findUnique({
			where: { email: decoded.email },
			select: { id: true, email: true },
		});

		if (!user) return null;

		const uid = typeof user.id === "bigint" ? user.id : BigInt(user.id as any);

		return { id: uid, email: user.email };
	} catch {
		return null;
	}
};

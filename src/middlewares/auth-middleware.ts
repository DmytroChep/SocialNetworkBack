import type { NextFunction, Request, Response } from "express";

export function authMiddleware(
	req: Request<{ id: number }>,
	res: Response<string, { token: string }>,
	next: NextFunction,
) {
	const token = req.headers.authorization;
	if (token === undefined) {
		res.status(401).json("request doesn't have token");
		return;
	}

	if (!token) {
		res.status(401).json("bad token");
		return;
	}

	if (token.split(" ")[0] !== "Bearer") {
		res.status(401).json("bad token");
		return;
	}

	const finalToken = token.split(" ")[1];
	if (!finalToken) {
		res.status(401).json("bad token");
		return;
	}

	res.locals.token = finalToken;
	next();
}

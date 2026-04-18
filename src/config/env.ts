import dotenv from "dotenv";
import { cleanEnv, str } from "envalid";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });
export const ENV = cleanEnv(process.env, {
	SECRET_KEY: str(),
	EMAILADRESS: str(),
	EMAILPASSWORD: str(),
	DATABASE_URL: str()
});

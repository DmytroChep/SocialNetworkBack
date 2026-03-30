import cors from "cors";
import express from "express";
import { userRouter } from "./User/User.router";

const PORT = 8000;
const HOST = "127.0.0.1";
const app = express();

app.use(express.json());

app.use(
	cors({
		origin: [`http://localhost:8000`, "http://127.0.0.1:8000"],
	}),
);

app.use(userRouter);

app.listen(PORT, HOST, () => {
	console.log(`http://${HOST}:${PORT}`);
}); 	

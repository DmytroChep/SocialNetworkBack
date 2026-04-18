import cors from "cors";
import express from "express";
import { userRouter } from "./User/User.router";

const PORT = 8000;
const HOST = "0.0.0.0"
const app = express();


app.use(express.json());

app.use(
	cors({
		origin: "*",
	}),
);

app.use(userRouter);

app.listen(PORT, HOST, () => {
	console.log(`http://${HOST}:${PORT}`);
}); 	

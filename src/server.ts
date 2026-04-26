import cors from "cors";
import express from "express";
import { userRouter } from "./User/User.router";
import { AlbumRouter } from "./Album/Album.router";
import { HashtagRouter } from "./Hashtag/Hashtag.router";
import path from "path";

const PORT = 8000;
const HOST = "0.0.0.0"
const app = express();


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(
	cors({
		origin: "*",
	}),
);

app.use('/media', express.static(path.join(__dirname, '../media')));

app.use(userRouter);
app.use(AlbumRouter);
app.use(HashtagRouter);

app.listen(PORT, HOST, () => {
	console.log(`http://${HOST}:${PORT}`);
}); 	

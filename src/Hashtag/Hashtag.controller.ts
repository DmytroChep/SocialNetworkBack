import { HashtagService } from "./Hashtag.service";
import type { ControllerContract } from "./Hashtag.types";

export const HashtagController: ControllerContract = {
	create: async (req, res) => {
		const { title } = req.body;

		if (!title) {
			res.status(400).json("title is required");
			return;
		}

		const response = await HashtagService.create({ title });

		if (typeof response === "string") {
			res.status(400).json(response);
			return;
		}

		res.status(201).json(response);
	},
	getAll: async (req, res) => {
		const response = await HashtagService.getAll();

		if (typeof response === "string") {
			res.status(400).json(response);
			return;
		}

		res.status(200).json(response);
	},
	getById: async (req, res) => {
		const id = Number(req.params.id);

		if (!id) {
			res.status(400).json("invalid hashtag id");
			return;
		}

		const response = await HashtagService.getById(id);

		if (typeof response === "string") {
			res.status(400).json(response);
			return;
		}

		if (!response) {
			res.status(404).json("hashtag not found");
			return;
		}

		res.status(200).json(response);
	},
	update: async (req, res) => {
		const id = Number(req.params.id);
		const { title } = req.body;

		if (!id) {
			res.status(400).json("invalid hashtag id");
			return;
		}

		if (!title) {
			res.status(400).json("title is required");
			return;
		}

		const response = await HashtagService.update(id, { title });

		if (typeof response === "string") {
			res.status(400).json(response);
			return;
		}

		res.status(200).json(response);
	},
	delete: async (req, res) => {
		const id = Number(req.params.id);

		if (!id) {
			res.status(400).json("invalid hashtag id");
			return;
		}

		const response = await HashtagService.delete(id);
		res.status(200).json(response);
	},
};

import axios from "axios";

export default async function (req, res) {
	const { repo } = req.query;

	console.log("Get branches: " + repo);

	try {
		const response = await axios.get(
			`https://api.github.com/rate_limit`
		);
		const limit = response.data;

		res.status(200).json(limit);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

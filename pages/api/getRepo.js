import axios from "axios";

export default async function (req, res) {
	const { repo } = req.query;
	try {
		var timeStart = new Date().getTime();
		const response = await axios.get(
			`https://api.github.com/repos/${repo}`
		);
		const repo_data = response.data;
		var timeEnd = new Date().getTime();
		console.log("Get repo: " + repo + " time: " + (timeEnd - timeStart) + "ms");

		res.status(200).json(repo_data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

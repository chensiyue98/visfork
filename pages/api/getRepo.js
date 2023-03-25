import axios from "axios";

export default async function (req, res) {
	const { repo } = req.query;

	console.log(repo);

	try {
		const response = await axios.get(
			`https://api.github.com/repos/${repo}`
		);
		const repo_data = response.data;

		// const mostStarredForks = forks
		// 	.sort((a, b) => b.stargazers_count - a.stargazers_count)
		// 	.slice(0, 10);

		res.status(200).json(repo_data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

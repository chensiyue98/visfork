import axios from "axios";

export default async function (req, res) {
	const { repo } = req.query;

	console.log("From API - " + repo);

	try {
		const response = await axios.get(
			`https://api.github.com/repos/${repo}/forks?sort=stargazers`
		);
		const forks = response.data;
		// Make a list of nodes
		const nodes = forks.map((fork) => {
			return {
				id: fork.full_name,
				parent: repo,
				created_at: fork.created_at,
				url: fork.html_url,
			};
		});

		// const net = { nodes: nodes };

		res.status(200).json(nodes);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

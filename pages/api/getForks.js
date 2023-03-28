import axios from "axios";

export default async function (req, res) {
	const { repo, url, created_at } = req.query;

	try {
		var timeStart = new Date().getTime();
		const response = await axios.get(
			`https://api.github.com/repos/${repo}/forks?sort=stargazers`
		);
		const forks = response.data;
		// TODO: 需要优化，目前是取前10个forks
		const mostStarredForks = forks.slice(0, 10);
		// Make a list of nodes
		const nodes = mostStarredForks.map((fork) => {
			return {
				id: fork.full_name,
				parent: repo,
				created_at: fork.created_at,
				url: fork.html_url,
			};
		});
		nodes.push({
			id: repo,
			parent: null,
			created_at: created_at,
			url: url,
		});
		var timeEnd = new Date().getTime();
		console.log("Get forks - time: " + (timeEnd - timeStart) + "ms");
		res.status(200).json(nodes);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

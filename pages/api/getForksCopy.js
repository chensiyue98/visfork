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
				parent: fork.parent.full_name,
				created_at: fork.created_at,
				url: fork.html_url,
			};
		});
		nodes.push({
			id: repo,
			size: 12,
			color: "blue",
		});

		// Make a list of links
		const links = forks.map((fork) => {
			return {
				source: repo,
				target: fork.full_name,
			};
		});

		// Check if the repo is a fork
		const parentRepo = await axios.get(`https://api.github.com/repos/${repo}`);
		const parentRepoData = parentRepo.data;
		const isParentRepoFork = parentRepoData.fork;
		if (isParentRepoFork) {
			const parentFork = parentRepoData.parent.full_name;
			console.log("From API - Parent Fork: " + parentFork);
			nodes.push({
				id: parentFork,
				size: 14,
				color: "yellow",
			});
			links.push({
				source: parentFork,
				target: repo,
			});
		}

		const net = { nodes: nodes, links: links };

		res.status(200).json(net);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

import axios from "axios";

export default async function (req, res) {
	const { repo, branch_sha, branch_name } = req.query;

	try {
		var query = ``;
		if (branch_sha) {
			query = `?sha=${branch_sha}`;
		}
		
		const response = await axios.get(
			`https://api.github.com/repos/${repo}/commits${query}`
		);

		const commits = response.data;

        const nodes = commits.map((commit) => {
			return {
				repo: repo,
				sha: commit.sha,
				id: commit.sha,
                // parent_sha: commit.parents[0].sha,
				// map parent shas to a array of strings
				parentIds: commit.parents.map((parent) => parent.sha),
				branch_name: branch_name,
				branch_id: branch_sha,
                node_id: commit.node_id,
                author: commit.commit.author.name,
                // Use the date from the committer, not the author
                date: commit.commit.committer.date,
                url: commit.html_url,
                message: commit.commit.message,
			};
		});

		res.status(200).json(nodes);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

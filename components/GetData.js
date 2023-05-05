import axios from "axios";
import pLimit from "p-limit";

async function getRepo(repo) {
	const response = await axios.get(`https://api.github.com/repos/${repo}`);
	const repo_data = response.data;
	return repo_data;
}

async function getForks(repo_data) {
	const repo = repo_data.full_name;
	const response = await axios.get(
		`https://api.github.com/repos/${repo}/forks?sort=stargazers`
	);
	const forks = response.data;
	// TODO: 需要优化，目前是取前10个forks
	// filter the 10 most starred forks
	const mostStarredForks = forks
		// .sort((a, b) => b.stargazers_count - a.stargazers_count)
		.slice(0, 5);
	// Map a list of nodes
	const forks_nodes = mostStarredForks.map((fork) => {
		return {
			id: fork.full_name,
			parent: repo,
			created_at: fork.created_at,
			url: fork.html_url,
		};
	});
	forks_nodes.push({
		id: repo,
		created_at: repo_data.created_at,
		url: repo_data.html_url,
	});
	return forks_nodes;
}

async function getBranches(forks) {
	const limit = pLimit(1000); // limit concurrency to 500
	const promises = forks.map((fork) =>
		limit(async () => {
			try {
				const response = await axios.get(
					`https://api.github.com/repos/${fork.id}/branches`
				);
				return response.data.map((branch) => ({
					name: branch.name,
					repo: fork.id,
					sha: branch.commit.sha,
					url: branch.commit.url,
				}));
			} catch (error) {
				console.error(`Error getting branches for fork ${fork.id}: ${error}`);
				return [];
			}
		})
	);

	const branches = await Promise.all(promises);
	return branches.flat();
}

async function getAllCommits(branches) {
	const limit = pLimit(1000); // limit concurrency to 500
	const allCommits = await Promise.all(
		branches.map((branch) =>
			limit(async () => {
				const commits = await getOneCommits(branch);
				return commits;
			})
		)
	);
	return allCommits.flat();
}

async function getOneCommits(branch) {
	var query = ``;
	if (branch.sha) {
		query = `?sha=${branch.sha}`;
	}

	const response = await axios.get(
		// `https://api.github.com/repos/${branch.repo}/commits${query}`
		`https://api.github.com/repos/${branch.repo}/commits`
	);

	const commits = response.data;

	const nodes = commits.map((commit) => {
		return {
			repo: branch.repo,
			sha: commit.sha,
			id: commit.sha,
			// parent_sha: commit.parents[0].sha,
			// map parent shas to a array of strings
			parentIds: commit.parents.map((parent) => parent.sha),
			branch_name: branch.name,
			branch_id: branch.sha,
			node_id: commit.node_id,
			author: commit.commit.author.name,
			// Use the date from the committer, not the author
			date: commit.commit.committer.date,
			url: commit.html_url,
			message: commit.commit.message,
		};
	});
	return nodes;
}

async function getOneCommitsGQL(branch) {
	const [owner, name] = branch.repo.split("/");
	const query = `
		query {
			repository(name: "${name}", owner: "${owner}") {
			  ref(qualifiedName: "${branch.name}") {
				id
				target {
				  ... on Commit {
					history(first: 30)) {
					  totalCount
					  nodes {
						oid
						id
						author {
						  name
						}
						committer {
						  date
						}
						url
						message
						parents(first: 10) {
						  edges {
							node {
							  oid
							}
						  }
						}
					  }
					}
				  }
				}
			  }
			}
		  }
	`;
	const response = await axios.post("https://api.github.com/graphql", {
		query,
	});
	const commits = response.data.data.repository.ref.target.history.nodes;
	const nodes = commits.map((commit) => {
		return {
			repo: branch.repo,
			id: commit.oid,
			parentIds: commit.parents.edges.map((parent) => parent.node.oid),
			branch_name: branch.name,
			branch_id: branch.sha,
			node_id: commit.id,
			author: commit.author.name,
			date: commit.committer.date,
			url: commit.url,
			message: commit.message,
		};
	});
	return nodes;
}

export default async function getData(repo) {
	const token = "Bearer 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";
	axios.defaults.headers.common["Authorization"] = token;

	var tempData = [];
	try {
		var timeStart = new Date().getTime();
		console.log("From getData - " + repo);

		// Get repo
		const repo_data = await getRepo(repo);
		var timeEnd = new Date().getTime();
		console.log("Done: getRepo ", timeEnd - timeStart, "ms");

		// Get forks
		// const forks = await getForksGQL(repo_data);
		const forks = await getForks(repo_data);
		timeStart = new Date().getTime();
		console.log("Done: getForks ", timeStart - timeEnd, "ms");

		// Get branches of forks
		const branches = await getBranches(forks);
		timeEnd = new Date().getTime();
		console.log("Done: getBranches ", timeEnd - timeStart, "ms");

		// Get commits of branches
		const commits = await getAllCommits(branches);
		timeStart = new Date().getTime();
		console.log("Done: getAllCommits ", timeStart - timeEnd, "ms");

		// Clean up data
		tempData = commits;
		tempData = tempData.reduce((uniqueData, item) => {
			const index = uniqueData.findIndex((t) => t.id === item.id);
			if (index === -1) {
				uniqueData.push(item);
			} else {
				uniqueData[index] = {
					...uniqueData[index],
					...item,
					parentIds: [
						...new Set([...uniqueData[index].parentIds, ...item.parentIds]),
					],
				};
			}
			return uniqueData;
		}, []);
		// 将tempData中的每一个parentIds与id匹配，如果出现不存在的parentIds，则将其parentIds修改为[]
		tempData = tempData.map((item) => {
			item.parentIds = item.parentIds.filter((parent) => {
				return tempData.some((item) => item.id === parent);
			});
			return item;
		});
		timeEnd = new Date().getTime();
		console.log("Done: clean up data ", timeEnd - timeStart, "ms");

		// Log the number of each type of data
		console.log(
			`Repo: ${repo_data.full_name}, Forks: ${forks.length}, Branches: ${branches.length}, Commits: ${commits.length}, DAG: ${tempData.length}`
		);

		return tempData;
	} catch (error) {
		throw new Error(error.message);
	}
}

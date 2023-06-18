import axios from "axios";
import pLimit from "p-limit";
import Classify from "./Regex";

async function getRepo(repo) {
	const response = await axios.get(`https://api.github.com/repos/${repo}`);
	const repo_data = response.data;
	return repo_data;
}

async function getForks(repo_data) {
	const repo = repo_data.full_name;
	// sort: stargazers, newest(default), oldest, watchers
	const response = await axios.get(
		`https://api.github.com/repos/${repo}/forks?sort=stargazers`
	);
	const forks = response.data;
	// TODO: 目前是取前10个forks
	// filter the 10 most starred forks
	const mostStarredForks = forks
		// .sort((a, b) => b.stargazers_count - a.stargazers_count)
		.slice(0, 2);
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

async function getAllCommits(branches, startDate, endDate) {
	const limit = pLimit(1000); // limit concurrency to 500
	const allCommits = await Promise.all(
		branches.map((branch) =>
			limit(async () => {
				const commits = await getOneCommits(branch, startDate, endDate);
				return commits;
			})
		)
	);
	return allCommits.flat();
}

async function getOneCommits(branch, startDate, endDate) {
	var query = ``;
	if (branch.sha) {
		query = `?sha=${branch.sha}`;
	}
	let perPage = 100; // Default 30, max 100
	let pageNr = 5; // Default 1, max 10
	
	// Format start and end date to YYYY-MM-DDTHH:MM:SSZ
	const since = new Date(startDate).toISOString();
	const until = new Date(endDate).toISOString();

	let commits = [];

	for (let i = 1; i <= pageNr; i++) {
		const response = await axios.get(
			`https://api.github.com/repos/${branch.repo}/commits?per_page=${perPage}&page=${i}&since=${since}&until=${until}`
		);
		commits = commits.concat(response.data);
	}

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
			commit_type: Classify(commit.commit.message),
			mergedNodes: [],
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

export default async function getData(repo, token, startDate, endDate) {
	// const token = "Bearer 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";
	const bearerToken = "Bearer " + token;
	axios.defaults.headers.common["Authorization"] = bearerToken;

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
		const commits = await getAllCommits(branches, startDate, endDate);
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

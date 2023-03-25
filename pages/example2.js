import React, { useState } from "react";
import Timeline from "@/components/Timeline";
import { Button, TextField, CircularProgress } from "@mui/material";
import axios from "axios";

const App = () => {
	const token = "Bearer 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";
	axios.defaults.headers.common["Authorization"] = token;
	
	const [commitData, setCommitData] = useState([]);
	const [repo, setRepo] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	async function handleSubmit(event) {
		event.preventDefault();
		try {
			// Self's commits
			setIsLoading(true);
			// const response = await fetch(`/api/getCommits?repo=${repo}`);
			// if (!response.ok) {
			// 	throw new Error(response.statusText);
			// }
			// const commits = await response.json();
			// setCommitData(commits);

			// Branches' commits
			const response_branches = await fetch(`/api/getBranches?repo=${repo}`);
			const branches = await response_branches.json();
			for (const branch of branches) {
				const response = await fetch(`/api/getCommits?repo=${repo}&branch_sha=${branch.commit.sha}&branch_name=${branch.name}`);
				const branches_commits = await response.json();
				// console.log("branches_commits", branches_commits);
				setCommitData((prev) => [...prev, ...branches_commits]);
			}
			console.log("commitData", commitData);

		} catch (error) {
			console.error(error);
			alert(error.message);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="p-10 flex flex-col items-center">
			<form onSubmit={handleSubmit} className="flex items-center child:m-3">
				<label htmlFor="inputField" >GitHub Repository URL:</label>
				<TextField
					id="outlined-basic"
					label="Owner/Repo"
					variant="outlined"
					value={repo}
					placeholder="facebook/react"
					onChange={(event) => setRepo(event.target.value)}
				/>
				<Button variant="outlined" type="submit">
					Submit
				</Button>
			</form>
			<div>{isLoading && <CircularProgress />}</div>
			<Timeline data={commitData} />
		</div>
	);
};

export default App;

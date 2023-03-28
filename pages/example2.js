import React, { useState } from "react";
import DagComponent from "@/components/DAG";
import { Button, TextField, CircularProgress } from "@mui/material";
import axios from "axios";

export default function App() {
	const token = "Bearer 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";
	axios.defaults.headers.common["Authorization"] = token;

	const [commitData, setCommitData] = useState([]);

	const [repo, setRepo] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmit, setIsSubmit] = useState(false);

	async function handleSubmit(event) {
		event.preventDefault();
		try {
			setIsLoading(true);
			const repo_data = await (await axios.get(`/api/getRepo?repo=${repo}`)).data;
			const forks = await (await axios.get(`/api/getForks?repo=${repo}&url=${repo_data.url}&time=${repo_data.created_at}`)).data;
			var branches = [];
			for (var i = 0; i < forks.length; i++) {
				branches.push(await (await axios.get(`/api/getBranches?repo=${forks[i].full_name}`)).data);
			}



			// setCommitData(response.data);
		} catch (error) {
			console.error(error);
			alert(error.message);
		} finally {
			setIsLoading(false);
			setIsSubmit(true);
		}
	}

	return (
		<div className="p-10 flex flex-col items-center">
			<form onSubmit={handleSubmit} className="flex items-center child:m-3">
				<label htmlFor="inputField">GitHub Repository URL:</label>
				<TextField
					id="standard-basic"
					size="small"
					label="Owner/Repo"
					variant="standard"
					value={repo}
					placeholder="facebook/react"
					onChange={(event) => setRepo(event.target.value)}
				/>
				<Button variant="outlined" type="submit" size="small">
					Submit
				</Button>
			</form>
			<div>{isLoading && <CircularProgress />}</div>
			{/* <div>{isSubmit && <DagComponent data={commitData} />}</div> */}
		</div>
	);
}

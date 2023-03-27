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
		var tempData = [];
		try {
			setIsLoading(true);
			const response = await axios.get(`/api/getAll?repo=${repo}`);
			console.log("response", response.data);

			setCommitData(response.data);
			// console.log("example3.js: commitData", commitData);
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
			<div>{isSubmit && <DagComponent data={commitData} />}</div>
		</div>
	);
}

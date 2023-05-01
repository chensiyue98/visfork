import React, { useState } from "react";
import DagComponent from "@/components/DAG";
import { Button, TextField, CircularProgress } from "@mui/material";
import axios from "axios";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

export default function App() {
	const token = "Bearer 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";
	axios.defaults.headers.common["Authorization"] = token;

	const [commitData, setCommitData] = useState([]);

	const [repo, setRepo] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmit, setIsSubmit] = useState(false);

	const fetcher = (url) => axios.get(url).then((res) => res.data);
	const { data: dataMutation, trigger } = useSWRMutation(
		"/api/getAll?repo=" + repo,
		fetcher,
		{
			loadingTimeout: 60000,
			errorRetryCount: 1,
		}
	);

	const handleSubmit = async (event) => {
		event.preventDefault();
		try {
			setIsLoading(true);
			const response = await axios.get(`/api/getAll?repo=${repo}`);
			setCommitData(response.data);
		} catch (error) {
			console.error(error);
			alert(error.message);
		} finally {
			setIsLoading(false);
			setIsSubmit(true);
		}
	};

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
					required
				/>
				<Button variant="outlined" type="submit" size="small">
					Submit
				</Button>
			</form>
			<div>{isLoading && <CircularProgress />}</div>
			<div>{isSubmit && <DagComponent data={commitData} />}</div>
			<button
				onClick={() => {
					trigger();
				}}
			>
				AnontherButton
			</button>
			{dataMutation &&
				dataMutation.map((item) => {
					return <div key={item.id}>{item.message}</div>;
				})}
		</div>
	);
}

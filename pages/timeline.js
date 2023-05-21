import React, { useState, useEffect } from "react";
import DagComponent from "@/components/DAG";
import { Button, TextField, CircularProgress } from "@mui/material";
import axios from "axios";
import getData from "@/components/GetData";
import Cookies from "js-cookie";

// TODO: parse url to owner/repo
// TODO: add token input and save to cookie

export default function App() {
	// const token = "Bearer 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";
	// axios.defaults.headers.common["Authorization"] = token;

	const [commitData, setCommitData] = useState([]);

	const [repo, setRepo] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmit, setIsSubmit] = useState(false);
	const [token, setToken] = useState("Bearer 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");

	useEffect(() => {
		const savedToken = Cookies.get("token");
		if (savedToken) {
		  setToken(savedToken);
		}
	  }, [token]);

	const handleSubmit = async (event) => {
		event.preventDefault();
		try {
			setIsLoading(true);
			// const response = await axios.get(`/api/getAll?repo=${repo}`);
			const response = await getData(repo);
			setCommitData(response);
			console.log("response", response);
		} catch (error) {
			console.error(error);
			alert(error.message);
		} finally {
			setIsLoading(false);
			setIsSubmit(true);
		}
	};

	const handleClick = () => {
		// download commit data as json file
		const element = document.createElement("a");
		const file = new Blob([JSON.stringify(commitData)], {
			type: "text/plain;charset=utf-8",
		});
		element.href = URL.createObjectURL(file);
		element.download = repo + "-commit_data.json";
		document.body.appendChild(element); // Required for this to work in FireFox
		element.click();
	};

	const handleUpload = async () => {
		// upload commit data from json file
		const element = document.createElement("input");
		element.type = "file";
		element.accept = ".json";
		element.onchange = async (event) => {
			const file = event.target.files[0];
			const reader = new FileReader();
			reader.readAsText(file, "UTF-8");
			reader.onload = async (readerEvent) => {
				const content = readerEvent.target.result;
				const data = JSON.parse(content);
				setCommitData(data);
				setIsSubmit(true);
			};
		};
		element.click();
	};

	// demo data from file
	const demo = require("../public/commit_data_example.json");

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
				or
				<Button
					variant="outlined"
					size="small"
					onClick={handleUpload}
					title="Upload json file exported from this site"
				>
					upload json
				</Button>
			</form>
			<div id="loading">{isLoading && <CircularProgress />}</div>
			<div id="submited">{isSubmit && <DagComponent data={commitData} />}</div>
			<div id="demo" className="border-blue-500 border-4">
				<DagComponent data={demo} />
			</div>
			{isSubmit && <button onClick={handleClick}>Download</button>}
		</div>
	);
}

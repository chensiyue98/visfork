import React, { useState, useEffect } from "react";
import DagComponent from "@/components/DAG";
import { Button, TextField, CircularProgress } from "@mui/material";
import axios from "axios";
import getData from "@/components/GetData";
import Cookies from "js-cookie";
import SettingsIcon from "@mui/icons-material/Settings";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

// TODO: parse url to owner/repo
// TODO: add token input and save to cookie
// current key: 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

export default function App() {
	// const token = "Bearer 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";
	// axios.defaults.headers.common["Authorization"] = token;

	const [commitData, setCommitData] = useState([]);

	const [repo, setRepo] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmit, setIsSubmit] = useState(false);
	const [token, setToken] = useState(
		"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"
	);

	// Menu
	const [anchorEl, setAnchorEl] = React.useState(null);
	const open = Boolean(anchorEl);
	const handleMenu = (event) => {
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};

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
			const response = await getData(repo, token);
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

	const handleSetting = () => {
		const newToken = prompt("Please enter your token", token);
		if (newToken) {
			setToken(newToken);
			Cookies.set("token", newToken);
		}
	};

	// use getLimit api to check token usage
	const handleUsage = () => {
		axios
			.get(`/api/getLimit`)
			.then((response) => {
				alert(
					`Your token has ${response.data.rate.remaining} / ${
						response.data.rate.limit
					} remaining requests.\nReset at ${new Date(response.data.rate.reset * 1000).toLocaleString()}`
				);
			})
			.catch((error) => {
				console.error(error);
				alert(error.message);
			});
	};

	// demo data from file
	const demo = require("../public/commit_data_example.json");

	return (
		<div className="p-10 flex flex-col items-center">
			<form onSubmit={handleSubmit} className="flex items-center child:m-3">
				<Button size="small" variant="outlined" onClick={handleMenu}>
					<SettingsIcon />
				</Button>
				<Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
					<MenuItem onClick={handleSetting}>Setting</MenuItem>
					<MenuItem onClick={handleUsage}>Check Token Usage</MenuItem>
				</Menu>
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

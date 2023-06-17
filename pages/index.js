import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import dayjs from 'dayjs';

import DagComponent from "@/components/DAG";
import DateRangeSlider from "@/components/RangeSlider";
import getData from "@/components/GetData";

import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import SettingsIcon from "@mui/icons-material/Settings";
import Tooltip from "@mui/material/Tooltip";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Button, TextField, CircularProgress } from "@mui/material";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

// TODO: parse url to owner/repo
// TODO: popup dialog when token is invalid or rate limit is exceeded
// current key: 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

export default function App() {
	// demo data from file
	const demo = require("../public/commit_data_example.json");
	// const demo = require("../public/simple.json");
	// const demo = require("../public/d3_d3-commit_data-p5.json");

	const [brushedDate, setBrushedDate] = useState([]);

	const [commitData, setCommitData] = useState([]);

	const [analysisData, setAnalysisData] = useState(demo);

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

	// Update API token
	useEffect(() => {
		const savedToken = Cookies.get("token");
		if (savedToken) {
			setToken(savedToken);
		}
	}, [token]);

	// Update brushed data
	useEffect(() => {
		// filter data from commitData by brushed date
		// JavaScript's Date object indexes months from 0 (January) to 11 (December). Off-by-one error may occur.
		if (demo.length > 0 && brushedDate.length > 0) {
			const brushedDatesFormatted = new Set(
				brushedDate.map(
					(date) =>
						`${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}`
				)
			);
			const filteredData = demo.filter((d) =>
				// brushedDate.includes(d3.timeMonths(d.date))
				brushedDatesFormatted.has(
					d.date.split("T")[0].slice(0, 7) || d.date.split(" ")[0]
				)
			);

			// go through each commit and check if the parentIds are in the filteredData's id
			// if not, remove the parentIds to avoid missing id error
			filteredData.forEach((commit) => {
				commit.parentIds = commit.parentIds.filter((id) =>
					filteredData.map((d) => d.id).includes(id)
				);
			});
			// if filteredData is empty, set it to demo
			if (filteredData.length === 0) {
				setAnalysisData(demo);
			} else {
				setAnalysisData(filteredData);
			}
		}
	}, [brushedDate]);

	const handleSubmit = async (event) => {
		event.preventDefault();
		try {
			setIsLoading(true);
			// const response = await axios.get(`/api/getAll?repo=${repo}`);
			const response = await getData(repo, token);
			setCommitData(response);
			// console.log("response", response);
		} catch (error) {
			// console.error(error);
			alert(error.message);
		} finally {
			setIsLoading(false);
			setIsSubmit(true);
		}
	};

	const handleDownload = () => {
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
			.get(`/api/getLimit/?token=${token}`)
			.then((response) => {
				alert(
					`Your token: ${token}\nhas ${response.data.rate.remaining} / ${
						response.data.rate.limit
					} remaining requests.\nReset at ${new Date(
						response.data.rate.reset * 1000
					).toLocaleString()}`
				);
			})
			.catch((error) => {
				// console.error(error);
				alert(error.message);
			});
	};

	const handleCreate = () => {
		// open a new tab that links to https://github.com/settings/tokens/new?description=useful-forks%20(no%20scope%20required)
		window.open(
			"https://github.com/settings/tokens/new?description=visfork%20(no%20scope%20required)"
		);
	};

	return (
		<div className="p-10 flex flex-col items-center">
			<form onSubmit={handleSubmit} className="flex items-center child:m-3">
				<Button size="small" variant="outlined" onClick={handleMenu}>
					<SettingsIcon />
				</Button>
				<span>
					<LocalizationProvider dateAdapter={AdapterDayjs}>
						<DatePicker
							label="From"
							views={["year", "month"]}
							openTo="month"
							// default value is today
							defaultValue={dayjs()}
						></DatePicker>
						<DatePicker
							label="To"
							views={["year", "month"]}
							openTo="month"
							defaultValue={dayjs().subtract(1, "year")}
						></DatePicker>
					</LocalizationProvider>
				</span>
				<Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
					<Tooltip
						title="Use your own GitHub API to retrive repositories"
						placement="right"
					>
						<MenuItem onClick={handleSetting}>Set token</MenuItem>
					</Tooltip>
					<MenuItem onClick={handleUsage}>Check token usage</MenuItem>
					<MenuItem onClick={handleCreate}>Create new token</MenuItem>
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
			<div id="range">{isSubmit && <DateRangeSlider data={commitData} />}</div>
			<div id="submited">{isSubmit && <DagComponent data={commitData} />}</div>
			<DateRangeSlider
				raw={demo}
				onSelection={(selectedDates) => {
					// console.log("Selected Date Range:", selectedDates);
					setBrushedDate(selectedDates);
				}}
			/>
			<div id="demo" className="border-blue-500 border-4">
				{/* <DagComponent data={demo} /> */}
				<DagComponent data={analysisData} />
			</div>
			{isSubmit && (
				<button onClick={handleDownload}>Download Fetched Data</button>
			)}
		</div>
	);
}

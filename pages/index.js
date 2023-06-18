import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import dayjs from "dayjs";

import DagComponent from "@/components/DAG";
import DateRangeSlider from "@/components/RangeSlider";
import getData from "@/components/GetData";

import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import SettingsIcon from "@mui/icons-material/Settings";
import SendIcon from '@mui/icons-material/Send';
import Tooltip from "@mui/material/Tooltip";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Button, TextField, CircularProgress } from "@mui/material";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SimCardDownloadIcon from '@mui/icons-material/SimCardDownload';

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
		// TODO: Change demo to commitData
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
		// check if date range is valid
		if (startDate >= endDate) {
			alert("The start date must be before the end date.");
			return;
		}
		let submitRepo = repo;
		// parse url to owner/repo
		const urlRegex =
			/^(?:https?:\/\/)?(?:www\.)?(?:github\.com\/)?([^/]+\/[^/]+)$/i;
		if (urlRegex.test(submitRepo)) {
			submitRepo = submitRepo.match(urlRegex)[1];
		}
		// check if repo is in the correct format "owner/repo"
		const regex = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
		if (!regex.test(submitRepo)) {
			alert("Please enter a valid repo in the format of 'owner/repo'");
			return;
		}
		try {
			setIsLoading(true);
			const response = await getData(repo, token, startDate, endDate);
			setCommitData(response);
		} catch (error) {
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

	const [startDate, setStartDate] = useState(dayjs().subtract(1, "year"));
	const [endDate, setEndDate] = useState(dayjs());

	return (
		<div className="p-10">
			<form onSubmit={handleSubmit} className="justify-center child:py-1.5">
				<div className="flex items-center justify-center child:px-1">
					<label htmlFor="inputField">GitHub Repository:</label>
					<TextField
						id="standard-basic"
						size="small"
						label="Owner/Repo"
						variant="outlined"
						value={repo}
						placeholder="facebook/react"
						onChange={(event) => setRepo(event.target.value)}
						required
					/>
				</div>
				<div className="flex justify-center ">
					<span>
						<LocalizationProvider dateAdapter={AdapterDayjs}>
							<DatePicker
								label="From"
								views={["year", "month"]}
								openTo="month"
								// default value is today
								value={startDate}
								onChange={(newValue) => setStartDate(newValue)}
								slotProps={{
									textField: {
										style: { width: 150, paddingRight: 10 },
										size: "small",
									},
								}}
							></DatePicker>
							<DatePicker
								label="To"
								views={["year", "month"]}
								openTo="month"
								value={endDate}
								onChange={(newValue) => setEndDate(newValue)}
								slotProps={{
									textField: { style: { width: 150 }, size: "small" },
								}}
							></DatePicker>
						</LocalizationProvider>
					</span>
				</div>
				<div className="flex items-center justify-center child:m-2">
					<Button size="small" variant="outlined" onClick={handleMenu}>
						<SettingsIcon />
					</Button>
					{/* vertical divider */}
					<div className="border-l border-gray-400 h-8"></div>
					<Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
						<Tooltip
							title="Set your own GitHub API token to retrive repositories"
							placement="right"
						>
							<MenuItem onClick={handleSetting}>Set token</MenuItem>
						</Tooltip>
						<Tooltip
							title="Check the usage limit of the current GitHub token"
							placement="right"
						>
							<MenuItem onClick={handleUsage}>Check token usage</MenuItem>
						</Tooltip>
						<Tooltip
							title="Create a new GitHub token with your account"
							placement="right"
						>
							<MenuItem onClick={handleCreate}>Create new token</MenuItem>
						</Tooltip>
					</Menu>
					<Button variant="outlined" type="submit" size="small">
						<SendIcon></SendIcon> &nbsp; Submit
					</Button>
					or
					<Button
						variant="outlined"
						size="small"
						onClick={handleUpload}
						title="Upload json file exported from this site"
					>
						<UploadFileIcon></UploadFileIcon> &nbsp; upload json
					</Button>
				</div>
			</form>
			<div id="loading" className="flex justify-center">
				{isLoading && <CircularProgress />}
			</div>
			<div id="range" className="flex justify-center">
				{isSubmit && (
					<DateRangeSlider
						raw={commitData}
						onSelection={(selectedDates) => {
							setBrushedDate(selectedDates);
						}}
					/>
				)}
			</div>
			<div id="submited" className="flex justify-center">{isSubmit && <DagComponent data={commitData} />}</div>

			<div className="flex justify-center">
				<DateRangeSlider
					raw={demo}
					onSelection={(selectedDates) => {
						setBrushedDate(selectedDates);
					}}
				/>
			</div>
			<div id="demo" className="border-blue-500 border-4 flex justify-center">
				<DagComponent data={analysisData} />
			</div>
			{isSubmit && (
				<button onClick={handleDownload}><SimCardDownloadIcon/> &nbsp; Download Fetched Data</button>
			)}
		</div>
	);
}

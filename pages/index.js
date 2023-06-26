import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import dayjs from "dayjs";

import DagComponent from "@/components/DAG";
import DateRangeSlider from "@/components/RangeSlider";
import getData from "@/components/GetData";

import dynamic from "next/dynamic";
const Tour = dynamic(() => import("../components/Tour"), { ssr: false });

import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import SettingsIcon from "@mui/icons-material/Settings";
import SendIcon from "@mui/icons-material/Send";
import Tooltip from "@mui/material/Tooltip";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Button, TextField, CircularProgress, Select } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SimCardDownloadIcon from "@mui/icons-material/SimCardDownload";
import Toolbar from "@mui/material/Toolbar";
import AppBar from "@mui/material/AppBar";
import GitHubIcon from "@mui/icons-material/GitHub";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";

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
		let data = demo;
		if (isSubmit) {
			data = commitData;
		}

		if (data.length > 0 && brushedDate.length > 0) {
			const brushedDatesFormatted = new Set(
				brushedDate.map(
					(date) =>
						`${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}`
				)
			);
			const filteredData = data.filter((d) =>
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
				setAnalysisData(data);
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
			const response = await getData(
				repo,
				token,
				startDate,
				endDate,
				numForks,
				sortForks
			);
			setCommitData(response);
			setAnalysisData(response);
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
				setAnalysisData(data);
				setIsSubmit(true);
			};
		};
		element.click();
	};

	const handleSetting = () => {
		let encryptedToken =
			token.slice(0, 5) + "*".repeat(token.length - 10) + token.slice(-5);
		const newToken = prompt(
			"Please enter your token.\nYour token will be saved locally.",
			encryptedToken
		);
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
				let encryptedToken =
					token.slice(0, 5) + "*".repeat(token.length - 10) + token.slice(-5);
				alert(
					`Your token: ${encryptedToken}\nhas ${
						response.data.rate.remaining
					} / ${
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

	const [numForks, setNumForks] = useState(5);
	const [sortForks, setSortForks] = useState("stargazers");
	const [isAdvanced, setIsAdvanced] = useState(false);
	const [rotation, setRotation] = useState(0);
	const [rotateDirection, setRotateDirection] = useState(1);

	const handleAdvanced = () => {
		setIsAdvanced(!isAdvanced);
		setRotation(rotation + 90 * rotateDirection);
		setRotateDirection(rotateDirection * -1);
	};

	return (
		<div className="p-10 bg-gray-50">
			<Tour></Tour>
			<div className="w-screen m-0">
				<AppBar position="absolute" sx={{ bgcolor: "#25292e", boxShadow: 1 }}>
					<Toolbar variant="dense" style={{ justifyContent: "space-between" }}>
						<span className="flex items-center">
							<GitHubIcon /> &nbsp; VisFork
						</span>
						<Tooltip title="Settings" placement="bottom">
							<Button
								id="settings"
								size="small"
								color="inherit"
								onClick={handleMenu}
							>
								<SettingsIcon /> &nbsp; Settings
							</Button>
						</Tooltip>
					</Toolbar>
				</AppBar>
			</div>

			<form
				onSubmit={handleSubmit}
				className="justify-center mt-16 mb-10 child:py-1.5"
			>
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
					<Button onClick={handleAdvanced}>
						{/* <KeyboardArrowRightIcon /> */}
						<KeyboardArrowRightIcon
							style={{
								transform: `rotate(${rotation}deg)`,
							}}
						/>
						Advanced
					</Button>
				</div>
				{isAdvanced && (
					// transition: show/hide advanced parameters
					<>
						{/* horizontal divider */}
						<hr className="w-1/2 -mb-2 mx-auto border-gray-400" />
						<div
							id="advanced-parameter"
							className="flex items-center justify-center"
						>
							<span className="mr-4">
								<label>Number of forks: &nbsp;</label>
								<Tooltip title="Num of forks" placement="right">
									<Select
										id="num-forks"
										size="small"
										value={numForks}
										onChange={(event) => setNumForks(event.target.value)}
									>
										{/* Menu item from 1 to 10 */}
										{[...Array(10).keys()].map((i) => (
											<MenuItem key={i} value={i + 1}>
												{i + 1}
											</MenuItem>
										))}
									</Select>
								</Tooltip>
							</span>
							<span>
								<label>Sort order: &nbsp;</label>
								<Tooltip title="Sort order" placement="right">
									<Select
										id="sort-forks"
										size="small"
										value={sortForks}
										onChange={(event) => setSortForks(event.target.value)}
									>
										<MenuItem value="stargazers">Stargazers</MenuItem>
										<MenuItem value="newest">Newest</MenuItem>
										<MenuItem value="oldest">Oldest</MenuItem>
										<MenuItem value="watchers">Watchers</MenuItem>
									</Select>
								</Tooltip>
							</span>
						</div>

						<div className="flex justify-center">
							<span className="flex items-center">
								Query Date Range: &nbsp;
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
						<hr className="w-1/2 mt-1 -mb-2 mx-auto border-gray-400" />
					</>
				)}
				<div className="flex items-center justify-center child:m-2">
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
					<Tooltip title="Submit your query">
						<Button variant="outlined" type="submit" size="small">
							<SendIcon></SendIcon> &nbsp; Submit
						</Button>
					</Tooltip>
					<span>or</span>
					<Tooltip title="Upload a JSON file exported from this site">
						<Button variant="outlined" size="small" onClick={handleUpload}>
							<UploadFileIcon /> &nbsp; upload json
						</Button>
					</Tooltip>
				</div>
			</form>
			{/* Loading */}
			<div id="loading" className="flex justify-center">
				{isLoading && <CircularProgress />}
			</div>
			{/* Date Range Slider */}
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
			{/* DAG */}
			<div id="submited" className="flex justify-center">
				{isSubmit && <DagComponent data={analysisData} />}
			</div>
			{/* DEMO */}
			{!isSubmit && (
				<>
					<div className="flex justify-center">
						<DateRangeSlider
							raw={demo}
							onSelection={(selectedDates) => {
								setBrushedDate(selectedDates);
							}}
						/>
					</div>
					<div id="demo" className="flex justify-center">
						<DagComponent data={analysisData} />
					</div>
				</>
			)}
			{isSubmit && (
				<div className="flex justify-center">
					<Button onClick={handleDownload}>
						<SimCardDownloadIcon /> &nbsp; Download Fetched Data
					</Button>
				</div>
			)}
		</div>
	);
}

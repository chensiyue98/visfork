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
			// // Branches' commits
			// const response_branches = await fetch(`/api/getBranches?repo=${repo}`);
			// const branches = await response_branches.json();
			// console.log("branches", branches);

			// var count = 0;
			// for (const branch of branches) {
			// 	const response = await fetch(
			// 		`/api/getCommits?repo=${repo}&branch_sha=${branch.commit.sha}&branch_name=${branch.name}`
			// 	);
			// 	const branches_commits = await response.json();
			// 	tempData = [...tempData, ...branches_commits];
			// 	if (count == 2) {
			// 		break;
			// 	} else {
			// 		count++;
			// 	}
			// }

			// // 去除具有重复id的数据；
			// // tempData = tempData.filter((item, index, self) => {
			// // 	return self.findIndex((t) => t.id === item.id) === index;
			// // });

			// // 合并相同id的数据
			// tempData = tempData.reduce((uniqueData, item) => {
			// 	const index = uniqueData.findIndex((t) => t.id === item.id);
			// 	if (index === -1) {
			// 		uniqueData.push(item);
			// 	} else {
			// 		uniqueData[index] = {
			// 			...uniqueData[index],
			// 			...item,
			// 			parentIds: [
			// 				...new Set([...uniqueData[index].parentIds, ...item.parentIds]),
			// 			],
			// 		};
			// 	}
			// 	return uniqueData;
			// }, []);

			// // 将tempData中的每一个parentIds与id匹配，如果出现不存在的parentIds，则将其parentIds修改为[]
			// tempData = tempData.map((item) => {
			// 	item.parentIds = item.parentIds.filter((parent) => {
			// 		return tempData.some((item) => item.id === parent);
			// 	});
			// 	return item;
			// });
			
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

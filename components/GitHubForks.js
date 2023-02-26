import React, { useState, useRef } from "react";
import * as d3 from "d3";

function GitHubForks() {
	const [repoUrl, setRepoUrl] = useState("");
	const [forks, setForks] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const chartRef = useRef(null); // Add a reference to the chart div

	function createChart(data) {
		d3.select(chartRef.current).select("svg").remove(); // Remove the previous chart
		const margin = { top: 20, right: 20, bottom: 100, left: 50 };
		const width = 600 - margin.left - margin.right;
		const height = 500 - margin.top - margin.bottom;

		const x = d3
			.scaleBand()
			.range([0, width])
			.padding(0.1)
			.domain(data.map((d) => d.full_name));

		const y = d3
			.scaleLinear()
			.range([height, 0])
			.domain([0, d3.max(data, (d) => d.stargazers_count)]);

		const svg = d3
			.select(chartRef.current)
			.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		svg
			.append("g")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(x))
			.selectAll("text")
			.attr("transform", "rotate(-45)")
			.attr("dx", "-.8em")
			.attr("dy", ".15em")
			.style("text-anchor", "end");

		svg.append("g").call(d3.axisLeft(y));

		svg
			.selectAll(".bar")
			.data(data)
			.enter()
			.append("rect")
			.attr("class", "bar")
			.attr("x", (d) => x(d.full_name))
			.attr("y", (d) => y(d.stargazers_count))
			.attr("width", x.bandwidth())
			.attr("height", (d) => height - y(d.stargazers_count));

		// Add a download button
		const svgNode = svg.node();
		const svgString = new XMLSerializer().serializeToString(svgNode);
		const imgData = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
			svgString
		)}`;
		const downloadLink = document.createElement("a");
		downloadLink.setAttribute("href", imgData);
		downloadLink.setAttribute("download", "chart.png");
		downloadLink.innerHTML = "Download chart";
		document.getElementById("download").appendChild(downloadLink);
	}

	async function handleSubmit(event) {
		event.preventDefault();
		try {
			setIsLoading(true);
			const response = await fetch(`/api/forks?repo=${repoUrl}`);
			const latestForks = await response.json();
			setForks(latestForks);
			createChart(latestForks); // Create the chart with the latest forks
		} catch (error) {
			console.error(error);
			alert(error.message);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div>
			<form onSubmit={handleSubmit}>
				<label htmlFor="inputField">GitHub Repository URL:</label>
				<input
					type="text"
					id="inputField"
					value={repoUrl}
					onChange={(event) => setRepoUrl(event.target.value)}
					defaultValue="iina/iina"
				/>
				<button type="submit">Submit</button>
			</form>
			{isLoading && <p>Loading...</p>}
			<div ref={chartRef}></div>
      <div id="chart"></div>
			<div id="download"></div>

			{forks.length > 0 && (
				<ul>
					{forks.map((fork) => (
						<li key={fork.id}>
							<a href={fork.html_url}>{fork.full_name}</a> (
							{fork.stargazers_count} stargazers)
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

export default GitHubForks;

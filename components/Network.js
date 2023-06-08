// TODO: Change color of nodes based on type of fork

import EditableGraph, { drag } from "./EditableGraph";
import React, { useState, useEffect, useRef, use } from "react";
import * as d3 from "d3";
import { Button, Slider } from "@mui/material";
import jsondata from "./test_data.json";
// const data = jsondata;

const eg = EditableGraph({ width: 1000 });

export default function Network(test_data) {
	const data = test_data.data;
	// const data = jsondata;

	const [isPlay, setPlay] = useState(false);

	const svgRef = useRef(null);
	const eg_graph = graph(eg, svgRef);

	const [dateIdx, setDateIdx] = useState(0);

	const dateGroupedData = d3.group(data, (d) => d.date);
	const dateRange = getDateRange(data);
	const authorData = authorsByDate(dateGroupedData, dateRange);
	const repoData = reposByDate(dateGroupedData, dateRange);
	const connectionData = connectionsByDate(dateGroupedData, dateRange);

	useEffect(() => {
		var nodes = repoData[dateIdx].concat(authorData[dateIdx]);
		var links = connectionData[dateIdx].map((d) => ({
			source: d[0].split(" | ")[0],
			target: d[0].split(" | ")[1],
			count: d[1],
		}));
		var graphData = { nodes, links };
		updateGraph(eg, graphData);
	}, [dateIdx]);

	useEffect(() => {
		if (isPlay) {
			const interval = setInterval(() => {
				if (dateIdx < dateRange.length - 1) {
					setDateIdx(dateIdx + 1);
				} else {
					setPlay(false);
				}
			}, 500);
			return () => clearInterval(interval);
		}
	}, [isPlay, dateIdx]);

	const handleSliderChange = (event, newValue) => {
		setDateIdx(newValue);
		setPlay(false);
	};
	const handleButtonClick = () => {
		if (isPlay) {
			setPlay(false);
		} else {
			setPlay(true);
		}
	};

	return (
		<div className="p-10 flex flex-col items-center">
			<h1 className="text-xl">Network Graph</h1>
			{dateRange && (
				<>
					<Slider
						value={dateIdx}
						onChange={handleSliderChange}
						step={1}
						max={dateRange.length - 1}
					/>
					<label>
						{dateRange[dateIdx].toLocaleDateString("en-US", {
							month: "long",
							day: "numeric",
							year: "numeric",
						})}
					</label>
					<Button
						variant="outlined"
						className="m-5"
						onClick={handleButtonClick}
					>
						{isPlay ? "Pause" : "Play"}
					</Button>
					<div className="border border-solid border-blue-500">
						<svg ref={svgRef}></svg>
					</div>
				</>
			)}
		</div>
	);
}

///////////////////////////////////////////////////////////////////////////////////////

// DATA PROCESSING FUNCTIONS

function authorsByDate(dateGroupedData, dateRange) {
	const dateArray = [];
	var cumulativeData = new Map();
	dateRange.forEach((date) => {
		dateArray.push(cumulativeData);
		cumulativeData = new Map(cumulativeData);
		const currentData = dateGroupedData.get(date.toISOString()) || [];
		currentData.forEach((datum) => {
			const key = datum.author;
			if (!cumulativeData.has(key)) {
				cumulativeData.set(key, 0);
			}
			cumulativeData.set(key, cumulativeData.get(key) + 1);
		});
	});
	return dateArray.map((d) =>
		Array.from(d).map((t) => ({ id: t[0], type: "author", count: t[1] }))
	);
}

function reposByDate(dateGroupedData, dateRange) {
	console.log(dateGroupedData);
	const dateArray = [];
	let cumulativeData = new Map();
	dateRange.forEach((date) => {
		console.log(date.toISOString());
		dateArray.push(cumulativeData);
		cumulativeData = new Map(cumulativeData);
		const currentData = dateGroupedData.get(date.toISOString()) || [];
		// if(currentData.length > 0) console.log(currentData);
		currentData.forEach((datum) => {
			const key = datum.repo;
			if (!cumulativeData.has(key)) {
				cumulativeData.set(key, 0);
			}
			cumulativeData.set(key, cumulativeData.get(key) + 1);
		});
	});
	return dateArray.map((d) =>
		Array.from(d).map((t) => ({ id: t[0], type: "repo", count: t[1] }))
	);
}

function connectionsByDate(dateGroupedData, dateRange) {
	const dateArray = [];
	let cumulativeData = new Map();
	dateRange.forEach((date) => {
		dateArray.push(cumulativeData);
		cumulativeData = new Map(cumulativeData);
		const currentData = dateGroupedData.get(date.toISOString()) || [];
		currentData.forEach((datum) => {
			const key = datum.author + " | " + datum.repo;
			if (!cumulativeData.has(key)) {
				cumulativeData.set(key, 0);
			}
			cumulativeData.set(key, cumulativeData.get(key) + 1);
		});
	});
	return dateArray.map((d) => Array.from(d));
}

function getDateRange(data) {
	const dateRange = d3.extent(data, (d) => new Date(d.date));
	let currentDate = new Date(dateRange[0]);
	currentDate.setHours(0);
	currentDate.setMinutes(0);
	currentDate.setSeconds(0);
	const dateList = [];
	while (currentDate < dateRange[1]) {
		dateList.push(new Date(currentDate));
		currentDate.setDate(currentDate.getDate() + 1);
	}
	return dateList;
}

///////////////////////////////////////////////////////////////////////////////////////

// GRAPH FUNCTIONS

function graph(eg, svgRef) {
	const { nodes, links } = eg.data();
	const simulation = eg.simulation();

	var mode = "Repo";

	let transform = d3.zoomIdentity;
	transform.k = 3;

	function zoomed(event) {
		transform = event.transform;
		zoomG.attr("transform", transform);
	}

	d3.select(svgRef.current).selectAll("*").remove();

	const svg = d3
		.select(svgRef.current)
		.attr("width", eg.width())
		.attr("height", eg.height())
		.append("svg")
		.attr("viewBox", [
			-eg.width() / 2,
			-eg.height() / 2,
			eg.width(),
			eg.height(),
		])
		.call(d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed))
		.style("margin-left", "-14px");

	const zoomG = svg.append("g").attr("transform", transform);

	const linksGroup = zoomG.append("g"),
		nodesGroup = zoomG.append("g");

	let emptyMessage = zoomG
		.append("text")
		.attr("font-size", eg.width() < 650 ? 4 : 10)
		.attr("opacity", 0.5)
		.attr("text-anchor", "middle")
		.text("Move slider to start");

	let link = null;
	let node = null;

	eg.onUpdate(() => {
		if (nodes.length != 0) {
			emptyMessage.attr("display", "none");
		}

		link = linksGroup
			.selectAll("line")
			.data(links)
			.join("line")
			.attr("stroke", "#999")
			.attr("stroke-opacity", 0.6)
			.attr("stroke-width", (d) => Math.sqrt(Math.sqrt(d.count)));

		node = nodesGroup
			.selectAll("g")
			.data(nodes)
			.join("g")
			.call(drag(simulation))
			.on("click", (event, data) => {
				console.log(event, data);
				// if (event.metaKey) {
				// 	window.open(getURL(data), "_blank");
				// }
			});

		node.html("");

		if (mode == "Shapes") {
			node
				.filter((d) => d.type == "repo")
				.append("rect")
				.attr("stroke", "#fff")
				.attr("stroke-width", 1)
				.attr("width", 10)
				.attr("height", 10)
				.attr("transform", (d) => `translate(${[-5, -5]})`)
				.attr("fill", "salmon");

			node
				.filter((d) => d.type == "author")
				.append("circle")
				.attr("stroke", "#fff")
				.attr("stroke-width", 1)
				.attr("r", 5)
				.attr("fill", "CornflowerBlue");
		} else {
			const text = node.append("text");
			const textBBoxDims = {};
			const textSize = 5;

			text
				.selectAll("tspan")
				.data((d) => d.id.split(" ").filter((d) => d))
				.join("tspan")
				.attr("fill", "#fff")
				.attr("text-anchor", "middle")
				.attr("alignment-baseline", "middle")
				.style("font", `${textSize}px sans-serif`)
				.attr("x", 0)
				.attr("y", (_, i, n) => -textSize * (n.length / 2 - i - 0.5))
				.text((d) => d);

			const padding = 2;
			node
				.append("rect")
				.each(function (d, i) {
					if (!textBBoxDims[d.id]) {
						textBBoxDims[d.id] = getBBox(text.filter((_, i2) => i == i2));
					}
					setRect(d3.select(this), textBBoxDims[d.id], padding);
				})
				.attr("rx", 1)
				.attr("fill", (d) => (d.type == "repo" ? "DarkSlateGray" : "SlateGray"))
				.attr("opacity", 0.8)
				.lower();
		}

		node.append("title").text((d) => d.id);
	});

	simulation.on("tick", () => {
		link
			.attr("x1", (d) => d.source.x)
			.attr("y1", (d) => d.source.y)
			.attr("x2", (d) => d.target.x)
			.attr("y2", (d) => d.target.y);

		node.attr("transform", (d) => `translate(${[d.x, d.y]})`);
	});

	simulation.restart();

	return svg.node();
}

function updateGraph(eg, graphData) {
	const currentData = eg.data();
	if (
		currentData.nodes.length != graphData.nodes.length ||
		currentData.links.length != graphData.links.length
	) {
		eg.changeData(graphData);
	}
}

// https://observablehq.com/@rlesser/automatic-getbbox
function getBBox(elt) {
	const clonedElt = elt.clone(true);
	const svg = d3.create("svg");
	svg.node().appendChild(clonedElt.node());
	document.body.appendChild(svg.node());
	const { x, y, width, height } = clonedElt.node().getBBox();
	document.body.removeChild(svg.node());
	return { x, y, width, height };
}
function setRect(rect, dims, padding = 0) {
	rect
		.attr("x", dims.x - padding / 2)
		.attr("y", dims.y - padding / 2)
		.attr("width", dims.width + padding)
		.attr("height", dims.height + padding);
}
const getURL = (node) => {
	if (node.type == "author") {
		return `https://github.com/search?type=users&q=${node.id.replace(
			" ",
			"+"
		)}`;
	} else {
		return `https://github.com/d3/${node.id}`;
	}
};

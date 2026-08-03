import React, { useRef, useEffect, useState, use } from "react";
import * as d3 from "d3";
import * as d3dag from "d3-dag";
// import { getParentCounts } from "d3-dag/dist/dag/utils";
import { generateWordStats } from "./MessageCloud";

import MessageCloud from "./MessageCloud";
import { parseData, SankeyChart } from "./Sankey";
import Network from "./Network";
import labella from "labella";

import Paper from "@mui/material/Paper";
import { Button, textFieldClasses } from "@mui/material";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import Modal from "@mui/material/Modal";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import TroubleshootIcon from "@mui/icons-material/Troubleshoot";
import ShareIcon from "@mui/icons-material/Share";
import CategoryIcon from "@mui/icons-material/Category";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

// TODO: Add tags display support
// TODO: sankey chart color matching
// Pannable Chart (https://observablehq.com/@d3/pannable-chart)
// D3-DAG example notebook for doing performance analysis (https://observablehq.com/d/71168767dcb492be)

const DagComponent = ({ data }) => {
	const svgRef = useRef(null);
	const viewportRef = useRef(null);
	const overviewRef = useRef(null);
	const overviewWindowRef = useRef(null);
	// const zoomButtonRef = useRef(null);

	const [grouping, setGrouping] = useState("none");
	const [isSuccess, setIsSuccess] = useState(false);

	const [selectList, setSelectList] = useState([]);
	const [selectMessage, setSelectMessage] = useState("empty");
	const [networkData, setNetworkData] = useState([]);

	const [groupedData, setGroupedData] = useState([]);

	useEffect(() => {
		var startTimer = new Date().getTime();

		// clear the previous render
		d3.select(svgRef.current).selectAll("*").remove();

		// sort the data by date
		const sortedData = [...data].sort((a, b) => {
			return new Date(a.date) - new Date(b.date);
		});

		let dag = null;

		try {
			dag = d3dag.dagStratify()(sortedData);
		} catch (err) {
			setIsSuccess(false);
			alert("Error: Please check if the repository is PUBLIC");
			console.log(err);
			return;
		}
		setIsSuccess(true);

		// var dag = d3dag.dagStratify()(data);

		if (grouping === "none") {
			dag = d3dag.dagStratify()(sortedData);
		} else if (grouping === "month") {
			dag = d3dag.dagStratify()(groupNodes(sortedData));
		}

		// console.log("dag: ", dag);
		// console.log("dag.descendants(): ", dag.descendants());

		const nodeRadius = 6;
		const edgeRadius = 3;

		const gridTweak = (layout) => (dag) => {
			// Tweak allows a basis interpolation to curve the lines
			// We essentially take the three point lines and make them five, with two points on either side of the bend
			const { width, height } = layout(dag);
			for (const { points } of dag.ilinks()) {
				const [first, middle, last] = points;
				if (last !== undefined) {
					points.splice(
						0,
						3,
						first,
						{
							x: middle.x + Math.sign(first.x - middle.x) * nodeRadius,
							y: middle.y,
						},
						middle,
						{
							x: middle.x,
							y: middle.y + nodeRadius,
						},
						last
					);
				}
			}
			return {
				width,
				height,
			};
		};

		const gridCompact = (layout) => (dag) => {
			// Tweak to render compact grid, first shrink x width by edge radius, then expand the width to account for the loss
			const baseLayout = layout.nodeSize([
				nodeRadius + edgeRadius * 5,
				(nodeRadius + edgeRadius) * 2,
			]);
			const { width, height } = baseLayout(dag);
			for (const node of dag) {
				node.x += nodeRadius;
			}
			for (const { points } of dag.ilinks()) {
				for (const point of points) {
					point.x += nodeRadius;
				}
			}
			// return { width: width +  2 * nodeRadius, height: height };
			return {
				width: width + 10 * nodeRadius,
				height: height + 10 * nodeRadius,
			};
		};

		const arrayEq = (left, right) =>
			left.length === right.length
				? left.every((v, i) => v === right[i])
				: false;

		const leftLane = (nodes) => {
			for (const node of nodes) {
				node.x = undefined;
			}
			let lane = 0;
			let prev = undefined;
			const parents = new Map(nodes.map((n) => [n, []]));
			for (const node of nodes) {
				// If the node's parent has different children than the node, the node is assigned the next lane
				if (prev !== undefined && !arrayEq(parents.get(node), [prev])) {
					lane++;
				}

				node.x = lane;
				for (const child of node.ichildren()) {
					parents.get(child).push(node);
				}
				prev = node;
			}
		};

		// let lanes = assignLane(data);
		let grid = d3dag.grid().rank((node) => node.data.date);
		// .lane(leftLane);
		const layout = gridTweak(gridCompact(grid));

		const { width, height } = layout(dag);

		const svgSelection = d3.select(svgRef.current);
		svgSelection.attr("id", "svgSelection");
		svgSelection.attr("role", "img");
		svgSelection.attr("aria-label", "Commit lineage across repository forks");
		// svgSelection.attr("viewBox", [0, 0, width, height].join(" "));
		svgSelection.attr("width", height);
		svgSelection.attr("height", width);

		const brush = d3
			.brush()
			.on("start", brushStart)
			.on("brush", brushed)
			.on("end", brushEnd);

		const graph = svgSelection
			.append("g")
			.attr("id", "graph")
			// reverse x and y for horizontal layout
			.attr("width", height)
			.attr("height", width);
		// centerize the graph in svgSelection
		// .attr("transform", `translate(0, ${(300 - width) / 2})`);

		graph.call(brush);

		const defs = graph.append("defs"); // For gradients

		const repoNames = [...new Set(data.map((d) => d.repo))];
		// const steps = dag.size();
		const steps = repoNames.length;
		const colorMap = new Map();

		for (const [i, repo] of repoNames.entries()) {
			colorMap.set(repo, d3.interpolateRainbow(i / steps));
		}

		// How to draw edges
		const line = d3
			.line()
			.curve(d3.curveCatmullRom)
			// reverse x and y for horizontal layout
			.y((d) => d.x)
			.x((d) => d.y);

		// Plot edges
		graph
			.append("g")
			.selectAll("path")
			.data(dag.links())
			.enter()
			.append("path")
			.attr("d", ({ points }) => line(points))
			.attr("fill", "none")
			.attr("stroke-width", 2)
			.attr("stroke", ({ source, target }) => {
				// encodeURIComponents for spaces, hope id doesn't have a `--` in it
				const gradId = encodeURIComponent(
					`${source.data.id}--${target.data.id}`
				);
				const grad = defs
					.append("linearGradient")
					.attr("id", gradId)
					.attr("gradientUnits", "userSpaceOnUse")
					.attr("x1", source.x)
					.attr("x2", target.x)
					.attr("y1", source.y)
					.attr("y2", target.y);
				grad
					.append("stop")
					.attr("offset", "0%")
					.attr("stop-color", colorMap.get(source.data.repo));
				grad
					.append("stop")
					.attr("offset", "100%")
					.attr("stop-color", colorMap.get(target.data.repo));
				return `url(#${gradId})`;
			});

		// Select nodes
		const nodes = graph
			.append("g")
			.selectAll("g")
			.data(dag.descendants())
			.enter()
			.append("g")
			// reverse x and y for horizontal layout
			.attr("transform", ({ y, x }) => `translate(${y}, ${x})`);

		// for each node, if mergedNodes length > 0, draw a rect
		// else draw a circle with radius nodeRadius
		nodes
			.append("path")
			.attr("d", (n) => {
				if (n.data.mergedNodes.length > 0) {
					return `M${-nodeRadius},${-nodeRadius}h${nodeRadius * 2}v${
						nodeRadius * 2
					}h${-nodeRadius * 2}Z`;
				} else {
					return d3
						.symbol()
						.type(d3.symbolCircle)
						.size(nodeRadius * 15)();
				}
			})
			.attr("fill", (n) => colorMap.get(n.data.repo));

		// Add mouseover events
		nodes
			.on("mouseover", (event, d) => {
				d3.select(event.currentTarget)
					.select("circle")
					.attr("r", nodeRadius * 1.5);
				tooltip
					.transition()
					.duration(300)
					.style("display", "block")
					.style("opacity", 0.9);
				tooltip
					.html(
						`<p>Repo: ${d.data.repo}</p>
						<p>Branch: ${d.data.branch_name}</p>
						<p>Commit: ${d.data.id}</p>
						<p>Date: ${d.data.date}</p>`
					)
					.style("background-color", (n) =>
						d3.color(colorMap.get(d.data.repo)).copy({
							opacity: 0.5,
						})
					)
					// .style("border-color", "black")
					// .style("border-width", "1px")
					// .style("border-style", "solid")
					.style("border-radius", "5px")
					// backdrop-blur-md
					.style("box-shadow", "0 0 5px black")
					.style("backdrop-filter", "blur(2px)")
					.style("-webkit-backdrop-filter", "blur(2px)")
					.style("padding", "5px")
					.style("left", `${event.pageX - 200}px`)
					.style("top", `${event.pageY - 120}px`);
			})
			.on("mouseout", (event, d) => {
				tooltip.transition().duration(300).style("display", "none");
				d3.select(event.currentTarget).select("circle").attr("r", nodeRadius);
			})
			.on("click", (event, d) => {
				window.open(`${d.data.url}`);
			});

		d3.selectAll("body > .dag-tooltip").remove();
		const tooltip = d3
			.select("body")
			.append("div")
			.attr("class", "tooltip dag-tooltip")
			.style("opacity", 0)
			.style("position", "absolute");


		const monthMap = mergeMonth(dag);
		let earliestNodes = [];
		// for each month in monthMap, find the earliest
		for (let [key, nodes] of monthMap) {
			// console.log(key, nodes);
			let earlist = nodes[0];
			for (let node of nodes) {
				if (node.data.date < earlist.data.date) {
					earlist = node;
				}
			}
			earliestNodes.push(earlist);
		}

		// for each node in earliestNodes, draw a label below it
		let preNode = earliestNodes[0];
		const labelStride = Math.max(1, Math.ceil(earliestNodes.length / 12));
		for (let [i, node] of earliestNodes.entries()) {
			if (i % labelStride !== 0 && i !== earliestNodes.length - 1) continue;
			const nodeDate = new Date(node.data.date);
			let text = graph
				.append("text")
				.attr("x", node.y)
				.attr("y", width)
				.attr("dy", "-10px")
				.attr("text-anchor", "middle")
				.attr("font-size", "10px")
				.attr("fill", "black")
				.text(
					// node.data.date.split("-")[0] + "-" + node.data.date.split("-")[1]
					// node.data.date to month
					i === 0 || nodeDate.getMonth() === 0
						? nodeDate.toLocaleString("default", { month: "short", year: "numeric" })
						: nodeDate.toLocaleString("default", { month: "short" })
				);
			// add a line from the node to the label
			let line = graph
				.append("line")
				.attr("x1", node.y)
				.attr("y1", 0)
				.attr("x2", node.y)
				.attr("y2", width - 20)
				.attr("stroke", "grey")
				.attr("stroke-dasharray", "5,5")
				.attr("stroke-width", "1px");

			preNode = node;
		}

		// allow user using draging to draw a rectangle and log the selected nodes
		var brushSelection = [];

		function brushStart(event) {
			if (event.sourceEvent.type !== "end") {
				brushSelection = [];
			}
		}

		function brushed(event) {
			if (event.sourceEvent.type !== "end") {
				brushSelection = d3.brushSelection(this);
			}
		}

		function brushEnd(event) {
			if (event.sourceEvent.type === "mouseup") {
				brushSelection = d3.brushSelection(this);
				if (brushSelection) {
					// get the selected nodes
					const selectedNodes = nodes.filter((node) => {
						const y = node.x + nodeRadius;
						const x = node.y + nodeRadius;
						return (
							x >= brushSelection[0][0] &&
							x <= brushSelection[1][0] &&
							y >= brushSelection[0][1] &&
							y <= brushSelection[1][1]
						);
					});
					// highlight the selected nodes
					svgSelection.selectAll("circle").attr("fill", (d) => {
						// go through the selected nodes
						for (let i = 0; i < selectedNodes._groups[0].length; i++) {
							if (d === selectedNodes._groups[0][i].__data__) {
								return "red";
							}
						}
						return colorMap.get(d.data.repo);
					});

					// display the selected nodes in the selected nodes list
					let selectArray = [];
					selectedNodes._groups[0].forEach((g) => {
						selectArray.push({
							repo: g.__data__.data.repo,
							author: g.__data__.data.author,
							date: g.__data__.data.date,
							message: g.__data__.data.message,
							mergedNodes: g.__data__.data.mergedNodes,
							url: g.__data__.data.url,
							hash: g.__data__.data.id,
						});
					});
					setSelectList(selectArray);
				}
			}
		}

		// display legends for the colors in #dag-legend
		const legend = d3.select("#dag-legends");
		legend.selectAll("div").remove();
		colorMap.forEach((value, key) => {
			let div = legend
				.append("div")
				.style("display", "flex")
				.style("align-items", "center");
			// append a circle to this div
			div
				.append("svg")
				.attr("width", 10)
				.attr("height", 10)
				.append("circle")
				.attr("cx", 5)
				.attr("cy", 5)
				.attr("r", 5)
				.attr("fill", value);
			// append a text to this div
			div
				.append("text")
				.text(key)
				.style("display", "inline-block")
				.style("font-size", "0.8em")
				.style("margin-left", "10px");
		});

		// Build a compact, desaturated navigator for long histories. It mirrors the
		// graph geometry without duplicating labels, brushes, or gradient IDs.
		const overview = overviewRef.current;
		const viewport = viewportRef.current;
		const overviewWindow = overviewWindowRef.current;
		if (overview && viewport && overviewWindow) {
			overview.replaceChildren();
			const clone = svgRef.current.cloneNode(true);
			clone.removeAttribute("id");
			clone.setAttribute("viewBox", `0 0 ${height} ${width}`);
			clone.setAttribute("preserveAspectRatio", "none");
			clone.setAttribute("width", "100%");
			clone.setAttribute("height", "64");
			clone.setAttribute("aria-hidden", "true");
			clone.querySelectorAll("defs, text, .overlay, .selection, .handle").forEach((element) => element.remove());
			clone.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
			clone.querySelectorAll("path").forEach((path) => {
				const stroke = path.getAttribute("stroke");
				if (stroke && stroke !== "none") path.setAttribute("stroke", "#8ca0b1");
				const fill = path.getAttribute("fill");
				if (fill && fill !== "none") path.setAttribute("fill", "#1769e0");
			});
			overview.appendChild(clone);

			const updateOverviewWindow = () => {
				const widthRatio = Math.min(1, viewport.clientWidth / viewport.scrollWidth);
				const leftRatio = viewport.scrollWidth > viewport.clientWidth
					? viewport.scrollLeft / viewport.scrollWidth
					: 0;
				overviewWindow.style.width = `${widthRatio * 100}%`;
				overviewWindow.style.left = `${leftRatio * 100}%`;
			};
			updateOverviewWindow();
			viewport.addEventListener("scroll", updateOverviewWindow, { passive: true });
			window.addEventListener("resize", updateOverviewWindow);
			var removeNavigatorListeners = () => {
				viewport.removeEventListener("scroll", updateOverviewWindow);
				window.removeEventListener("resize", updateOverviewWindow);
			};
		}

		// console.log("selected nodes: ", selectList);

		var endTimer = new Date().getTime();
		console.log("From DAG.js - Render Time: " + (endTimer - startTimer) + "ms");
		return () => {
			tooltip.remove();
			if (typeof removeNavigatorListeners === "function") removeNavigatorListeners();
		};
	}, [data, grouping]);

	// draw sankey diagram (repo -> commit_type) when data is updated
	useEffect(() => {
		if (!isSuccess) {
			return;
		}
		const sankeyData = parseData(data);
		// console.log("sankeyData: ", sankeyData);
		const nodeSet = new Set();
		const links = [];
		sankeyData.forEach((d) => {
			// nodes are the unique repos and commit types
			// format: {name: "repo_name"} or {name: "commit_type"}
			// create a set to store the unique nodes
			nodeSet.add(d.name);
			nodeSet.add(d.type);

			// links are the connections between repos and commit types
			links.push({
				source: d.name,
				target: d.type,
				value: d.count,
			});
		});

		const chart = SankeyChart(
			{
				links: links,
			},
			{
				nodeGroup: (d) => d.id.split(/\W/)[0],
			}
		);
		// remove the previous chart
		d3.select("#sankey-diagram").selectAll("*").remove();
		// chart is an svg element, append it to the div
		d3.select("#sankey-diagram").append(() => chart);
	}, [data, isSuccess]);

	// Network Graph
	useEffect(() => {
		// map author and repo data from the data into {"author": "name", "repo": "name"}
		const n = data.map((d) => {
			// keep the date and remove the time from the date
			let date = d.date.split("T")[0];
			// format the date from "2023-01-01" to "2023-01-01T00:00.000Z"
			// Protential bug: the time is hard coded to 00:00.000Z
			date = date + "T00:00:00.000Z";

			return {
				author: d.author,
				repo: d.repo,
				date: date,
			};
		});
		setNetworkData(n);
	}, [data]);
	// console.log("network_data: ", networkData);

	function handleGrouping(event, newGrouping) {
		if (newGrouping !== null) {
			setGrouping(newGrouping);
		}
	}

	function handleOverviewClick(event) {
		const viewport = viewportRef.current;
		if (!viewport) return;
		const bounds = event.currentTarget.getBoundingClientRect();
		const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
		viewport.scrollTo({
			left: ratio * viewport.scrollWidth - viewport.clientWidth / 2,
			behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
		});
	}

	const [openModal, setOpenModal] = React.useState(false);
	const handleOpen = () => {
		setOpenModal(true);
		if (selectList.length > 0) {
			// concate the commit messages of the selected nodes, remove line breaks
			const commitMessages = selectList.reduce((acc, cur) => {
				console.log("cur: ", cur.message);
				return acc + cur.message + " ";
			}, "");
			let newMessages = "";
			if (commitMessages.length > 0) {
				newMessages = commitMessages.replace(/(\r\n|\n|\r)/gm, " ");
				newMessages = newMessages.replace(
					/[.,\/#!$%\^&\*;:{}=\-_`~()'"\[\]]/g,
					""
				);
				// remove extra spaces
				newMessages = newMessages.replace(/\s{2,}/g, " ");
			}
			setSelectMessage(newMessages);
		} else {
			setSelectMessage("");
		}
	};
	const handleClose = () => setOpenModal(false);

	return (
		<div id="dag" className="dag-stack">
			<Paper elevation={0} className="dag-card">
				<div className="chart-title-row dag-title">
					<div><strong>Fork evolution map</strong><span>Circles are commits; squares contain collapsed commits. Repository colors stay consistent within this view.</span></div>
					<span>Drag to select · Click a node to open GitHub</span>
				</div>
				<div id="merge-buttons" className="">
					<ToggleButtonGroup
						value={grouping}
						exclusive
						onChange={handleGrouping}
						color="primary"
						size="small"
						className="flex items-center justify-center"
					>
						<ToggleButton value="none" title="Display every commit">
							<WorkspacesIcon /> &nbsp; All commits
						</ToggleButton>
						<ToggleButton value="month" title="Collapse linear commit sequences">
							<GroupWorkIcon /> &nbsp; Collapse linear history
						</ToggleButton>
					</ToggleButtonGroup>
				</div>
				{/* <div ref={zoomButtonRef} className="absolute top-0 z-10" /> */}{" "}
				<div
					id="overflow-container"
					className="dag-viewport"
					ref={viewportRef}
				>
					<svg ref={svgRef} />
				</div>
				<div className="dag-navigator-block">
					<div className="navigator-label"><span>History navigator</span><span>Click anywhere to jump</span></div>
					<div className="dag-navigator" onClick={handleOverviewClick} role="button" tabIndex={0} aria-label="Navigate the full commit history" onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") handleOverviewClick({ currentTarget: event.currentTarget, clientX: event.currentTarget.getBoundingClientRect().left }); }}>
						<div className="dag-navigator-graph" ref={overviewRef} />
						<div className="dag-navigator-window" ref={overviewWindowRef} />
					</div>
				</div>
				<div className="legend-heading"><span>Repositories</span><span>Color identifies the repository owning each commit</span></div>
				<div id="dag-legends">{/* Legends */}</div>
			</Paper>
			<div className="selection-card">
				<div className="chart-title-row"><div><strong>Selected commits</strong><span>Drag a rectangle over the evolution map to populate this table.</span></div><span>{selectList.length} selected</span></div>
				<TableContainer className="selection-table">
					<Table sx={{ minWidth: 800 }} size="small" aria-label="simple table">
						<TableHead>
							<TableRow className="child:font-extrabold">
								<TableCell style={{ width: "20%" }} align="left">
									Owner/Repo
								</TableCell>
								<TableCell style={{ width: "10%" }} align="left">
									Author
								</TableCell>
								<TableCell style={{ width: "17%" }} align="left">
									Commit Date
								</TableCell>
								<TableCell style={{ width: "48%" }} align="left">
									Commit Message
								</TableCell>
								<TableCell style={{ width: "5%" }} align="center">
									Hash
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{selectList.length === 0 && (
								<TableRow><TableCell colSpan={5} align="center" className="empty-table">No commits selected yet. Drag across nodes in the map above.</TableCell></TableRow>
							)}
							{selectList.map((row) => (
								<TableRow
									key={row.hash}
									sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
								>
									<TableCell style={{ width: "20%" }} align="left">
										{row.repo}
									</TableCell>
									<TableCell style={{ width: "10%" }} align="left">
										{row.author}
									</TableCell>
									<TableCell style={{ width: "17%" }} align="left">
										{row.date}
									</TableCell>
									<TableCell style={{ width: "48%" }} align="left">
										{row.message}
									</TableCell>
									<TableCell style={{ width: "5%" }} align="center">
										<a
											href={row.url}
											className="underline"
											target="_blank"
											rel="noreferrer"
										>
											{row.hash}
										</a>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
				<div id="generate-word-cloud" className="flex justify-center py-2">
					<Button id="word-cloud-btn" onClick={handleOpen} variant="outlined" disabled={selectList.length === 0}>
						<TroubleshootIcon /> &nbsp; Peek into selected nodes
					</Button>
					{/* <div id="message-cloud"></div> */}
					<Modal
						open={openModal}
						onClose={handleClose}
						aria-labelledby="wordcloud"
						aria-describedby="wordcloud-for-selected-nodes"
						className="flex items-center justify-center"
					>
						<MessageCloud text={selectMessage} />
					</Modal>
				</div>
			</div>
			{/* <MessageCloud text={selectMessage} /> */}
			{isSuccess && (
				<>
					<Accordion>
						<AccordionSummary
							id="sankey-classify"
							expandIcon={<ExpandMoreIcon />}
						>
							<CategoryIcon /> &nbsp; Compare maintenance intent
						</AccordionSummary>
						<AccordionDetails>
							<p className="accordion-intro">See how each fork’s commit messages distribute across adaptive, corrective, and perfective maintenance. Categories are inferred from message text.</p>
							<div
								id="sankey-diagram"
								className="border-2 h-auto border-blue-200 flex justify-center"
							/>
							<ul
								id="explain-classification"
								className="px-10 text-xs"
								style={{ listStyleType: "disc" }}
							>
								<li>Adaptive: Accommodate changes in the environment </li>
								<li>Corrective: Fix bugs or errors</li>
								<li>Perfective: Improve the performance or readability</li>
							</ul>
						</AccordionDetails>
					</Accordion>
					<Accordion>
						<AccordionSummary
							id="network-history"
							expandIcon={<ExpandMoreIcon />}
						>
							<ShareIcon /> &nbsp; Replay contributor collaboration
						</AccordionSummary>
						<AccordionDetails>
							<p className="accordion-intro">Move through time to see which authors contributed to which repositories.</p>
							{networkData.length > 0 ? (
								<Network data={networkData} />
							) : (
								<div></div>
							)}
						</AccordionDetails>
					</Accordion>
				</>
			)}
		</div>
	);
};

function groupNodes(input) {
	let data = JSON.parse(JSON.stringify(input));
	let nodes = {};
	// Step 1: Construct the graph
	data.forEach((item) => {
		item.childIds = []; // Initialize children
		item.mergedNodes = []; // Initialize merged nodes
		nodes[item.id] = item;
	});

	data.forEach((item) => {
		item.parentIds.forEach((parentId) => {
			if (nodes[parentId]) {
				nodes[parentId].childIds.push(item.id);
			}
		});
	});
	// console.log("nodes: ", nodes);

	// Step 2: Remove duplicates
	for (let nodeId in nodes) {
		let node = nodes[nodeId];
		node.parentIds = Array.from(new Set(node.parentIds));
		node.childIds = Array.from(new Set(node.childIds));
	}

	// Step 3: Merge nodes with one parent and one child
	let merged = true;
	while (merged) {
		merged = false;
		for (let nodeId in nodes) {
			let node = nodes[nodeId];
			if (node.parentIds.length === 1 && node.childIds.length === 1) {
				let parent = nodes[node.parentIds[0]];
				let child = nodes[node.childIds[0]];

				// Removing current node from parent's children
				parent.childIds = parent.childIds.filter((id) => id !== node.id);

				// Removing current node from child's parents
				child.parentIds = child.parentIds.filter((id) => id !== node.id);

				// Connect parent directly to child (if they're not already connected)
				if (!parent.childIds.includes(child.id)) {
					parent.childIds.push(child.id);
				}
				if (!child.parentIds.includes(parent.id)) {
					child.parentIds.push(parent.id);
				}

				// Keep track of the merged node's original data
				parent.mergedNodes.push(node);
				child.mergedNodes.push(node);

				// Remove the current node
				delete nodes[nodeId];

				merged = true;
				break;
			}
		}
	}
	// console.log("nodes: ", Object.values(nodes));
	return Object.values(nodes); // return remaining nodes
}

// function groupNodes(input) {
// 	let data = JSON.parse(JSON.stringify(input));
// 	let nodes = {};
// 	// Step 1: Construct the graph
// 	data.forEach((item) => {
// 		item.childIds = []; // Initialize children
// 		item.mergedNodes = []; // Initialize merged nodes
// 		nodes[item.id] = item;
// 	});
// 	data.forEach((item) => {
// 		item.parentIds.forEach((parentId) => {
// 			if (nodes[parentId]) {
// 				nodes[parentId].childIds.push(item.id);
// 			}
// 		});
// 	});

// 	// Step 2: Remove duplicates
// 	for (let nodeId in nodes) {
// 		let node = nodes[nodeId];
// 		node.parentIds = Array.from(new Set(node.parentIds));
// 		node.childIds = Array.from(new Set(node.childIds));
// 	}

// 	// Step 3: Merge nodes with one parent and one child
// 	const mg = mn(Object.values(nodes));

// 	console.log("nodes: ", Object.values(mg));

// 	return Object.values(mg); // return remaining nodes
// }

function mn(data) {
	data.forEach((node) => {
		node.parentIds.forEach((parentId) => {
			let parent = data.find((n) => n.id === parentId);
			if (parent) parent.childIds.push(node.id);
		});
	});

	// Merge nodes with only one parent and one child,
	// but also ensure that the child of the current node has only one parent (current node)
	// and the parent of the current node has only one child (current node)
	for (let i = 0; i < data.length; i++) {
		let node = data[i];
		if (node.parentIds.length === 1 && node.childIds.length === 1) {
			let parent = data.find((n) => n.id === node.parentIds[0]);
			let child = data.find((n) => n.id === node.childIds[0]);

			if (!child || !parent) continue;
			if (parent.childIds.length !== 1 || child.parentIds.length !== 1)
				continue;

			child.mergedNodes.push(node.id, ...node.mergedNodes);
			child.parentIds = child.parentIds.map((id) =>
				id === node.id ? node.parentIds[0] : id
			);
			data = data.filter((n) => n.id !== node.id);
			i--;
		}
	}

	return data;
}

function mergeMonth(dag) {
	const merged = new Map();
	for (const node of dag) {
		const date = new Date(node.data.date);
		const month = date.getMonth() + 1;
		const year = date.getFullYear();
		const key = `${year}-${month}`;
		if (merged.has(key)) {
			merged.get(key).push(node);
		} else {
			merged.set(key, [node]);
		}
	}

	const sortedMap = new Map([...merged.entries()].sort());
	return sortedMap;
	// return merged;
}

export default DagComponent;

// helper function of labella.js
function draw(nodes) {
	var renderer = new labella.Renderer();
	// Add x,y,dx,dy to node
	renderer.layout(nodes);

	// Draw label rectangles
	d3.selectAll("rect.label")
		.data(nodes)
		.enter()
		.append("rect")
		.classed("label", true)
		.attr("x", function (d) {
			return d.x - d.dx / 2;
		})
		.attr("y", function (d) {
			return d.y;
		})
		.attr("width", function (d) {
			return d.dx;
		})
		.attr("height", function (d) {
			return d.dy;
		});

	// Draw path from point on the timeline to the label rectangle
	d3.selectAll("path.link")
		.data(nodes)
		.enter()
		.append("path")
		.classed("link", true)
		.attr("d", function (d) {
			return renderer.generatePath(d);
		});
}

function mergeDag(dag) {
	let nodes = dag.descendants();
	console.log("mergeDag? ", dag.children());
	let toRemove = [];
	let parentCounts = getParentCounts(dag);

	// Identify the nodes to merge
	for (let node of nodes) {
		// skip the root node
		if (parentCounts.get(node) === undefined) {
			continue;
		}

		if (
			node.childrenCounts().length === 1 &&
			parentCounts.get(node).length === 1
		) {
			toRemove.push(node);
			// use d3.merge to merge the children of the node
		}
	}

	// console.log("toRemove: ", toRemove);

	// Merge the nodes
	toRemove.forEach((node) => {
		let parents = getParents(node);
		let children = node.children();

		if (parents.length === 1 && children.length === 1) {
			let parent = parents[0];
			let child = children[0];

			// remove the node from its parent's children list
			parent.children = parent.children().filter((n) => n.id !== node.id);

			// add the child to the parent's children list
			if (!parent.children().includes(child)) {
				parent.children().push(child);
			}

			// update child's parent
			child._parents.delete(node);
			child._parents.add(parent);
		}
	});

	// filter out the removed nodes
	// dag = dag.descendants().filter((node) => !toRemove.includes(node));
	// console.log("after_dag: ", dag);

	// dag = d3dag.dagHierarchy(dag);

	// Return the updated dag
	return dag;
}

function getParentCounts(parentNodes) {
	const parents = new Map();
	for (const par of parentNodes) {
		for (const [child, count] of par.ichildrenCounts()) {
			listMultimapPush(parents, child, [par, count]);
		}
	}
	return parents;
}

function getParents(parentNodes) {
	const parents = new Map();
	for (const par of parentNodes) {
		for (const child of par.ichildren()) {
			listMultimapPush(parents, child, par);
		}
	}
	return parents;
}

function listMultimapPush(multimap, key, val) {
	const value = multimap.get(key);
	if (value === undefined) {
		multimap.set(key, [val]);
	} else {
		value.push(val);
	}
}

function assignLane(data) {
	let idCounter = 0;
	let result = new Map();
	for (let entry of data) {
		let repoBranch = `${entry.repo}-${entry.branch_name}`;
		if (!result.has(repoBranch)) {
			result.set(repoBranch, idCounter++);
		}
	}
	return result;
}

function descendingComparator(a, b, orderBy) {
	if (b[orderBy] < a[orderBy]) {
		return -1;
	}
	if (b[orderBy] > a[orderBy]) {
		return 1;
	}
	return 0;
}

function getComparator(order, orderBy) {
	return order === "desc"
		? (a, b) => descendingComparator(a, b, orderBy)
		: (a, b) => -descendingComparator(a, b, orderBy);
}

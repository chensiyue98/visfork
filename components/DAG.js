import React, { useRef, useEffect, useState, use } from "react";
import * as d3 from "d3";
import * as d3dag from "d3-dag";
import MessageCloud from "./MessageCloud";
import { parseData, SankeyChart } from "./Sankey";
import Network from "./Network";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

// Pannable Chart (https://observablehq.com/@d3/pannable-chart)
// TODO: 增加tag显示
// TODO: 按日/周/月/年合并节点
// TODO: 增加时间范围选择器
// TODO: Seleted Nodes改为列表，选择一个节点，右侧显示该节点的信息
// TODO: sankey图颜色对应
// D3-DAG example notebook for doing performance analysis (https://observablehq.com/d/71168767dcb492be)

const DagComponent = ({ data }) => {
	const svgRef = useRef(null);
	// const zoomButtonRef = useRef(null);

	const [grouping, setGrouping] = useState("none");

	const [selectList, setSelectList] = useState([]);
	const [selectMessage, setSelectMessage] = useState("empty");
	const [networkData, setNetworkData] = useState([]);

	useEffect(() => {
		var startTimer = new Date().getTime();

		// clear the previous render
		d3.select(svgRef.current).selectAll("*").remove();
		// d3.select(zoomButtonRef.current).selectAll("*").remove();

		const dag = d3dag.dagStratify()(data);

		//TODO: Merge nodes with of the same month into one node
		const mergeNodes = (dag) => {
			const merged = new Map();
			for (const node of dag) {
				const date = new Date(node.data.date);
				const month = date.getMonth();
				const year = date.getFullYear();
				const key = `${year}-${month}`;
				if (merged.has(key)) {
					merged.get(key).push(node);
				} else {
					merged.set(key, [node]);
				}
			}
			return merged;
		};
		console.log("DAG.js: merged", mergeNodes(dag));

		const nodeRadius = 5;
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
			// This could alos be accomplished by just changing the coordinates of the svg viewbox.
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
				if (prev !== undefined && !arrayEq(parents.get(node), [prev])) {
					lane++;
				}
				node.x = lane;

				for (const child of node.ichildren()) {
					parents.get(child).push(node);
				}
				prev = node;
			}

			for (const node of nodes) {
				node.x = lane - node.x;
			}
		};

		const layout = gridTweak(
			gridCompact(
				d3dag.grid().rank((node) => node.data.date)
				// .lane(leftLane)
			)
		);

		const { width, height } = layout(dag);

		const svgSelection = d3.select(svgRef.current);
		svgSelection.attr("id", "svgSelection");
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

		const steps = dag.size();
		const interp = d3.interpolateRainbow;
		const colorMap = new Map();

		for (const [i, node] of [...dag].entries()) {
			// colorMap.set(node.data.id, interp(i / steps));
			colorMap.set(node.data.repo, interp(i / steps));
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

		// Plot node circles
		nodes
			.append("circle")
			.attr("r", nodeRadius)
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
					.style("border-color", "black")
					.style("border-width", "1px")
					.style("border-style", "solid")
					.style("border-radius", "5px")
					.style("padding", "5px")
					.style("left", `${event.pageX - 120}px`)
					.style("top", `${event.pageY - 120}px`);
			})
			.on("mouseout", (event, d) => {
				tooltip.transition().duration(300).style("display", "none");
				d3.select(event.currentTarget).select("circle").attr("r", nodeRadius);
			})
			.on("click", (event, d) => {
				window.open(`${d.data.url}`);
			});

		const tooltip = d3
			.select("body")
			.append("div")
			.attr("class", "tooltip")
			.style("opacity", 0)
			.style("position", "absolute");

		const monthEntries = mergeNodes(dag).keys();
		// go through each node. if it's the first node of the month, add a label
		for (const [i, node] of [...dag].entries()) {
			// get the month of the current node
			// var month = node.data.date.split("-")[0]+"-"+node.data.date.split("-")[1];
			var date = new Date(node.data.date);
			var key = date.getFullYear() + "-" + date.getMonth();
			// set next to the first key of the entries
			if (i === 0) {
				var next = monthEntries.next().value;
			}
			if (next === key) {
				graph
					.append("text")
					.attr("y", width)
					.attr("x", node.y)
					.attr("dy", "-10px")
					.attr("text-anchor", "middle")
					.attr("font-size", "0.8em")
					// text color black
					.attr("fill", "black")
					.text(key);

				// add a line
				graph
					.append("line")
					.attr("x1", node.y)
					.attr("y1", node.x)
					.attr("x2", node.y)
					.attr("y2", node.x + width)
					.attr("stroke-width", 2)
					.attr("stroke", "black");

				next = monthEntries.next().value;
			}
		}

		// Add a group for buttons
		// const buttonGroup = d3
		// 	.select(zoomButtonRef.current)
		// 	.append("svg")
		// 	.style("cursor", "pointer");
		// Add a button for zooming in
		// const zoomInButton = buttonGroup
		// 	.append("g")
		// 	.attr("transform", "translate(10, 10)")
		// 	.on("click", () => {
		// 		zoom.scaleBy(svgSelection.transition().duration(300), 1.2);
		// 		// update the width of the graph
		// 		// svgSelection.attr("width", width * 1.2);
		// 	});
		// zoomInButton
		// 	.append("rect")
		// 	.attr("width", 30)
		// 	.attr("height", 30)
		// 	.attr("fill", "white")
		// 	.attr("stroke", "black");
		// zoomInButton
		// 	.append("text")
		// 	.attr("x", 15)
		// 	.attr("y", 15)
		// 	.attr("text-anchor", "middle")
		// 	.attr("alignment-baseline", "middle")
		// 	.text("+");
		// Add a button for zooming out
		// const zoomOutButton = buttonGroup
		// 	.append("g")
		// 	.attr("transform", "translate(10, 50)")
		// 	.on("click", () => {
		// 		zoom.scaleBy(svgSelection.transition().duration(300), 1 / 1.2);
		// 		// svgSelection.attr("width", height / 1.2);
		// 	});
		// zoomOutButton
		// 	.append("rect")
		// 	.attr("width", 30)
		// 	.attr("height", 30)
		// 	.attr("fill", "white")
		// 	.attr("stroke", "black");
		// zoomOutButton
		// 	.append("text")
		// 	.attr("x", 15)
		// 	.attr("y", 15)
		// 	.attr("text-anchor", "middle")
		// 	.attr("alignment-baseline", "middle")
		// .text("-");

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
					console.log(selectedNodes._groups[0]);
					const selectedNodesList = d3.select("#selected-nodes-list");
					selectedNodesList.selectAll("div").remove();
					selectedNodesList
						.selectAll("div")
						.data(selectedNodes._groups[0])
						.enter()
						.append("div")
						.text((d) => {
							// console.log(d.__data__.data);
							return d.__data__.data.repo;
						});
					setSelectList(selectedNodes._groups[0]);

					// concate the commit messages of the selected nodes, remove line breaks
					if (selectedNodes._groups[0].length > 0) {
						const commitMessages = selectedNodes._groups[0].reduce(
							(acc, cur) => {
								return acc + cur.__data__.data.message + " ";
							}
						);
						// remove line breaks
						commitMessages.replace(/(\r\n|\n|\r)/gm, " ");
						setSelectMessage(commitMessages);
					} else {
						setSelectMessage("");
					}
				}
			}
		}

		console.log("selected nodes: ", selectList);

		var endTimer = new Date().getTime();
		console.log("From DAG.js - Render Time: " + (endTimer - startTimer) + "ms");
	}, [data]);

	// draw sankey diagram (repo -> commit_type) when data is updated
	useEffect(() => {
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
	}, [data]);

	// Network Graph
	useEffect(() => {
		// map author and repo data from the data into {"author": "name", "repo": "name"}
		const n = data.map((d) => {
			// keep the date and remove the time from the date
			let date = d.date.split("T")[0];
			// format the date from "2023-01-01" to "2023-01-01T00:00.000Z"
			date = date + "T22:00:00.000Z";

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

	return (
		<div>
			<ToggleButtonGroup value={grouping} exclusive onChange={handleGrouping} aria-label="Grouping Forks">
				<ToggleButton value="none">
					None
				</ToggleButton>
				<ToggleButton value="month">
					Month
				</ToggleButton>
			</ToggleButtonGroup>
			{/* <div ref={zoomButtonRef} className="absolute top-0 z-10" /> */}{" "}
			<div
				id="overflow-container"
				className="max-w-screen-xl overflow-x-scroll, overflow-y-scroll"
			>
				<svg ref={svgRef} className="border-4" />
			</div>
			<div id="date-slider" className="border-4"></div>
			<div id="selected-nodes" className="border-4 h-40 overflow-y-auto">
				<h3 className="font-bold"> Selected Nodes </h3> {/* divider */}{" "}
				<hr className="my-2" />
				<div id="selected-nodes-list"> </div>{" "}
				{/* <div id="selected-word-cloud"></div> */}{" "}
			</div>{" "}
			<MessageCloud text={selectMessage} />{" "}
			<div
				id="sankey-diagram"
				className="border-4 h-auto border-green-500"
			></div>
			<div>
				{networkData.length > 0 ? <Network data={networkData} /> : <div></div>}
			</div>
		</div>
	);
};

export default DagComponent;

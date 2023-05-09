import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import * as d3dag from "d3-dag";

// TODO: 改为滚轮滚动，按钮缩放
// Pannable Chart (https://observablehq.com/@d3/pannable-chart)
// TODO: 初始位置在末尾
// Done: Horizontal layout
// D3-DAG example notebook for doing performance analysis (https://observablehq.com/d/71168767dcb492be)

const DagComponent = ({ data }) => {
	const svgRef = useRef(null);
	var isHorizontal = true;
	// console.log("DAG.js: data", data);

	useEffect(() => {
		var startTimer = new Date().getTime();

		// clear the previous render
		d3.select(svgRef.current).selectAll("*").remove();

		const dag = d3dag.dagStratify()(data);

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
						{ x: middle.x, y: middle.y + nodeRadius },
						last
					);
				}
			}
			return { width, height };
		};

		const gridCompact = (layout) => (dag) => {
			// Tweak to render compact grid, first shrink x width by edge radius, then expand the width to account for the loss
			// This could alos be accomplished by just changing the coordinates of the svg viewbox.
			const baseLayout = layout.nodeSize([
				nodeRadius + edgeRadius * 2,
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
			return { width: width + 2 * nodeRadius, height: height };
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
		svgSelection.attr("height", 300);

		const graph = svgSelection
			.append("g")
			.attr("id", "graph")
			// reverse x and y for horizontal layout
			.attr("width", height)
			.attr("height", width)
			// centerize the graph in svgSelection
			.attr("transform", `translate(0, ${(300 - width) / 2})`);
		const defs = graph.append("defs"); // For gradients

		const steps = dag.size();
		const interp = d3.interpolateRainbow;
		const colorMap = new Map();

		for (const [i, node] of [...dag].entries()) {
			colorMap.set(node.data.id, interp(i / steps));
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
					.attr("stop-color", colorMap.get(source.data.id));
				grad
					.append("stop")
					.attr("offset", "100%")
					.attr("stop-color", colorMap.get(target.data.id));
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
			.attr("fill", (n) => colorMap.get(n.data.id));

		// Add mouseover events
		nodes
			.on("mouseover", (event, d) => {
				d3.select(event.currentTarget)
					.select("circle")
					.attr("r", nodeRadius * 1.5);
				tooltip.transition().duration(200).style("opacity", 0.9);
				tooltip
					.html(
						`<p>Repo: ${d.data.repo}</p>
						<p>Branch: ${d.data.branch_name}</p>
						<p>Commit: ${d.data.id}</p>
						<p>Date: ${d.data.date}</p>`
					)
					.style("left", `${event.pageX - 200}px`)
					.style("top", `${event.pageY - 200}px`);
			})
			.on("mouseout", (event, d) => {
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

		const zoom = d3
			.zoom()
			.scaleExtent([0.1, 5])
			.on("zoom", function (event) {
				graph.attr("transform", event.transform);
			});

		// Zooming and panning with mouse
		svgSelection.call(zoom);

		// Add a group for buttons
		const buttonGroup = svgSelection.append("g").style("cursor", "pointer");
		// Add a button for zooming in
		const zoomInButton = buttonGroup
			.append("g")
			.attr("transform", "translate(10, 10)")
			.on("click", () => {
				graph.transition().duration(300).call(zoom.scaleBy, 1.2);
				// zoom.scaleBy(graph.transition().duration(300), 1.2);
			});
		zoomInButton
			.append("rect")
			.attr("width", 30)
			.attr("height", 30)
			.attr("fill", "white")
			.attr("stroke", "black");
		zoomInButton
			.append("text")
			.attr("x", 15)
			.attr("y", 15)
			.attr("text-anchor", "middle")
			.attr("alignment-baseline", "middle")
			.text("+");
		// Add a button for zooming out
		const zoomOutButton = buttonGroup
			.append("g")
			.attr("transform", "translate(10, 50)")
			.on("click", () => {
				zoom.scaleBy(graph.transition().duration(300), 1 / 1.2);
			});
		zoomOutButton
			.append("rect")
			.attr("width", 30)
			.attr("height", 30)
			.attr("fill", "white")
			.attr("stroke", "black");
		zoomOutButton
			.append("text")
			.attr("x", 15)
			.attr("y", 15)
			.attr("text-anchor", "middle")
			.attr("alignment-baseline", "middle")
			.text("-");

		var endTimer = new Date().getTime();
		console.log("From DAG.js - Render Time: " + (endTimer - startTimer) + "ms");
	}, [data]);

	return (
		<div
			id="overflow-container"
			className="max-w-screen-xl overflow-x-scroll, overflow-y-scroll"
		>
			<svg ref={svgRef} className="border-4" />
		</div>
	);
};

export default DagComponent;

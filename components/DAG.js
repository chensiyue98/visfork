import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import * as d3dag from "d3-dag";

const DagComponent = ({ data }) => {
	const svgRef = useRef(null);
	var isHorizontal = true;
	console.log("DAG.js: data", data);

	useEffect(() => {
		// clear the previous render
		d3.select(svgRef.current).selectAll("*").remove();
		console.log("DAG.js: parsed data", data);

		const dag = d3dag.dagStratify()(data);
		console.log("DAG.js: dag", dag);

		const nodeRadius = 5;
		const edgeRadius = 2;
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

		// svgSelection.attr("viewBox", [0, 0, width, height].join(" "));
		svgSelection.attr("width", 400);
		svgSelection.attr("height", 600);

		const graph = svgSelection.append("g");

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
			.x((d) => d.x)
			.y((d) => d.y);

		// Plot edges
		graph
			.append("g")
			.selectAll("path")
			.data(dag.links())
			.enter()
			.append("path")
			.attr("d", ({ points }) => line(points))
			.attr("fill", "none")
			.attr("stroke-width", 3)
			.attr("stroke", ({ source, target }) => {
				// encodeURIComponents for spaces, hope id doesn't have a `--` in it
				const gradId = encodeURIComponent(
					`${source.data.branch_id}--${target.data.branch_id}`
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
					.attr("stop-color", colorMap.get(source.data.branch_id));
				grad
					.append("stop")
					.attr("offset", "100%")
					.attr("stop-color", colorMap.get(target.data.branch_id));
				return `url(#${gradId})`;
			});

		// Select nodes
		const nodes = graph
			.append("g")
			.selectAll("g")
			.data(dag.descendants())
			.enter()
			.append("g")
			.attr("transform", ({ x, y }) => `translate(${x}, ${y})`);

		// Plot node circles
		nodes
			.append("circle")
			.attr("r", nodeRadius)
			.attr("fill", (n) => colorMap.get(n.data.branch_id));

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
		svgSelection.call(zoom);
	}, [data]);

	return <svg ref={svgRef} className="border-x-gray-500 border-solid border-2" />;
};

export default DagComponent;

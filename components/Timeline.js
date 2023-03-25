import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const Timeline = ({ data }) => {
	const svgRef = useRef(null);

	useEffect(() => {
		const svg = d3.select(svgRef.current);

		const margin = { top: 20, right: 20, bottom: 30, left: 50 };
		const width = svg.attr("width") - margin.left - margin.right;
		const height = svg.attr("height") - margin.top - margin.bottom;

		// const y = d3.scaleLinear().range([0, height]);
		const x = d3.scaleTime().range([0, width]);
		const y = d3.scaleBand();

		const xAxis = d3.axisBottom(x);
		const yAxis = d3.axisLeft(y);

		const parseTime = d3.timeParse("%Y-%m-%dT%H:%M:%S%Z");

		data.forEach((d) => {
			d.date = parseTime(d.date);
		});

		x.domain(d3.extent(data, (d) => d.date)); // d3.extent returns the min and max values of an array
		// y.domain(d3.extent(data, (d) => d.branch_name));
		y.domain(data.map((d) => d.branch_name));

		const line = d3
			.line()
			.x((d) => x(d.date))
			.y((d) => y(d.branch_name));

		svg
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`)
			.append("path")
			.datum(data)
			.attr("class", "line")
			.attr("d", line)
			.attr("stroke", "steelblue");

		svg
			.append("g")
			.attr("transform", `translate(${margin.left},${height + margin.top})`)
			.call(xAxis);

		svg
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`)
			.call(yAxis);

		svg
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`)
			.selectAll(".dot")
			.data(data)
			.enter()
			.append("circle")
			.attr("class", "dot")
			.attr("cx", (d) => x(d.date))
			.attr("cy", (d) => y(d.branch_name))
			.attr("r", 5)
			.on("mouseover", (d) => {
				tooltip
					.transition()
					.duration(300)
					.style("display", "block")
					.style("opacity", 0.9);
				tooltip
					.html(
						`<b>${d.target.__data__.author}</b><br/>
						SHA: ${d.target.__data__.sha}<br/>
						MESSAGE: <br/>
						${d.target.__data__.message}`
					)
					.style("left", `10px`)
					.style("top", `10px`);
			})
			.on("mouseout", () => {
				tooltip
					.transition()
					.duration(300)
					.style("opacity", 0)
					.style("display", "none");
			})
			.on("click", (d) => {
				window.open(d.target.__data__.url);
			});

		const tooltip = d3
			.select("body")
			.append("div")
			.attr("class", "tooltip")
			.style("opacity", 0);
	}, [data]);

	return <svg ref={svgRef} width="960" height="500"></svg>;
};

export default Timeline;

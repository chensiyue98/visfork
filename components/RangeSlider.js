import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

const DateRangeSlider = ({ raw, onSelection = () => {} }) => {
	const ref = useRef();
	const width = 1000;
	const height = 100;
	const margin = { top: 10, right: 0, bottom: 50, left: 0 };

	useEffect(() => {
		// copy raw to data
		// console.log(raw);
		const data = JSON.parse(JSON.stringify(raw));
		// clear svg
		d3.select(ref.current).selectAll("*").remove();

		if (data && data.length) {
			// Drop the time and keep only dates
			data.forEach((d) => {
				d.date = d3.timeMonth(new Date(d.date));
			});

			// calculate frequency by week
			let frequency = d3.rollup(
				data,
				(v) => v.length,
				(d) => d.date
			);

			// fill the missing weeks with 0
			const minDate = d3.min(data, (d) => d.date);
			const maxDate = d3.max(data, (d) => d.date);
			const allMonth = d3.timeMonths(minDate, maxDate);
			allMonth.forEach((d) => {
				if (!frequency.has(d)) {
					frequency.set(d, 0);
				}
			});
			// sort by date
			frequency = new Map(
				Array.from(frequency).sort((a, b) => d3.ascending(a[0], b[0]))
			);

			// Create the x and y scales
			const xScale = d3.scaleBand().rangeRound([0, width]).padding(0.1);
			const yScale = d3.scaleLinear().range([height, 0]);

			// Set the domain of the x and y scales
			xScale.domain(Array.from(frequency.keys()));
			yScale.domain([0, d3.max(frequency.values())]);

			// Create the x and y axes
			const xAxis = d3
				.axisBottom(xScale)
				.tickFormat(d3.timeFormat("%Y-%m"))
				.tickSize(0);
			const yAxis = d3.axisLeft(yScale).tickSize(0);

			// Create the SVG container
			const svg = d3
				.select(ref.current)
				.append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", `translate(${margin.left},${margin.top})`);

			// Add the x axis
			svg
				.append("g")
				.attr("class", "x axis")
				.attr("transform", `translate(0, ${height})`)
				.call(xAxis)
				.selectAll("text")
				.style("text-anchor", "end")
				.attr("dx", "-.8em")
				.attr("dy", ".15em")
				.attr("transform", "rotate(-65)");
			// remove the line of x axis
			svg.selectAll(".domain").remove();

			// Add the y axis
			svg
				.append("g")
				.attr("class", "y axis")
				.call(yAxis)
				.selectAll(".domain")
				.remove();

			// Create the bars with frequency data
			svg
				.selectAll(".bar")
				.data(Array.from(frequency.entries()))
				.enter()
				.append("rect")
				.attr("class", "bar")
				.attr("x", (d) => xScale(d[0]))
				.attr("y", (d) => yScale(d[1]))
				.attr("fill", "gray")
				.attr("width", xScale.bandwidth())
				.attr("height", (d) => height - yScale(d[1]));

			svg
				.selectAll(".background")
				.data(frequency)
				.enter()
				.append("rect")
				.attr("class", "background")
				.attr("x", (d) => xScale(d[0]))
				.attr("y", 0)
				.attr("width", xScale.bandwidth())
				.attr("height", height)
				.attr("fill", "fff")
				.attr("opacity", 0.1);

			var selectedDates = [];

			const brush = d3
				.brushX()
				.extent([
					[0, 0],
					[width, height],
				])
				.on("brush", brushing)
				.on("end", brushed);

			svg.append("g").call(brush);

			function brushing(event) {
				if (!event.sourceEvent) return;
				const [x0, x1] = event.selection;
				if (x0 === x1) {
					brush.move(svg.select("g.brush"), [0, width]);
				}
				selectedDates = xScale
					.domain()
					.filter((d) => x0 <= xScale(d) && xScale(d) <= x1);
				// highlight selected dates
				svg
					.selectAll(".bar")
					.attr("fill", (d) =>
						selectedDates.includes(d[0]) ? "steelblue" : "gray"
					);
				// highlight selected background
				svg
					.selectAll(".background")
					.attr("fill", (d) =>
						selectedDates.includes(d[0]) ? "steelblue" : "fff"
					);
			}

			function brushed(event) {
				if (!event.selection) return;
				// console.log(selectedDates);
				onSelection(selectedDates);
			}

			// double click to select all
			svg.on("dblclick", () => {
				brush.move(svg.select("g.brush"), [0, width]);
				selectedDates = xScale.domain();
				// highlight selected dates
				svg
					.selectAll(".bar")
					.attr("fill", (d) =>
						selectedDates.includes(d[0]) ? "steelblue" : "gray"
					);
				// highlight selected background
				svg
					.selectAll(".background")
					.attr("fill", (d) =>
						selectedDates.includes(d[0]) ? "steelblue" : "fff"
					);
				onSelection(selectedDates);
			});
		}
	}, [raw]);

	return (
		<div className="text-center">
			<div
				id="range-slider"
				ref={ref}
				className="border-2 border-blue-300 rounded-md p-1"
			>
				Slide to select a date range
			</div>
		</div>
	);
};

export default DateRangeSlider;

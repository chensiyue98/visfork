import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Button } from "@mui/material";

const formatRange = (months, commits) => {
	if (!months.length) return "No months selected";
	const start = d3.timeFormat("%b %Y")(months[0]);
	const end = d3.timeFormat("%b %Y")(months[months.length - 1]);
	return `${start} – ${end} · ${commits} commits · ${months.length} ${months.length === 1 ? "month" : "months"}`;
};

const DateRangeSlider = ({ raw, onSelection = () => {} }) => {
	const ref = useRef(null);
	const resetRef = useRef(() => {});
	const onSelectionRef = useRef(onSelection);
	const [chartWidth, setChartWidth] = useState(1000);
	const [rangeSummary, setRangeSummary] = useState("");

	onSelectionRef.current = onSelection;

	useEffect(() => {
		if (!ref.current) return undefined;
		const observer = new ResizeObserver(([entry]) => {
			setChartWidth(Math.max(360, Math.round(entry.contentRect.width)));
		});
		observer.observe(ref.current);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const container = d3.select(ref.current);
		container.selectAll("*").remove();
		if (!raw?.length) {
			setRangeSummary("No commit activity available");
			return undefined;
		}

		const data = raw
			.map((item) => ({ ...item, month: d3.timeMonth.floor(new Date(item.date)) }))
			.filter((item) => !Number.isNaN(item.month.getTime()));
		if (!data.length) return undefined;

		const minDate = d3.min(data, (item) => item.month);
		const maxDate = d3.max(data, (item) => item.month);
		const months = d3.timeMonths(minDate, d3.timeMonth.offset(maxDate, 1));
		const byMonth = d3.group(data, (item) => +item.month);
		const activity = months.map((month) => {
			const items = byMonth.get(+month) || [];
			return {
				month,
				commits: items.length,
				repositories: new Set(items.map((item) => item.repo)).size,
				contributors: new Set(items.map((item) => item.author)).size,
			};
		});

		const outerWidth = chartWidth;
		const height = 150;
		const margin = { top: 12, right: 12, bottom: 32, left: 42 };
		const width = Math.max(1, outerWidth - margin.left - margin.right);
		const xScale = d3.scaleBand(months, [0, width]).padding(0.16);
		const yScale = d3.scaleLinear([0, Math.max(1, d3.max(activity, (item) => item.commits))], [height, 0]).nice();
		let selectedMonths = [...months];

		const rootSvg = container.append("svg")
			.attr("viewBox", `0 0 ${outerWidth} ${height + margin.top + margin.bottom}`)
			.attr("role", "img")
			.attr("aria-label", "Monthly commit activity. Drag horizontally to select a date range.");
		const svg = rootSvg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

		const yAxis = d3.axisLeft(yScale).ticks(3).tickSize(-width).tickFormat(d3.format("~s"));
		svg.append("g").attr("class", "activity-grid").call(yAxis).call((group) => group.select(".domain").remove());
		svg.append("text")
			.attr("class", "activity-y-label")
			.attr("transform", "rotate(-90)")
			.attr("x", -height / 2)
			.attr("y", -32)
			.attr("text-anchor", "middle")
			.text("Commits");

		const tickStride = Math.max(1, Math.ceil(months.length / Math.max(2, Math.floor(width / 76))));
		const tickValues = months.filter((_, index) => index % tickStride === 0 || index === months.length - 1);
		const tickFormat = (month, index) => month.getMonth() === 0 || index === 0
			? d3.timeFormat("%b %Y")(month)
			: d3.timeFormat("%b")(month);
		svg.append("g")
			.attr("class", "activity-x-axis")
			.attr("transform", `translate(0,${height})`)
			.call(d3.axisBottom(xScale).tickValues(tickValues).tickFormat(tickFormat).tickSize(0))
			.call((group) => group.select(".domain").remove());

		const bars = svg.append("g").selectAll("rect")
			.data(activity)
			.join("rect")
			.attr("class", "activity-bar is-selected")
			.attr("x", (item) => xScale(item.month))
			.attr("y", (item) => yScale(item.commits))
			.attr("width", xScale.bandwidth())
			.attr("height", (item) => height - yScale(item.commits))
			.attr("tabindex", 0)
			.attr("aria-label", (item) => `${d3.timeFormat("%B %Y")(item.month)}: ${item.commits} commits, ${item.repositories} repositories, ${item.contributors} contributors`);
		bars.append("title").text((item) => `${d3.timeFormat("%B %Y")(item.month)}\n${item.commits} commits\n${item.repositories} active repositories\n${item.contributors} contributors`);

		const commitCountFor = (selection) => activity
			.filter((item) => selection.includes(item.month))
			.reduce((total, item) => total + item.commits, 0);
		const updateVisuals = (selection) => {
			selectedMonths = selection.length ? selection : [...months];
			bars.classed("is-selected", (item) => selectedMonths.includes(item.month))
				.classed("is-muted", (item) => !selectedMonths.includes(item.month));
			setRangeSummary(formatRange(selectedMonths, commitCountFor(selectedMonths)));
		};
		updateVisuals(months);

		const brush = d3.brushX()
			.extent([[0, 0], [width, height]])
			.on("brush", (event) => {
				if (!event.selection) return;
				const [x0, x1] = event.selection;
				const selection = months.filter((month) => {
					const x = xScale(month);
					return x < x1 && x + xScale.bandwidth() > x0;
				});
				updateVisuals(selection);
			})
			.on("end", (event) => {
				if (!event.sourceEvent || !event.selection) return;
				onSelectionRef.current(selectedMonths);
			});
		const brushGroup = svg.append("g").attr("class", "activity-brush").call(brush);

		resetRef.current = () => {
			brushGroup.call(brush.move, null);
			updateVisuals(months);
			onSelectionRef.current(months);
		};

		return () => {
			resetRef.current = () => {};
		};
	}, [raw, chartWidth]);

	return (
		<div className="range-card">
			<div className="chart-title-row activity-title-row">
				<div><strong>Monthly commit activity</strong><span>Drag across the bars to focus the evolution map.</span></div>
				<div className="activity-range-actions">
					<span aria-live="polite">{rangeSummary}</span>
					<Button size="small" variant="outlined" onClick={() => resetRef.current()}>Reset range</Button>
				</div>
			</div>
			<div id="range-slider" ref={ref} className="range-slider" />
		</div>
	);
};

export default DateRangeSlider;

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { Button, FormControlLabel, Slider, Switch, ToggleButton, ToggleButtonGroup } from "@mui/material";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import SkipNextIcon from "@mui/icons-material/SkipNext";

const PLAYBACK_INTERVAL = 800;
const CHART_WIDTH = 1000;
const COLUMN_GAP = 610;
const LEFT_X = 205;
const RIGHT_X = LEFT_X + COLUMN_GAP;

export default function Network({ data = [] }) {
	const timeline = useMemo(() => buildMonthlyTimeline(data), [data]);
	const layout = useMemo(() => buildStableLayout(data), [data]);
	const [isPlaying, setIsPlaying] = useState(false);
	const [monthIndex, setMonthIndex] = useState(0);
	const [viewMode, setViewMode] = useState("rolling");
	const [layoutMode, setLayoutMode] = useState("bipartite");
	const [crossForkOnly, setCrossForkOnly] = useState(false);

	useEffect(() => {
		setMonthIndex(0);
		setIsPlaying(false);
	}, [data]);

	useEffect(() => {
		if (!isPlaying || timeline.length === 0) return undefined;
		const timer = window.setInterval(() => {
			setMonthIndex((current) => {
				if (current >= timeline.length - 1) {
					setIsPlaying(false);
					return current;
				}
				return current + 1;
			});
		}, PLAYBACK_INTERVAL);
		return () => window.clearInterval(timer);
	}, [isPlaying, timeline.length]);

	if (timeline.length === 0) {
		return <div className="network-empty">No contributor activity is available for this date range.</div>;
	}

	const timelineEntry = timeline[Math.min(monthIndex, timeline.length - 1)];
	const modeLinks = getLinksForMode(timeline, monthIndex, viewMode);
	const contributorRepos = d3.group(modeLinks, (link) => link.author);
	const crossForkAuthors = new Set(
		Array.from(contributorRepos, ([author, links]) => [author, new Set(links.map((link) => link.repo)).size])
			.filter(([, repoCount]) => repoCount > 1)
			.map(([author]) => author)
	);
	const visibleLinks = crossForkOnly
		? modeLinks.filter((link) => crossForkAuthors.has(link.author))
		: modeLinks;
	const visibleNodeIds = new Set(visibleLinks.flatMap((link) => [link.author, link.repo]));
	const visibleAuthors = layout.authors.filter((author) => visibleNodeIds.has(author.id));
	const visibleRepos = layout.repos.filter((repo) => visibleNodeIds.has(repo.id));
	const monthSummary = getMonthSummary(timelineEntry);

	const changeMonth = (nextIndex) => {
		setMonthIndex(Math.max(0, Math.min(timeline.length - 1, nextIndex)));
		setIsPlaying(false);
	};

	return (
		<div className="network-replay">
			<div className="network-toolbar">
				<div>
					<span className="network-period-label">Monthly snapshot</span>
					<strong>{d3.timeFormat("%B %Y")(timelineEntry.month)}</strong>
				</div>
				<div className="network-controls">
					<Button aria-label="Previous month" disabled={monthIndex === 0} onClick={() => changeMonth(monthIndex - 1)}><SkipPreviousIcon /></Button>
					<Button variant="outlined" size="small" onClick={() => setIsPlaying((playing) => !playing)}>
						{isPlaying ? <><PauseCircleIcon />&nbsp; Pause</> : <><PlayCircleIcon />&nbsp; Play</>}
					</Button>
					<Button aria-label="Next month" disabled={monthIndex === timeline.length - 1} onClick={() => changeMonth(monthIndex + 1)}><SkipNextIcon /></Button>
				</div>
			</div>

			<div className="network-summary" aria-label={`Activity summary for ${d3.timeFormat("%B %Y")(timelineEntry.month)}`}>
				<SummaryMetric value={monthSummary.commits} label="commits" />
				<SummaryMetric value={monthSummary.authors} label="contributors" />
				<SummaryMetric value={monthSummary.repos} label="repositories" />
				<SummaryMetric value={monthSummary.newRelationships} label="new relationships" />
			</div>

			<div className="network-view-options">
				<div className="network-option-groups">
					<div>
						<span className="network-option-label">Layout</span>
						<ToggleButtonGroup value={layoutMode} exclusive onChange={(_, value) => value && setLayoutMode(value)} size="small" aria-label="Collaboration layout">
							<ToggleButton value="bipartite">Bipartite</ToggleButton>
							<ToggleButton value="force">Force network</ToggleButton>
						</ToggleButtonGroup>
					</div>
					<div>
						<span className="network-option-label">Time window</span>
						<ToggleButtonGroup
							value={viewMode}
							exclusive
							onChange={(_, value) => value && setViewMode(value)}
							size="small"
							aria-label="Collaboration time window"
						>
							<ToggleButton value="current">Current month</ToggleButton>
							<ToggleButton value="rolling">Rolling 3 months</ToggleButton>
							<ToggleButton value="cumulative">Cumulative</ToggleButton>
						</ToggleButtonGroup>
					</div>
				</div>
				<FormControlLabel
					control={<Switch checked={crossForkOnly} onChange={(event) => setCrossForkOnly(event.target.checked)} size="small" />}
					label="Cross-fork contributors only"
				/>
			</div>

			<div className="network-slider-row">
				<span>{d3.timeFormat("%b %Y")(timeline[0].month)}</span>
				<Slider
					value={monthIndex}
					onChange={(_, value) => changeMonth(value)}
					step={1}
					min={0}
					max={timeline.length - 1}
					size="small"
					aria-label="Collaboration month"
				/>
				<span>{d3.timeFormat("%b %Y")(timeline[timeline.length - 1].month)}</span>
			</div>

			<div className="network-legend" aria-label="Relationship legend">
				<span><i className="relation-new" />New relationship</span>
				<span><i className="relation-active" />Active this month</span>
				<span><i className="relation-history" />Earlier relationship</span>
			</div>

			{layoutMode === "force" ? (
				<ForceNetwork links={visibleLinks} month={timelineEntry.month} />
			) : <div className="network-canvas">
				<svg
					viewBox={`0 0 ${CHART_WIDTH} ${layout.height}`}
					role="img"
					aria-label={`Contributor and repository relationships in ${d3.timeFormat("%B %Y")(timelineEntry.month)}`}
				>
					<text className="network-column-title" x={LEFT_X} y="26" textAnchor="middle">Contributors</text>
					<text className="network-column-title" x={RIGHT_X} y="26" textAnchor="middle">Repositories</text>

					<g className="network-links">
						{visibleLinks.map((link) => {
							const author = layout.authorMap.get(link.author);
							const repo = layout.repoMap.get(link.repo);
							if (!author || !repo) return null;
							return (
								<path
									key={`${link.author}|${link.repo}`}
									className={`network-link network-link-${link.status}`}
									d={`M${author.x},${author.y} C${author.x + 220},${author.y} ${repo.x - 220},${repo.y} ${repo.x},${repo.y}`}
									style={{ strokeWidth: Math.min(7, 1.25 + Math.sqrt(link.periodCount)) }}
								>
									<title>{`${link.author} → ${link.repo}: ${link.monthCount} commits this month, ${link.periodCount} in this view, ${link.totalCount} total`}</title>
								</path>
							);
						})}
					</g>

					<g className="network-nodes">
						{visibleAuthors.map((author) => <NetworkNode key={author.id} node={author} type="author" />)}
						{visibleRepos.map((repo) => <NetworkNode key={repo.id} node={repo} type="repo" />)}
					</g>
				</svg>
			</div>}
		</div>
	);
}

function ForceNetwork({ links, month }) {
	const svgRef = useRef(null);
	const positionsRef = useRef(new Map());

	useEffect(() => {
		const svg = d3.select(svgRef.current);
		svg.selectAll("*").remove();
		const height = Math.max(520, Math.min(760, 360 + links.length * 4));
		svg
			.attr("viewBox", `0 0 ${CHART_WIDTH} ${height}`)
			.attr("role", "img")
			.attr("aria-label", `Force-directed contributor network in ${d3.timeFormat("%B %Y")(month)}`);
		const viewport = svg.append("g");
		svg.call(d3.zoom().scaleExtent([0.55, 5]).on("zoom", (event) => viewport.attr("transform", event.transform)));

		const nodeCounts = new Map();
		links.forEach((link) => {
			nodeCounts.set(`author:${link.author}`, (nodeCounts.get(`author:${link.author}`) || 0) + link.periodCount);
			nodeCounts.set(`repo:${link.repo}`, (nodeCounts.get(`repo:${link.repo}`) || 0) + link.periodCount);
		});
		const nodes = [
			...new Set(links.map((link) => link.author)),
		].map((id) => createForceNode(id, "author", nodeCounts, positionsRef.current, height)).concat(
			[...new Set(links.map((link) => link.repo))].map((id) => createForceNode(id, "repo", nodeCounts, positionsRef.current, height))
		);
		const forceLinks = links.map((link) => ({ ...link, source: `author:${link.author}`, target: `repo:${link.repo}` }));

		const linkSelection = viewport.append("g")
			.selectAll("line")
			.data(forceLinks, (link) => `${link.author}|${link.repo}`)
			.join("line")
			.attr("class", (link) => `network-link network-link-${link.status}`)
			.attr("stroke-width", (link) => Math.min(7, 1.25 + Math.sqrt(link.periodCount)));
		linkSelection.append("title").text((link) => `${link.author} → ${link.repo}: ${link.monthCount} commits this month, ${link.periodCount} in this view, ${link.totalCount} total`);

		const nodeSelection = viewport.append("g")
			.selectAll("g")
			.data(nodes, (node) => node.key)
			.join("g")
			.attr("class", (node) => `force-node force-node-${node.type}`);
		nodeSelection.append("rect")
			.attr("x", (node) => -node.width / 2)
			.attr("y", -13)
			.attr("width", (node) => node.width)
			.attr("height", 26)
			.attr("rx", 5);
		nodeSelection.append("text")
			.attr("text-anchor", "middle")
			.attr("y", 4)
			.text((node) => truncate(node.id, 28));
		nodeSelection.append("title").text((node) => `${node.type === "repo" ? "Repository" : "Contributor"}: ${node.id}\n${node.count} commits in this view`);

		const simulation = d3.forceSimulation(nodes)
			.force("link", d3.forceLink(forceLinks).id((node) => node.key).distance(120).strength(0.3))
			.force("charge", d3.forceManyBody().strength(-260))
			.force("center", d3.forceCenter(CHART_WIDTH / 2, height / 2))
			.force("collision", d3.forceCollide().radius((node) => node.width / 2 + 14).strength(0.85))
			.on("tick", () => {
				linkSelection
					.attr("x1", (link) => link.source.x)
					.attr("y1", (link) => link.source.y)
					.attr("x2", (link) => link.target.x)
					.attr("y2", (link) => link.target.y);
				nodeSelection.attr("transform", (node) => `translate(${node.x},${node.y})`);
				nodes.forEach((node) => positionsRef.current.set(node.key, { x: node.x, y: node.y }));
			});

		nodeSelection.call(d3.drag()
			.on("start", (event, node) => {
				if (!event.active) simulation.alphaTarget(0.25).restart();
				node.fx = node.x;
				node.fy = node.y;
			})
			.on("drag", (event, node) => {
				node.fx = event.x;
				node.fy = event.y;
			})
			.on("end", (event, node) => {
				if (!event.active) simulation.alphaTarget(0);
				node.fx = null;
				node.fy = null;
			}));

		return () => simulation.stop();
	}, [links, month]);

	return <div className="network-canvas network-force-canvas"><svg ref={svgRef} /></div>;
}

function createForceNode(id, type, counts, positions, height) {
	const key = `${type}:${id}`;
	const prior = positions.get(key);
	const seed = hashString(key);
	return {
		id,
		key,
		type,
		count: counts.get(key) || 0,
		width: Math.max(82, Math.min(190, truncate(id, 28).length * 7 + 24)),
		x: prior?.x ?? 180 + (seed % 640),
		y: prior?.y ?? 80 + ((seed * 17) % Math.max(120, height - 160)),
	};
}

function hashString(value) {
	return [...value].reduce((hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) >>> 0, 0);
}

function SummaryMetric({ value, label }) {
	return <div><strong>{value}</strong><span>{label}</span></div>;
}

function NetworkNode({ node, type }) {
	const width = type === "repo" ? 176 : 158;
	const x = type === "repo" ? node.x : node.x - width;
	return (
		<g className={`network-node network-node-${type}`}>
			<rect x={x} y={node.y - 13} width={width} height="26" rx="5" />
			<text x={type === "repo" ? x + 10 : node.x - 10} y={node.y + 4} textAnchor={type === "repo" ? "start" : "end"}>{truncate(node.id, 24)}</text>
			<title>{node.id}</title>
		</g>
	);
}

function buildMonthlyTimeline(data) {
	if (!data.length) return [];
	const validData = data
		.map((item) => ({ ...item, parsedDate: new Date(item.date) }))
		.filter((item) => !Number.isNaN(item.parsedDate.getTime()));
	if (!validData.length) return [];

	const start = d3.timeMonth.floor(d3.min(validData, (item) => item.parsedDate));
	const end = d3.timeMonth.offset(d3.timeMonth.floor(d3.max(validData, (item) => item.parsedDate)), 1);
	const months = d3.timeMonths(start, end);
	const byMonth = d3.group(validData, (item) => +d3.timeMonth.floor(item.parsedDate));
	const cumulative = new Map();
	const firstSeen = new Map();

	return months.map((month, monthIndex) => {
		const current = new Map();
		(byMonth.get(+month) || []).forEach((item) => {
			const key = `${item.author}\u0000${item.repo}`;
			current.set(key, (current.get(key) || 0) + 1);
		});
		current.forEach((count, key) => {
			if (!firstSeen.has(key)) firstSeen.set(key, monthIndex);
			cumulative.set(key, (cumulative.get(key) || 0) + count);
		});

		return {
			index: monthIndex,
			month,
			current: new Map(current),
			cumulative: new Map(cumulative),
			firstSeen: new Map(firstSeen),
		};
	});
}

function getLinksForMode(timeline, monthIndex, mode) {
	const entry = timeline[Math.min(monthIndex, timeline.length - 1)];
	const periodCounts = new Map();
	if (mode === "current") {
		entry.current.forEach((count, key) => periodCounts.set(key, count));
	} else if (mode === "rolling") {
		const windowStart = Math.max(0, monthIndex - 2);
		for (let index = windowStart; index <= monthIndex; index += 1) {
			timeline[index].current.forEach((count, key) => {
				periodCounts.set(key, (periodCounts.get(key) || 0) + count);
			});
		}
	} else {
		entry.cumulative.forEach((count, key) => periodCounts.set(key, count));
	}

	return Array.from(periodCounts, ([key, periodCount]) => {
		const [author, repo] = key.split("\u0000");
		const monthCount = entry.current.get(key) || 0;
		return {
			author,
			repo,
			periodCount,
			monthCount,
			totalCount: entry.cumulative.get(key) || periodCount,
			status: entry.firstSeen.get(key) === monthIndex ? "new" : monthCount > 0 ? "active" : "history",
		};
	});
}

function getMonthSummary(entry) {
	const authors = new Set();
	const repos = new Set();
	let commits = 0;
	let newRelationships = 0;
	entry.current.forEach((count, key) => {
		const [author, repo] = key.split("\u0000");
		authors.add(author);
		repos.add(repo);
		commits += count;
		if (entry.firstSeen.get(key) === entry.index) newRelationships += 1;
	});
	return { commits, authors: authors.size, repos: repos.size, newRelationships };
}

function buildStableLayout(data) {
	const authorStats = d3.rollups(data, (items) => items.length, (item) => item.author)
		.sort((a, b) => d3.descending(a[1], b[1]));
	const repoStats = d3.rollups(data, (items) => items.length, (item) => item.repo)
		.sort((a, b) => d3.descending(a[1], b[1]));
	const rowCount = Math.max(authorStats.length, repoStats.length, 1);
	const height = Math.max(440, rowCount * 32 + 72);
	const yScale = (index, count) => count <= 1 ? height / 2 : 54 + index * ((height - 92) / (count - 1));
	const authors = authorStats.map(([id, count], index) => ({ id, count, x: LEFT_X, y: yScale(index, authorStats.length) }));
	const repos = repoStats.map(([id, count], index) => ({ id, count, x: RIGHT_X, y: yScale(index, repoStats.length) }));
	return {
		authors,
		repos,
		authorMap: new Map(authors.map((node) => [node.id, node])),
		repoMap: new Map(repos.map((node) => [node.id, node])),
		height,
	};
}

function truncate(value, limit) {
	if (!value) return "Unknown";
	return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

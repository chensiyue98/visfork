import React, { useMemo, useState } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { classifyCommit } from "./Regex";

const INTENTS = [
	{ key: "adaptive", label: "Feature & environment changes", short: "Adaptive", color: "#1769e0" },
	{ key: "corrective", label: "Bug fixes", short: "Corrective", color: "#e05a33" },
	{ key: "perfective", label: "Code & documentation quality", short: "Perfective", color: "#7756b3" },
	{ key: "unknown", label: "Unclassified", short: "Unknown", color: "#a7b1b9" },
];

const formatPercent = (value) => `${Math.round(value * 100)}%`;
const shortRepo = (repo) => repo?.split("/").pop() || repo;

export default function MaintenanceIntent({ data, rootRepo }) {
	const [view, setView] = useState("share");
	const [sortBy, setSortBy] = useState("total");

	const analysis = useMemo(() => {
		const repos = new Map();
		let classified = 0;
		let ambiguous = 0;

		data.forEach((commit) => {
			const result = classifyCommit(commit.message);
			if (!repos.has(commit.repo)) {
				repos.set(commit.repo, {
					repo: commit.repo,
					total: 0,
					adaptive: [], corrective: [], perfective: [], unknown: [],
				});
			}
			const row = repos.get(commit.repo);
			row.total += 1;
			row[result.type].push({ ...commit, classification: result });
			if (result.type !== "unknown") classified += 1;
			if (result.ambiguous) ambiguous += 1;
		});

		const normalizedRoot = rootRepo
			?.replace(/^https?:\/\/(www\.)?github\.com\//, "")
			.replace(/\/$/, "");
		const rows = [...repos.values()].sort((a, b) => {
			if (a.repo === normalizedRoot) return -1;
			if (b.repo === normalizedRoot) return 1;
			const aValue = sortBy === "total" ? a.total : a[sortBy].length / a.total;
			const bValue = sortBy === "total" ? b.total : b[sortBy].length / b.total;
			return bValue - aValue || a.repo.localeCompare(b.repo);
		});
		const totals = INTENTS.reduce((acc, intent) => {
			acc[intent.key] = rows.reduce((sum, row) => sum + row[intent.key].length, 0);
			return acc;
		}, {});
		const dominant = INTENTS.filter((intent) => intent.key !== "unknown")
			.sort((a, b) => totals[b.key] - totals[a.key])[0];
		const correctiveLeader = [...rows].sort(
			(a, b) => b.corrective.length / b.total - a.corrective.length / a.total
		)[0];

		return { rows, totals, classified, ambiguous, dominant, correctiveLeader };
	}, [data, rootRepo, sortBy]);

	const maxTotal = Math.max(1, ...analysis.rows.map((row) => row.total));
	const coverage = data.length ? analysis.classified / data.length : 0;

	return (
		<div className="maintenance-intent">
			<div className="maintenance-notice">
				<span>Rule-based classification</span>
				Commit messages are matched against maintenance keywords. Hover a segment to inspect the evidence; unknown and multi-match messages remain visible.
			</div>
			<div className="maintenance-summary" aria-label="Maintenance classification summary">
				<div><strong>{formatPercent(coverage)}</strong><span>classified coverage</span></div>
				<div><strong>{analysis.dominant?.short || "—"}</strong><span>dominant intent</span></div>
				<div title={analysis.correctiveLeader?.repo}><strong>{shortRepo(analysis.correctiveLeader?.repo) || "—"}</strong><span>most corrective-focused</span></div>
				<div><strong>{analysis.totals.unknown || 0}</strong><span>unclassified · {analysis.ambiguous} multi-match</span></div>
			</div>

			<div className="maintenance-toolbar">
				<div>
					<span className="maintenance-control-label">Compare by</span>
					<ToggleButtonGroup value={view} exclusive size="small" onChange={(_, value) => value && setView(value)} aria-label="Maintenance comparison mode">
						<ToggleButton value="share">Share</ToggleButton>
						<ToggleButton value="volume">Volume</ToggleButton>
					</ToggleButtonGroup>
				</div>
				<label className="maintenance-sort">
					<span className="maintenance-control-label">Sort repositories</span>
					<select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
						<option value="total">Commit volume</option>
						{INTENTS.map((intent) => <option value={intent.key} key={intent.key}>{intent.short} share</option>)}
					</select>
				</label>
			</div>

			<div className="maintenance-legend" aria-label="Maintenance categories">
				{INTENTS.map((intent) => <span key={intent.key}><i style={{ background: intent.color }} />{intent.label}</span>)}
			</div>

			<div className="maintenance-chart">
				<div className="maintenance-scale"><span>Repository</span><span>{view === "share" ? "Share of commits" : `Commit volume · max ${maxTotal}`}</span></div>
				{analysis.rows.map((row) => {
					const barWidth = view === "share" ? 100 : (row.total / maxTotal) * 100;
					return (
						<div className="maintenance-row" key={row.repo}>
							<div className="maintenance-repo" title={row.repo}><strong>{shortRepo(row.repo)}</strong><span>{row.repo}</span></div>
							<div className="maintenance-track">
								<div className="maintenance-bar" style={{ width: `${barWidth}%` }}>
									{INTENTS.map((intent) => {
										const commits = row[intent.key];
										const share = commits.length / row.total;
										if (!commits.length) return null;
										const examples = commits.slice(0, 3).map((commit) => {
											const evidence = commit.classification.evidence ? ` [${commit.classification.evidence}]` : "";
											return `• ${commit.message?.split("\n")[0]}${evidence}`;
										}).join("\n");
										const title = `${intent.label}: ${commits.length} commits (${formatPercent(share)})\n${examples}`;
										return <div className="maintenance-segment" key={intent.key} style={{ width: `${share * 100}%`, background: intent.color }} title={title} aria-label={title} tabIndex={0}>{share >= .12 && <span>{view === "share" ? formatPercent(share) : commits.length}</span>}</div>;
									})}
								</div>
								<span className="maintenance-total">{row.total}</span>
							</div>
						</div>
					);
				})}
			</div>
			<p className="maintenance-footnote">Corrective and perfective evidence takes precedence over broad adaptive verbs such as “update”. Multi-match commits use the highest-priority label and are included in the ambiguity count.</p>
		</div>
	);
}

import * as d3 from "d3";
import cloud from "d3-cloud";
import { useEffect, useRef } from "react";
import nlp from "compromise/two";
import { removeStopwords } from "stopword";

const MessageCloud = (text) => {
	const svgRef = useRef(null);

	useEffect(() => {
		// object to text
		text = text.text;

		const data = generateWordStats(text);
		
		const fontFamily = "Arial, Helvetica, sans-serif";

		const width = 300;
		const height = 300;

		const maxFontSize = 60;
		const minFontSize = 20;

		// remove the previous svg
		d3.select(svgRef.current).selectAll("*").remove();

		const layout = cloud()
			.font(fontFamily)
			.words(data)
			.padding(0)
			// .rotate(() => ~~(Math.random() * 2) * 90)
			.rotate(() => 0)
			.fontSize((d) => {
				return (
					minFontSize +
					(maxFontSize - minFontSize) * (d.value / d3.max(data, (d) => d.value))
				);
			})
			.size([width, height])
			.on("end", (words) => {
				d3.select(svgRef.current)
					.append("g")
					.attr("transform", `translate(${width / 2},${height / 2})`)
					.selectAll("text")
					.data(words)
					.enter()
					.append("text")
					.style("font-size", (d) => `${d.size}px`)
					// map color
					.style("fill", (d) => {
						switch (d.pos) {
							case "Noun":
								return "#0984e3";
							case "Verb":
								return "#e17055";
							case "Adjective":
								return "#00b894";
							case "Adverb":
								return "#00cec9";
							default:
								return "#2d3436";
						}
					})
					.attr("text-anchor", "middle")
					.attr(
						"transform",
						(d) => `translate(${d.x},${d.y})rotate(${d.rotate})`
					)
					.text((d) => d.text);
			});

		layout.start();
	}, [text]);

	return (
		<div className="border-blue-600 border-solid border-4 rounded-lg bg-slate-50">
			<h1 className="font-bold text-center">Word Cloud</h1>
			<hr className="my-2" />
			<svg ref={svgRef} style={{ width: "300px", height: "300px" }}>
				<g />
			</svg>
		</div>
	);
};

export default MessageCloud;

export function generateWordStats(input) {
	// Use stopword library to remove stop words from input
	let words = input.split(" ");
	words = removeStopwords(words);
	// put words into a string
	words = words.join(" ");

	// remove non-alphabet characters
	// words = words.replace(/[^a-zA-Z ]/g, "");

	// count frequency of each word
	const wordFreq = {};
	words.split(" ").forEach((word) => {
		if (!wordFreq[word]) {
			wordFreq[word] = 0;
		}
		wordFreq[word] += 1;
	});

	// sort the words by frequency
	const wordsSorted = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]);

	let doc = nlp(words);
	let result = [];

	if (wordsSorted.length > 1) {
		wordsSorted.forEach((word) => {
			let text = word[0];
			let pos = doc.out("tags")[0][text];
			if (pos === undefined) {
				return; // skip this iteration if pos is undefined
			} else if (pos.length > 1 && pos[0] === "Value") {
				return;
			}
			let stat = {
				// pos: doc.out("tags")[0][text], // get the first part-of-speech tag
				pos: pos[0],
				text: text,
				value: word[1],
			};
			result.push(stat);
		});
	}
	// get the top 10 results
	result = result.slice(0, 10);

	return result;
}

import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";
import * as d3 from "d3";
import cloud from "d3-cloud";
import { useEffect, useState, useRef } from "react";

const MessageCloud = (text) => {
	const svgRef = useRef(null);

	useEffect(() => {
		// object to text
		text = text.text;
		console.log(text);
		const result = wordsFromText(text);
		const data = result[0];
		console.log(data);
		const fontFamily = "Arial, Helvetica, sans-serif";

		const width = 300;
		const height = 300;

		console.log(width, height);
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
							case "NOUN":
								return "#67001f";
							case "VERB":
								return "#ff7f0e";
							case "ADJ":
								return "#878787";
							case "ADV":
								return "#d62728";
							case "PROPN":
								return "#9467bd";
							default:
								return "#333";
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
		<div>
			<h1>Word Cloud</h1>

			<svg ref={svgRef} style={{ width: "300px", height: "300px" }}>
				<g />
			</svg>
		</div>
	);
};

function wordsFromText(text) {
	const nlp = winkNLP(model);
	const its = nlp.its;
	const doc = nlp.readDoc(text);
	// Category the words by part of speech
	const tokensFTByPoS = Object.create(null);
	tokensFTByPoS.NOUN = Object.create(null);
	tokensFTByPoS.ADJ = Object.create(null);
	tokensFTByPoS.VERB = Object.create(null);
	tokensFTByPoS.ADV = Object.create(null);
	tokensFTByPoS.PROPN = Object.create(null);
	doc.tokens().each((t) => {
		const pos = t.out(its.pos);
		const token = t.out(its.lemma);
		if (!tokensFTByPoS[pos]) return;

		tokensFTByPoS[pos] = tokensFTByPoS[pos] || Object.create(null);
		tokensFTByPoS[pos][token] =
			tokensFTByPoS[pos][token] || Object.create(null);
		tokensFTByPoS[pos][token].value =
			1 + (tokensFTByPoS[pos][token].value || 0);
		tokensFTByPoS[pos][token].sentences =
			tokensFTByPoS[pos][token].sentences || new Set();
		tokensFTByPoS[pos][token].sentences.add(t.parentSentence().index());
	});

	let freqTable = new Array();
	for (const pos in tokensFTByPoS) {
		freqTable = Object.keys(tokensFTByPoS[pos])
			.map((key) => ({
				text: key,
				value: tokensFTByPoS[pos][key].value,
				pos: pos,
				sentences: Array.from(tokensFTByPoS[pos][key].sentences),
			}))
			.filter((e) => e.value > 1 && e.text.length > 2)
			.concat(freqTable);
	}

	return [freqTable.sort((a, b) => b.value - a.value), doc];
}

export default MessageCloud;

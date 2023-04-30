import jsondata from "./test.json";

export default function handler(req, res) {
	// Load Naive Bayes Text Classifier
	var Classifier = require("wink-naive-bayes-text-classifier");
	// Instantiate
	var nbc = Classifier();
	// Load wink nlp and its model
	const winkNLP = require("wink-nlp");
	// Load language model
	const model = require("wink-eng-lite-web-model");
	const nlp = winkNLP(model);
	const its = nlp.its;

	const prepTask = function (text) {
		const tokens = [];
		nlp
			.readDoc(text)
			.tokens()
			// Use only words ignoring punctuations etc and from them remove stop words
			.filter((t) => t.out(its.type) === "word" && !t.out(its.stopWordFlag))
			// Handle negation and extract stem of the word
			.each((t) =>
				tokens.push(
					t.out(its.negationFlag) ? "!" + t.out(its.stem) : t.out(its.stem)
				)
			);

		return tokens;
	};
	nbc.definePrepTasks([prepTask]);
	// Configure behavior
	nbc.defineConfig({ considerOnlyPresence: true, smoothingFactor: 0.5 });
	// Train!
	// train each line of json file
	// stop training after 1000 lines
	var i = 0;

	for (const line of jsondata) {
		if (i > 1000) {
			break;
		}
		nbc.learn(line.message, line.class);
		i++;
	}

	// Consolidate all the training!!
	nbc.consolidate();
	// Start predicting...
	var predict_text = "Fix bug in autoloan and add prepay function";
	console.log(nbc.predict(predict_text));
	// -> autoloan
	console.log(nbc.computeOdds(predict_text));
	// const out = nbc.exportJSON();
	// -> prepay
	res.status(200).json({ name: "Wink.js" });
	// res.status(200).json(out);
}

const core_adaptive_terms = [
	"add(?:s|ed|ing)?",
	"creat(?:e|es|ing)",
	"disabl(?:e|es|ed|ing)",
	"implement(?:ed|s|ing)?",
	"import(?:s|ed|ing)?",
	"introduc(?:e|es|ed|ing)",
	"port(?:s|ed|ing)?",
	"provid(?:e|es|ed|ing)",
	"updat(?:e|es|ed|ing)",
	"upgrad(?:e|es|ed|ing)",
	"(?:un)?hid(?:e|es|den)",
	"allow(?:s|ed|ing)?",
	"buil(?:t|ds|ing)",
	"calibirat(?:e|es|ed|ing)",
	"configure",
	"deferr(?:ed|s|ing)?",
	"enhanc(?:e|es|ed|ing)",
	"extend(?:s|ed|ing)?",
	"form(?:ed|s|ing)?",
	"report(?:s|ed|ing)?",
	"support(s|ed|ing)?",
];

const adaptive = new RegExp(core_adaptive_terms.join("|"), "i");

const core_bug_terms = [
	"bug(s|z)?",
	"bug(?:-|s)?fix(es)?",
	"defect(?:s)?",
	"error(?:s)?",
	"failur(?:ing|e|es|ed)",
	"fault(s)?",
	"fix(ed|es|ing)?",
	"fixing(?:s)?",
	"incorrect(ly)?",
	"mistake(s|n|d|nly)?",
	"problem(?:s)?",
];

const bug = new RegExp(core_bug_terms.join("|"), "i");

const core_perfective_terms = [
	"doc(s|z)?",
	"docum(?:ent|ation)(?:s)?",
	"style(s|z)?",
	"typo(s|z)?",
	"refactor(s|z)?",
	"refactor(?:ed|s|ing)?",
	"re(?:-|)factor(?:ed|s|ing)?",
	"readme",
];

const perfective = new RegExp(core_perfective_terms.join("|"), "i");

const classifiers = [
	{ type: "corrective", regex: bug },
	{ type: "perfective", regex: perfective },
	{ type: "adaptive", regex: adaptive },
];

// Corrective and perfective matches intentionally take precedence over broad
// adaptive verbs such as "update". The full result is exposed so the UI can
// communicate evidence and ambiguity instead of presenting a black-box label.
export const classifyCommit = (text = "") => {
	const matches = classifiers
		.map(({ type, regex }) => {
			const match = text.match(regex);
			return match ? { type, evidence: match[0] } : null;
		})
		.filter(Boolean);

	return {
		type: matches[0]?.type || "unknown",
		evidence: matches[0]?.evidence || null,
		matches,
		ambiguous: matches.length > 1,
	};
};

const Classify = (text) => classifyCommit(text).type;

export default Classify;

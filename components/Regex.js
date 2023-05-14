const Classify = (text) => {
	// match the message against the regex
	// if it matches, return the category
	// if it doesn't match, return unknown
	var type = null;
	if (text.match(adaptive)) {
		type = "adaptive";
	} else if (text.match(bug)) {
		type = "corrective";
	} else if (text.match(perfective)) {
		type = "perfective";
	} else {
		type = "unknown";
	}
	return type;
};

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

export default Classify;

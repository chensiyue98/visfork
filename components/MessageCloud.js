import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";
import * as d3 from "d3";
import cloud from "d3-cloud";
import { useEffect, useState, useRef } from "react";

const MessageCloud = () => {
	const svgRef = useRef(null);
	var message = `Update README.md
	updated rdf gems
	
	more TODO
	
	git-svn-id: ae92b08b608af1c8cefa3e10d2325ea527204e07@14617 3eda493b-6a19-0410-b2e0-ec8ea4dd8fda
	
	[DDW-331] network type and default value
	
	config/git-sync: add envvar prefix, fix README
	
	adplug: update homepage
	
	Closes Homebrew/homebrew#49965.
	
	Signed-off-by: Andrew Janke <02e0a999c50b1f88df7a8f5a04e1b76b35ea6a88@apjanke.net>
	
	disble this now to avoid a crash
	
	git-svn-id: ae92b08b608af1c8cefa3e10d2325ea527204e07@19950 3eda493b-6a19-0410-b2e0-ec8ea4dd8fda
	
	Clarify doctoring
	
	Optimization
	
	minor changes in log-det
	
	Remove mentions on anonymity in debian folder.
	
	These should never have been there, bitcoin isnt anonymous without
	a ton of work that virtually no users will ever be willing and
	capable of doing.
	
	Release 828
	
	
	Add missing SAML property
	
	undo_move with u key
	AbstractUndoableMove.java - add methods: 'containsUnit', 'containsAnyUnits(Set<Unit> units)', and a convenience constructor. Update UndoableMove.java to use the convenience constructor.
	
	Updating ru.po - stylistics.
	
	[[originally from CVS; cvs2svn created svn r7003]]
	
	Add Types.declare helper for better inheritance control
	
	pcsclite: update to 1.8.20
	
	Fixes for failing tests
	
	missing semicolon
	Bug #3393
	[centreon-broker] Purge table 'logs' not done
	
	git-svn-id: 25a0ac75d3222d69293b2750b310215dcabd6451@13112 6bcd3966-0018-0410-8128-fd23d134de7e
	
	Add title for buttons optionalButtons in PrismObjectForm
	
	added a variant_verify to validate SVs
	
	(svn r19026) -Codechange: Move a constant computation out of the loop.
	
	switch to git and simplify update algorithm
	
	git-svn-id: f2acecaac6fbd5a03f3d4799db58dda434111981@25711 3eda493b-6a19-0410-b2e0-ec8ea4dd8fda
	
	resources fix
	
	Merge pull request #8471 from brianteeman/massmail
	
	BCC language string in Mass Mail
	[CSL-1901] Fix hscolour version.
	
	Fix a few low-hanging findbugs issues (#862)
	
	
	require ToS for api (bug 777114)
	
	Add immutable.Map operations
	
	Merge Add one use case for configdrive
	Add test-cases for 32-bit and no-compressed oops scenarios.
	
	environ should now work together with NEB, courtesy of Oliviero
	
	
	git-svn-id: 5d23e60e07e2295b11e715623d9852ba2611792f@11287 c92efa57-630b-4861-b058-cf58834340f0
	
	PXE and SSH validate() method to check for a port
	
	The PXE and SSH server depends on a MACAddress to work, before the
	validate() method of the PXE and SSH drivers didn't check whether the
	node had a port associated with it or not making it possible to start
	a provision/power state change without and address that would fail. So,
	this patch is improving the validate() method of the PXE and SSH driver
	to check for a port.
	
	Closes-Bug: #1272045
	Change-Id: I1e8deb91558478973b280ed25bf3b90da4e2b045
	
	fix spelling of function name in perl6multisub.pmc
	
	Antroji linksniuot◊≥¬≥÷≤¬≤◊≤¬≤÷≤¬¥◊≥¬≥◊í‚Ç¨‚Ñ¢◊≥‚Äô◊í‚Ç¨ÔøΩ÷≤¬¨◊≥‚Äô◊í‚Äö¬¨◊ü¬ø¬Ω
	
	
	git-svn-id: fc35eccb03ccef1c432fd0fcf5295fcceaca86a6@33857 bcba8976-2d24-0410-9c9c-aab3bd5fdfd6
	
	Added missing import statement
	
	Update example
	
	Merge pull request #645 from arvindsv/fix_dropdown_button_alignment
	
	#297 - Fix action button alignment.
	[TASK] The Create.js update script is outdated
	
	This change updates the Create.js update script to match
	their changed build process from cake to grunt.
	Besides that it follows their new naming scheme in
	filenames, but does NOT update Create.js yet.
	
	Change-Id: Ic091c13f938c116abac07225d6ff61674baca18b
	Original-Commit-Hash: 48cc273de2dc1e8f4d17c89a8632726368d9cc25
	
	Changing css class name, extracting component, adding unique key to elem
	
	Merge pull request #1497 from ngokevin/commcreate
	
	refactor the way comm notes/threads are created (precursor to bug 946459)
	i40evf: support configurable crc stripping
	
	Configurable CRC stripping needs to be supported in VF,
	and the configuration should be finally set in relevant
	RX queue context with PF host support.
	
	Signed-off-by: Helin Zhang <aba9dfdb1a6ec8bf1ff66b95272c029f8dfde1b1@intel.com>
	Acked-by: Konstantin Ananyev <cbd5212b59ab42a210d72992d23a3aa17cfd3eaf@intel.com>
	
	split up structural variation image and table
	
	Fix more link on history page
	
	Fix message in process
	
	Bug: 63968
	Change-Id: If81fee954025b1ebc11d7d4a86eb70377b1f2233
	
	Create a default English text table. (dm)
	
	
	git-svn-id: 30a5f035a20f1bc647618dbad7eea2a951b61b7c@4157 91a5dbb7-01b9-0310-9b5f-b28072856b6e
	
	Merge pull request #1912 from jjgao/rc
	
	merge hotfix to rc
	pass non-simple structs always by reference
	
	2007-11-30  Juerg Billeter  <j@bitron.ch>
	
		* gobject/valaccodegenerator.vala,
		  gobject/valaccodegeneratorinvocationexpression.vala,
		  gobject/valaccodegeneratormethod.vala: pass non-simple structs always
		  by reference
	
		* tests/structs.exp, tests/structs.vala: test struct parameters
	
	svn path=/trunk/; revision=742
	
	remove EmailOwnerData property from interface
	
	INFUND-1443 Added link to print view
	
	Remove prompts from init command; Update template for Project Configuration File
	
	kernel: add missing CAN related config symbol
	
	Signed-off-by: Felix Fietkau <nbd@openwrt.org>
	
	git-svn-id: c673a1a018ba15e3442847f58d2337db82164816@47035 3c298f89-4303-0410-b956-a3cf2f4a3e73
	
	cortex_a9: check if MMU is enabled on APB read/write memory
	
	Signed-off-by: Luca Ellero <1c37a17361538733629df6c45e64c006d75629a7@gmail.com>
	
	adding sample locations to carbon apps
	
	(read_minibuf): Make minibuffer frame visible when minibuffer activated.
	
	Mark failed exports by shop
	
	Fixed labeling of adjoined plots
	
	Add Atos bss web service support
	
	busybox: restore init scripts
	
	Since the removal of the busybox menuconfig entries, the init scripts
	for cron, telnet and ntp are not packaged anymore. Unconditionally
	ship them from now on.
	
	Signed-off-by: Jo-Philipp Wich <jow@openwrt.org>
	
	git-svn-id: c673a1a018ba15e3442847f58d2337db82164816@39123 3c298f89-4303-0410-b956-a3cf2f4a3e73
	
	qemu: save image: Split out user provided XML checker
	
	Extract code used to check save image XMLs provided by users to separate
	use.
	
	Deactivate negative dependencies generation
	
	With current updater version this would expose bug. This commit will be
	reverted after updater fix for that is released.
	
	* menu-bar.el: Don't make Services menu.
	
	More updates to Server and Bus: synchronous bus access works also for internal server.
	
	Update .gitignore (lib/hipe/boot_ebin)
	
	* ignore /lib/hipe/boot_ebin/hipe.app
	* ignore /lib/hipe/boot_ebin/hipe.appup
	
	refactored user serialization
	
	Merge pull request #701 from liveblog/feat/ads-vlad
	
	Feat/ads vlad
	
	correct channel for video compression, updater, backup and LED color
	
	extend test checks to check for weird behaviour
	
	[options] Fixed section IDs.
	
	feat: design name form validation
	
	slw: Modify the power9 stop0_lite latency & residency
	
	Currently skiboot exposes the exit-latency for stop0_lite as 200ns and
	the target-residency to be 2us.
	
	However, the kernel cpu-idle infrastructure rounds up the latency to
	microseconds and lists the stop0_lite latency as 0us, putting it on
	par with snooze state. As a result, when the predicted latency is
	small (< 1us), cpuidle will select stop0_lite instead of snooze. The
	difference between these states is that snooze doesn't require an
	interrupt to exit from the state, but stop0_lite does. And the value
	200ns doesn't include the interrupt latency.
	
	This shows up in the context_switch2 benchmark
	(http://ozlabs.org/~anton/junkcode/context_switch2.c) where the number
	of context switches per second with the stop0_lite disabled is found
	to be roughly 30% more than with stop0_lite enabled.
	
	===============================================================================
	x latency_200ns_residency_2us
	+ latency_200ns_residency_2us_stop0_lite_disabled
		N           Min           Max        Median           Avg        Stddev
	x 100        222784        473466        294510     302295.26       45380.6
	+ 100        205316        609420        385198     396338.72     78135.648
	Difference at 99.0% confidence
		94043.5 +/- 23276.2
		31.1098% +/- 7.69983%
		(Student's t, pooled s = 63892.8)
	===============================================================================
	
	This can be correlated with the number of times cpuidle enters
	stop0_lite compared to snooze.
	===================================================================
	latency=200ns, residency=2us
	   stop0_lite enabled.
		* snooze usage      = 7
		* stop0 lite usage  = 3200324
		* stop1 lite usage  = 6
	 stop0_lite disabled
		* snooze usage: 287846
		* stop0_lite usage: 0
		* stop1_lite usage: 0
	==================================================================
	
	Hence, bump up the exit latency of stop0_lite to 1us. Since the target
	residency is chosen to be 10 times the exit latency, set the target
	residency to 10us.
	
	With these values, we see a 50% improvement in the number of context
	switches:
	=====================================================================
	x latency_200ns_residency_2us
	+ latency_1us_residency_10us
		N           Min           Max        Median           Avg        Stddev
	x 100        222784        473466        294510     302295.26       45380.6
	+ 100        281790        710784        514878     510224.62     85163.252
	Difference at 99.0% confidence
		207929 +/- 24858.3
		68.7835% +/- 8.22319%
		(Student's t, pooled s = 68235.5)
	=====================================================================
	
	The cpuidle usage statistics show that we choose stop0_lite less often
	in such cases.
	
	latency = 1us, residency = 10us
		stop0_lite enabled
		* snooze usage      = 536808
		* stop0 lite usage  = 3
		* stop1 lite usage  = 7
	
	Reported-by: Anton Blanchard <14deb5e5e417133e888bf47bb6a3555c9bb7d81c@samba.org>
	Signed-off-by: Gautham R. Shenoy <c13571dbffa0eb89c7f8eebdce482897b0f5a685@linux.vnet.ibm.com>
	Signed-off-by: Vaidyanathan Srinivasan <c012decff9dffda4c10860ab2ba9eb53320d90bc@linux.vnet.ibm.com>
	Signed-off-by: Stewart Smith <ec31ab75ddf977353c8f660f92ea8b23f64aef25@linux.vnet.ibm.com>
	
	update ◊≥¬≥÷≤¬≥◊≥‚Äô◊í‚Äö¬¨◊í‚Ç¨ÔøΩ◊≥¬≤÷≤¬≤◊≤¬≤÷≤¬Æ◊≥¬≤÷≤¬≤◊≤¬≤÷≤¬°◊≥¬≥÷≤¬≥◊≥‚Äô◊í‚Äö¬¨◊í‚Ç¨ÔøΩ◊≥¬≥◊ü¬ø¬Ω◊≤¬≤÷≤¬ø◊≤¬≤÷≤¬Ω◊≥¬≥◊í‚Ç¨‚Ñ¢◊≥‚Äô◊í‚Ç¨ÔøΩ÷≤¬¨◊≤¬≤÷≤¬†◊≥¬≥÷≤¬≥◊≥‚Äô◊í‚Äö¬¨◊í‚Ç¨ÔøΩ◊≥¬≥◊í‚Ç¨‚Ñ¢◊≥‚Äô◊í‚Ç¨ÔøΩ÷≤¬¨◊≥ÔøΩ÷≤¬ø÷≤¬Ω◊≥¬≤÷≤¬≤◊≤¬≤÷≤¬ª◊≥¬≥÷≤¬≥◊≥‚Äô◊í‚Ç¨ÔøΩ÷≤¬¢◊≥¬≥◊ü¬ø¬Ω◊≤¬≤÷≤¬ø◊≤¬≤÷≤¬Ω◊≥¬≤÷≤¬≤◊≤¬≤÷≤¬¢◊≥¬≥÷≤¬≥◊≥‚Äô◊í‚Äö¬¨◊í‚Ç¨ÔøΩ◊≥¬≥◊í‚Ç¨‚Ñ¢◊≥‚Äô◊í‚Ç¨ÔøΩ÷≤¬¨◊≥ÔøΩ÷≤¬ø÷≤¬Ω◊≥¬≤÷≤¬≤◊≤¬≤÷≤¬®◊≥¬≥÷≤¬≥◊≥‚Äô◊í‚Äö¬¨◊í‚Ç¨ÔøΩ◊≥¬≤÷≤¬≤◊≤¬≤÷≤¬©◊≥¬≥◊ü¬ø¬Ω◊≤¬≤÷≤¬ø◊≤¬≤÷≤¬Ω◊≥¬≥÷≤¬≥◊≤¬ª◊ü¬ø¬Ω◊≥¬≤÷≤¬∂◊≥‚Äô◊í‚Äö¬¨◊í‚Äû¬¢◊≥¬≤÷≤¬≤◊≤¬≤÷≤¬Ω◊≥¬≥÷≤¬≥◊≥‚Äô◊í‚Äö¬¨◊ü¬ø¬Ω◊≥¬≥◊ü¬ø¬Ω◊≤¬≤÷≤¬ø◊≤¬≤÷≤¬Ω◊≥¬≤÷≤¬≤◊≤¬≤÷≤¬Æ◊≥¬≥÷≤¬≥◊≥‚Äô◊í‚Äö¬¨÷≤¬¢◊≥¬≤÷≤¬ª◊≥‚Äô◊í‚Äö¬¨÷≤¬†◊≥¬≥◊í‚Ç¨‚Ñ¢◊≥‚Äô◊í‚Ç¨ÔøΩ÷≤¬¨◊≤¬≤÷≤¬°◊≥¬≥÷≤¬≥◊≥‚Äô◊í‚Äö¬¨◊ü¬ø¬Ω◊≥¬≥◊í‚Ç¨‚Ñ¢◊≥‚Äô◊í‚Ç¨ÔøΩ÷≤¬¨◊≥ÔøΩ÷≤¬ø÷≤¬Ω◊≥¬≥◊ü¬ø¬Ω◊≤¬≤÷≤¬ø◊≤¬≤÷≤¬Ω◊≥¬≥÷≤¬≥◊≥‚Äô◊í‚Äö¬¨÷≤¬¢◊≥¬≤÷≤¬ª◊≥‚Äô◊í‚Äö¬¨÷≤¬†◊≥¬≥◊í‚Ç¨‚Ñ¢◊≥‚Äô◊í‚Ç¨ÔøΩ÷≤¬¨◊≤¬≤÷≤¬†◊≥¬≥÷≤¬≥◊≥‚Äô◊í‚Äö¬¨◊ü¬ø¬Ω◊≥¬≥◊ü¬ø¬Ω◊≤¬≤÷≤¬ø◊≤¬≤÷≤¬Ω◊≥¬≥◊í‚Ç¨‚Ñ¢◊≥‚Äô◊í‚Ç¨ÔøΩ÷≤¬¨◊≤¬ª◊ü¬ø¬Ω
	
	Weaken visibility for code generation to enable custom generators.
	
	This publicizes the code generation classes of jscompiler to enable
	other projects to layer custom code generation on top of the provided
	code.
	-------------
	Created by MOE: https://github.com/google/moe
	MOE_MIGRATED_REVID=125203399
	
	Merge pull request #1178 from joelddiaz/ssh-forward
	
	Add -A parameter to forward ssh agent
	Bump the version to 0.13dev
	Adapt to query buttons: click -> mouseUp
	
	ENG-4257: If serialized params is null, use the params to get the
	partition param on replay.
	
	Correct jq pattenr for detecting template change
	
	Relocate reinit of CancellationTokenSource to ensure that it is always recreated.
	
	[Ty][Debug] Extend json printing to symbols
	
	Summary:
	Extend Ty json printing to symbols.
	
	This change will help print a more comprehensive Ty description with changes
	that are coming later on 
	
	Reviewed By: samwgoldman
	
	Differential Revision: D7778306
	
	fbshipit-source-id: a993fb0edef1fbce62333eee8e119de063e59f4c
	
	del CSS from Fondo icon #1483
	
	[Code] Prep. for more GVars
	
	added Juan y yo
	Add arch tagline
	
	8dec381 docs: fix unit tests in toh-pt6 (#24491)
	`;


	useEffect(() => {
		const result = wordsFromText(message);
		const data = result[0];
		console.log(data);
		const fontFamily = "Arial, Helvetica, sans-serif";

		const width = 500;
		const height = 500;

		console.log(width, height);
		const maxFontSize = 60;
		const minFontSize = 20;

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
	}, []);

	return (
		<>
			<h1>Word Cloud</h1>

			<svg ref={svgRef} style={{ width: "500px", height: "500px" }}>
				<g />
			</svg>
		</>
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

function classify(data) {
	// classify the words by key words
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
	const core_adaptive = new RegExp(core_adaptive_terms.join("|"), "i");

	return data.map((d) => {
		if (core_adaptive.test(d.text)) {
			d.class = "core_adaptive";
		}
		return d;
	});
}

export default MessageCloud;

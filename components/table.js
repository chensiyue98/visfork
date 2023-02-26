import React, { useRef, useEffect } from "react";
import { Runtime, Inspector } from "@observablehq/runtime";
import notebook from "56c78b5a38591fda";

function Notebook() {
	const viewofTableRef = useRef();

	useEffect(() => {
		const runtime = new Runtime();
		runtime.module(notebook, (name) => {
			if (name === "viewof table") return new Inspector(viewofTableRef.current);
		});
		return () => runtime.dispose();
	}, []);

	return (
		<>
			<div ref={viewofTableRef} />
		</>
	);
}

export default Notebook;

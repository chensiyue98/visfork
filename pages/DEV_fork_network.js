import React, { useState } from "react";
import axios from "axios";
import Network from "@/components/Network";

export default function App() {
	const token = "Bearer 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";
	axios.defaults.headers.common["Authorization"] = token;

	return (
		<div className="p-10 flex flex-col items-center">
			<Network />
		</div>
	);
}

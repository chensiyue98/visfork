import { useEffect, useRef, useState } from "react";
import MessageCloud from "@/components/MessageCloud";

const App = () => {
	return (
		<div>
			<MessageCloud
				text={`This is a test. The code below adds two new functions to the Date object. Add this to your source code.`}
			/>
		</div>
	);
};

export default App;

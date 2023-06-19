import React from "react";
import JoyRide from "react-joyride";
const TOUR_STEPS = [
	{
		target: "#standard-basic",
		content: "Supports format: OWNER/REPO or https://github.com/OWNER/REPO. Please note that we only support public repositories",
		disableBeacon: true,
	},
    {
		target: "#settings",
		content: "The GitHub API token has a fetching limitation per hour. You can create a new token with your GitHub account",
		disableBeacon: true,
	},
    {
		target: "#merge-buttons",
		content: "Switch between different views. The Full View shows all the commits, while the Merged View shows the diverged commits only",
		disableBeacon: true,
	},
    {
		target: "#overflow-container",
		content: "You can brush over the commits to see the details.",
		disableBeacon: true,
	},
];

const Tour = () => {
	return (
		<>
			<JoyRide
				steps={TOUR_STEPS}
				continuous={true}
				showSkipButton={true}
				showProgress={true}
				styles={{
					tooltipContainer: {
						textAlign: "left",
					},
					buttonNext: {
						backgroundColor: "green",
					},
					buttonBack: {
                        color: "black",
						marginRight: 10,
					},
                    buttonSkip: {
                        color: "red",
                    },
				}}
			/>
		</>
	);
};

export default Tour;

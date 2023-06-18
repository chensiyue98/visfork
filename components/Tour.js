import React from "react";
import JoyRide from "react-joyride";
const TOUR_STEPS = [
	{
		target: "#standard-basic",
		content: "Inut Owner/Repo",
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
						marginRight: 10,
					},
				}}
			/>
		</>
	);
};

export default Tour;

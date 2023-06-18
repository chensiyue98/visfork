/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
		"./app/**/*.{js,ts,jsx,tsx}",
		"./pages/**/*.{js,ts,jsx,tsx}",
		"./components/**/*.{js,ts,jsx,tsx}",

		// Or if using `src` directory:
		"./src/**/*.{js,ts,jsx,tsx}",
	],
  theme: {
    extend: {
		width: {
			'screen-3/4': '75vw',
			'screen-1/2': '50vw',
		},
	},
  },
  plugins: [
		function ({ addVariant }) {
			addVariant("child", "& > *");
			addVariant("child-hover", "& > *:hover");
		},
	],
}
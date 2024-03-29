import axios from "axios";

export default async function (req, res) {
	const { token } = req.query;
	axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
	
	try {
		const response = await axios.get(
			`https://api.github.com/rate_limit`
		);
		const limit = response.data;

		res.status(200).json(limit);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

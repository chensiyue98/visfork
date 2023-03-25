import axios from "axios";

export default async function (req, res) {
	const { repo } = req.query;
    const branch_sha = ""

	console.log("Get branches: " + repo);

	try {
		const response = await axios.get(
			`https://api.github.com/repos/${repo}/branches`
		);
		const branches = response.data;
        
        // {   "name": "branch-name",
        //     "commit": {
        //         "sha": "40x",
        //         "url": "https://api.github.com/repos/iina/iina/commits/sha"
        //     },
        //     "protected": false},

		res.status(200).json(branches);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

// The main functional class that creates the EditableGraph object and methods.
// https://observablehq.com/@rlesser/editable-force-graph
// https://observablehq.com/d/e0ec1c2487ef419a
import * as d3 from "d3";

function ConnectedGraphSimulation(simulation, data) {
	simulation
		.nodes(data.nodes) // resets sim node set
		.force(
			"link",
			d3.forceLink(data.links).id((d) => d.id)
		) // attraction between linked nodes
		.force("charge", d3.forceManyBody()) // repulsion between nodes
		.force("center", d3.forceCenter().strength(0.05)) // Maintains centrality of nodes
		.alphaDecay(0.001); // increases time until graph "freezes"
	// .restart(); // restarts sim (not needed?)
}

export default function EditableGraph({
	data = { nodes: [], links: [] },
	simCreator = ConnectedGraphSimulation,
	height = 500,
	width = 800,
} = {}) {
	// Resaving Data
	data = JSON.parse(JSON.stringify(data));

	const defaultPos = () => ({
		x: Math.random() - 0.5,
		y: Math.random() - 0.5,
		vx: Math.random() - 0.5,
		vy: Math.random() - 0.5,
	});

	// Setting Simulation
	const simulation = d3.forceSimulation(data.nodes);

	simCreator(simulation, data);

	// Setting Update Mechanics
	let updateFunction = () => {};

	const update = () => {
		simCreator(simulation, data);
		simulation.alpha(1).restart(); // reheat simulation
		updateFunction();
	};

	// Creating return object
	const eg = {};

	// Constructing functions
	eg.data = function () {
		return data;
	};

	eg.width = function () {
		return width;
	};

	eg.height = function () {
		return height;
	};

	eg.simulation = function () {
		// simulation.restart();
		return simulation;
	};

	eg.onUpdate = function (f) {
		updateFunction = f;
		f();
	};

	eg.forceUpdate = function () {
		updateFunction();
	};

	// Manipulationg Simulation
	eg.setSimCreator = function (_simCreator) {
		ClearSimulation(simulation);
		simCreator = _simCreator;
		update();
	};

	// Manipulating Functions
	eg.addNode = function (nodeData) {
		nodeData = Array.isArray(nodeData) ? nodeData : [nodeData];
		nodeData
			.map((n) =>
				Object.assign({}, defaultPos(), typeof n == "object" ? n : { id: n })
			)
			.forEach((n) => {
				data.nodes.push(n);
			});
		update();
		return this;
	};

	eg.removeNode = function (nodeIds) {
		nodeIds = Array.isArray(nodeIds) ? nodeIds : [nodeIds];
		nodeIds.forEach((nodeId) => {
			const nodeIndex = data.nodes.findIndex((n) => n.id === nodeId);
			data.nodes.splice(nodeIndex, 1);
			const linkIndices = [];
			data.links.forEach((l, i) => {
				if (l.target.id === nodeId || l.source.id === nodeId) {
					linkIndices.push(i);
				}
			});
			linkIndices
				.reverse()
				.forEach((linkIndex) => data.links.splice(linkIndex, 1));
		});
		update();
		return this;
	};

	eg.addLink = function (linkData) {
		if (arguments.length === 2) {
			data.links.push({ source: arguments[0], target: arguments[1] });
		} else {
			linkData = Array.isArray(linkData) ? linkData : [linkData];
			linkData.forEach((l) => data.links.push(l));
		}
		update();
		return this;
	};

	eg.removeLink = function (linkData) {
		if (arguments.length === 2) {
			linkData = [{ source: arguments[0], target: arguments[1] }];
		} else {
			linkData = Array.isArray(linkData) ? linkData : [linkData];
		}
		linkData.forEach((linkDatum) => {
			// TODO Differentiate between directed and undirected graphs
			const linkIndex = data.links.findIndex(
				(l) =>
					l.source.id === (linkDatum.source.id || linkDatum.source) &&
					l.target.id === (linkDatum.target.id || linkDatum.target)
			);
			if (linkIndex !== -1) {
				data.links.splice(linkIndex, 1);
			}
			const reverseLinkIndex = data.links.findIndex(
				(l) =>
					l.source.id === (linkDatum.target.id || linkDatum.target) &&
					l.target.id === (linkDatum.source.id || linkDatum.source)
			);
			if (reverseLinkIndex !== -1) {
				data.links.splice(reverseLinkIndex, 1);
			}
		});
		update();
		return this;
	};

	eg.changeData = function (newData) {
		// copy old nodes to temp array
		const tempNodes = [...data.nodes];
		// deletes all old nodes from array
		data.nodes.splice(0, data.nodes.length);
		// pushes all new nodes into array, using the old position if id was present in old data
		newData.nodes.forEach((newNode) => {
			const { x, y, vx, vy } =
				tempNodes.find((tempNode) => tempNode.id === newNode.id) ||
				defaultPos();
			data.nodes.push({ ...newNode, x, y, vx, vy });
		});
		const tempLinks = data.links;
		data.links.splice(0, data.links.length);
		newData.links.forEach((newLink) => {
			newLink.source = newLink.source.id || newLink.source;
			newLink.target = newLink.target.id || newLink.target;
			data.links.push(newLink);
		});
		update();
		return this;
	};

	update();

	return eg;
}

// This function allows nodes to be dragged. To use, add
// .call(drag(simulation))
// to the node selection.
export const drag = (simulation) => {
	function dragstarted(event, d) {
		if (!event.active) simulation.alphaTarget(0.3).restart();
		d.fx = d.x;
		d.fy = d.y;
	}

	function dragged(event, d) {
		d.fx = event.x;
		d.fy = event.y;
	}

	function dragended(event, d) {
		if (!event.active) simulation.alphaTarget(0);
		d.fx = null;
		d.fy = null;
	}

	return d3
		.drag()
		.on("start", dragstarted)
		.on("drag", dragged)
		.on("end", dragended);
};


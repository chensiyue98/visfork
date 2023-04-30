import * as tf from "@tensorflow/tfjs";
import { useEffect, useRef, useState } from "react";


const App = () => {
    const [model, setModel] = useState(null);
    useEffect(() => {
        async function loadModel() {
            const model = await tf.loadLayersModel("model/model.json");
            setModel(model);
        }
        loadModel();
    }, []);
    // predict
    const [prediction, setPrediction] = useState(null);
    const [input, setInput] = useState(null);
    const predict = async () => {
        const input = "This is a great movie";
        const inputText = input.trim().toLowerCase().replace(/(\.|\,|\!)/g, '').split(' ');
        
        setInput(input);
        const prediction = model.predict(tf.tensor([input]));
        setPrediction(prediction);
    };
    // render
    if (model === null) {
        return <div>Loading model...</div>;
    }

	return (
		<div>
            <h1>TensorFlow.js</h1>
            <button onClick={predict}>Predict</button>
		</div>
	);
};

export default App;
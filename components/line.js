import React, {useRef, useEffect} from "react";
import {Runtime, Inspector} from "@observablehq/runtime";
import notebook from "90d62d7a6698456a";

function Line() {
  const lineRef = useRef();

  useEffect(() => {
    const runtime = new Runtime();
    runtime.module(notebook, name => {
      if (name === "line") return new Inspector(lineRef.current);
    });
    return () => runtime.dispose();
  }, []);

  return (
    <>
      <div ref={lineRef} />
    </>
  );
}

export default Line;
import React, {useRef, useEffect} from "react";
import {Runtime, Inspector} from "@observablehq/runtime";
import notebook from "90d62d7a6698456a";

function Input() {
  const viewofSlugRef = useRef();
  const viewofTokenRef = useRef();

  useEffect(() => {
    const runtime = new Runtime();
    runtime.module(notebook, name => {
      if (name === "viewof slug") return new Inspector(viewofSlugRef.current);
      if (name === "viewof token") return new Inspector(viewofTokenRef.current);
      return ["pr","owner","repo","viewof changes","viewof duration","data","gql"].includes(name);
    });
    return () => runtime.dispose();
  }, []);

  return (
    <>
      <div className="text-8xl" ref={viewofSlugRef} />
      <div ref={viewofTokenRef} />
    </>
  );
}

export default Input;
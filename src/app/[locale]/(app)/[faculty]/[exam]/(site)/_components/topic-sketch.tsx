import Image, { type StaticImageData } from "next/image";
import combinatorics from "./sketches/combinatorics.svg";
import complexNumbers from "./sketches/complex-numbers.svg";
import exponentialEquations from "./sketches/exponential-equations.svg";
import functionsIntegrals from "./sketches/functions-integrals.svg";
import logarithms from "./sketches/logarithms.svg";
import planeGeometry from "./sketches/plane-geometry.svg";
import quadraticEquations from "./sketches/quadratic-equations.svg";
import sequences from "./sketches/sequences.svg";
import solidGeometry from "./sketches/solid-geometry.svg";
import trigonometry from "./sketches/trigonometry.svg";
import vectorsAnalyticGeometry from "./sketches/vectors-analytic-geometry.svg";

const sketches: Partial<Record<string, StaticImageData>> = {
  combinatorics,
  "complex-numbers": complexNumbers,
  "exponential-equations": exponentialEquations,
  "functions-integrals": functionsIntegrals,
  logarithms,
  "plane-geometry": planeGeometry,
  "quadratic-equations": quadraticEquations,
  sequences,
  "solid-geometry": solidGeometry,
  trigonometry,
  "vectors-analytic-geometry": vectorsAnalyticGeometry,
};

export function TopicSketch({ topic }: { topic: string }) {
  const sketch = sketches[topic];
  if (!sketch) return null;
  return (
    <Image
      src={sketch}
      unoptimized
      alt=""
      className="pointer-events-none absolute -top-10 right-0 w-108 max-xl:hidden min-[90rem]:-top-11 min-[90rem]:right-9 min-[90rem]:w-118"
    />
  );
}

import { map } from "lodash";
import { Scale, Point } from "../Size";
import { Selected } from "./Selected";

type Props = {
  hover?: Point;
  highlight?: Point;
  scale: Scale;
};

export function Selection({ scale: { to }, hover, highlight }: Props) {
  return (
    <>
      {map(
        [
          { point: hover, alpha: 0.04, animateAlpha: true },
          { point: highlight, alpha: 0.08, animateScale: true },
        ],
        ({ point, ...props }, i) =>
          point && (
            <Selected
              key={`${i}::${point.x}::${point.y}`}
              x={to(point).x}
              y={to(point).y}
              color={0x000000}
              {...props}
            />
          )
      )}
    </>
  );
}

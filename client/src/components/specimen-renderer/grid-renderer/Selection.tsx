import { map } from "lodash";
import { Point } from "components/specimen-renderer/Renderer";
import { scale } from "../raster-renderer/config";
import { useTween } from "react-use";
import { ComponentProps as PropsOf } from "react";
import { Node } from "../raster-renderer/Node";

type SelectedProps = {
  animateScale?: boolean;
  animateAlpha?: boolean;
} & PropsOf<typeof Node>;

type Props = {
  hover?: Point;
  highlight?: Point;
};

export function Selected({
  x = 0,
  y = 0,
  alpha = 0,
  animateScale,
  animateAlpha,
  ...props
}: SelectedProps) {
  const t = useTween("outCirc", 300);
  return (
    <Node
      {...props}
      scale={animateScale ? t : 1}
      x={x + (animateScale ? 1.5 * scale - 1.5 * scale * t : 0)}
      y={y + (animateScale ? 1.5 * scale - 1.5 * scale * t : 0)}
      radius={1}
      alpha={(animateAlpha ? t : 1) * alpha}
    />
  );
}

export function Selection({ hover, highlight }: Props) {
  return (
    <>
      {map(
        [
          { point: hover, alpha: 0.08, animateAlpha: true },
          { point: highlight, alpha: 0.08, animateScale: true },
        ],
        ({ point, ...props }, i) =>
          point && (
            <Selected
              key={`${i}::${point.x}::${point.y}`}
              x={point.x * scale}
              y={point.y * scale}
              color={0x000000}
              {...props}
            />
          )
      )}
    </>
  );
}

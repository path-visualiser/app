import { MapInfo } from "../Parser";
import { Point, Scale } from "../Size";

export function normalize(m: MapInfo) {
  return {
    to: ({ x, y }: Point) => ({ x: x + 0.5, y: y + 0.5 }),
    from: ({ x, y }: Point) => ({ x: x - 0.5, y: y - 0.5 }),
    scale: 1,
    ...m.bounds,
  } as Scale;
}

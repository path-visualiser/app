import { TraceEvent } from "protocol/Trace";
import { FunctionComponent } from "react";
import { Point } from "./Size";

type Step = {
  index: number;
  event: TraceEvent;
};

type Node = {
  key: number;
};

export type SelectionInfo = {
  current?: Step;
  entry?: Step;
  node?: Node;
  point?: Point;
};

export type SelectEvent = {
  global: Point;
  world: Point;
  info: SelectionInfo;
};

export type RendererProps = {
  onSelect?: (e: SelectEvent) => void;
  selection?: Point;
  width?: number;
  height?: number;
};

export type Renderer = FunctionComponent<RendererProps>;

export type RendererMap = {
  [K in string]: Renderer;
};

import { TraceEvent } from "protocol/Trace";
import { FunctionComponent, Ref, RefCallback } from "react";
import { Point } from "./Size";
import { ComponentEntry, Renderer } from "renderer";
import { Dictionary } from "lodash";
import { Layer } from "slices/UIState";
import { CompiledComponent } from "protocol";

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
  components?: ComponentEntry[];
};

export type SelectEvent = {
  client: Point;
  world: Point;
  info: SelectionInfo;
};

export type RendererProps = {
  renderer?: string;
  rendererRef?: RefCallback<Renderer | undefined>;
  onSelect?: (e: SelectEvent) => void;
  selection?: Point;
  width?: number;
  height?: number;
  layers?: Layer[];
};

export type RendererComponent = FunctionComponent<RendererProps>;

export type RendererMap = {
  [K in string]: RendererComponent;
};
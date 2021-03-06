import { get } from "lodash";
import { DefaultRenderer } from "./default";
import { GridRenderer } from "./grid";
import { MeshRenderer } from "./mesh";
import { NetworkRenderer } from "./network";
import { RendererMap } from "./Renderer";

const renderers: RendererMap = {
  grid: GridRenderer,
  xy: NetworkRenderer,
  mesh: MeshRenderer,
};

export function getRenderer(key = "") {
  return get(renderers, key, DefaultRenderer);
}

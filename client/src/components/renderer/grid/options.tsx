import { blueGrey, grey } from "@material-ui/core/colors";
import { hex } from "../colors";
import { NodeOptionsMapper } from "../raster/Draw";

const wallColor = hex(grey["800"]);

export const wallOptions: NodeOptionsMapper<"x" | "y"> = (
  { variables: { x = 0, y = 0, ...v } = {} } = {},
  s
) => ({ ...v, a: s?.to?.({ x, y }), color: wallColor });

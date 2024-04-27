import {
  ArrowOutwardRounded,
  DataObjectOutlined,
  RouteTwoTone,
} from "@mui/icons-material";
import {
  Box,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Typography,
  useTheme,
} from "@mui/material";
import { TracePicker } from "components/app-bar/Input";
import {
  PlaybackLayerData,
  PlaybackService,
} from "components/app-bar/Playback";
import {
  custom,
  isTraceFormat,
  readUploadedTrace,
} from "components/app-bar/upload";
import {
  PropertyDialog,
  PropertyList,
} from "components/inspector/PropertyList";
import { Heading, Option } from "components/layer-editor/Option";
import { TracePreview } from "components/layer-editor/TracePreview";
import { LazyNodeList, NodeList } from "components/renderer/NodeList";
import { colorsHex, getColorHex } from "components/renderer/colors";
import { parseProperty } from "components/renderer/parser-v140/parseProperty";
import { parseProperty as parsePropertyLegacy } from "components/renderer/parser/parseProperty";
import { useTraceParser } from "components/renderer/parser-v140/parseTrace";
import { ParseTraceWorkerReturnType } from "components/renderer/parser/parseTraceSlave.worker";
import { DebugLayerData } from "hooks/useBreakpoints";
import { useEffectWhen } from "hooks/useEffectWhen";
import { useTraceContent } from "hooks/useTraceContent";
import { dump } from "js-yaml";
import { LayerController, inferLayerName } from "layers";
import {
  chain,
  constant,
  findLast,
  forEach,
  get,
  head,
  isUndefined,
  keyBy,
  last,
  map,
  mapValues,
  merge,
  negate,
  set,
  startCase,
} from "lodash";
import { nanoid as id } from "nanoid";
import { produce, withProduce } from "produce";
import { TraceEvent, Trace as TraceLegacy } from "protocol";
import { Trace } from "protocol/Trace-v140";
import { useEffect, useMemo } from "react";
import { useThrottle } from "react-use";
import { UploadedTrace } from "slices/UIState";
import { Layer, useLayer } from "slices/layers";
import { AccentColor, accentColors, getShade } from "theme";
import { name } from "utils/path";

const isNullish = (x: KeyRef): x is Exclude<KeyRef, Key> =>
  x === undefined || x === null;

type Key = string | number;

type KeyRef = Key | null | undefined;

function makePathIndex(trace: Trace) {
  type A = {
    id: Key;
    pId?: KeyRef;
    step: number;
    prev?: A;
  };

  const changes: A[] = [];
  const allChanges: { [K in Key]: KeyRef } = {};
  const stepToChange: { [K in number]?: A } = {};

  const r = chain(trace?.events)
    .map((c, i) => ({ step: i, id: c.id, pId: c.pId }))
    .groupBy("id")
    .value();

  forEach(trace?.events, ({ id, pId }, i) => {
    if (!isNullish(pId) && allChanges[id] !== pId) {
      changes.push({ id, pId, step: i, prev: last(changes) });
      allChanges[id] = pId;
    }
    stepToChange[i] = last(changes);
  });
  const getParent = (id: Key, step: number = trace?.events?.length ?? 0) => {
    let entry = stepToChange[step];
    while (entry) {
      if (entry.id === id) return entry.pId;
      entry = entry.prev;
    }
  };
  const getPath = (step: number) => {
    const path = [step];
    let current: A | undefined = { ...(trace.events ?? [])[step], step };
    while (current) {
      const pId = getParent(current.id, current.step);
      if (pId) {
        const event = findLast(r[pId], (c) => c.step <= current!.step);
        if (event) {
          path.push(event.step);
          current = event;
        } else break;
      } else break;
    }
    return path;
  };
  return { getParent, getPath };
}

export type TraceLayerData = {
  trace?: UploadedTrace & { error?: string };
  parsedTrace?: {
    components: ParseTraceWorkerReturnType;
    content: Trace & TraceLegacy;
    error?: string;
  };
  onion?: "off" | "transparent" | "solid";
} & PlaybackLayerData &
  DebugLayerData;

export type TraceLayer = Layer<TraceLayerData>;

export const controller = {
  key: "trace",
  icon: <RouteTwoTone />,
  inferName: (layer) => layer.source?.trace?.name ?? "Untitled Trace",
  error: (layer) =>
    layer?.source?.trace?.error || layer?.source?.parsedTrace?.error,
  claimImportedFile: async (file) =>
    isTraceFormat(file)
      ? {
          claimed: true,
          layer: async (notify) => {
            notify("Opening trace...");
            try {
              const output = readUploadedTrace(file);
              return { trace: { ...(await output.read()) } };
            } catch (e) {
              console.error(e);
              notify(`Error opening, ${get(e, "message")}`);
              return {
                trace: {
                  key: id(),
                  id: custom().id,
                  error: get(e, "message"),
                  name: startCase(name(file.name)),
                },
              };
            }
          },
        }
      : { claimed: false },
  editor: withProduce(({ value, produce }) => {
    return (
      <>
        <Option
          label="Trace"
          content={
            <TracePicker
              onChange={(v) => produce((d) => set(d, "source.trace", v))}
              value={value?.source?.trace}
            />
          }
        />
        {value?.source?.trace?.error && (
          <Typography
            variant="body2"
            color={(t) => t.palette.error.main}
            sx={{
              whiteSpace: "pre-wrap",
              mb: 1,
              mt: 1,
            }}
          >
            <code>{value?.source?.trace?.error}</code>
          </Typography>
        )}
        {value?.source?.parsedTrace?.error && (
          <Typography
            variant="body2"
            color={(t) => t.palette.error.main}
            sx={{
              whiteSpace: "pre-wrap",
              mb: 1,
              mt: 1,
            }}
          >
            <code>{value?.source?.parsedTrace?.error}</code>
          </Typography>
        )}
        <Heading label="Preview" />
        <Box sx={{ height: 240, mx: -2 }}>
          <TracePreview trace={value?.source?.parsedTrace?.content} />
        </Box>
      </>
    );
  }),
  service: withProduce(({ value, produce }) => {
    const { palette } = useTheme();
    const { result: trace } = useTraceContent(value?.source?.trace);
    const parseTrace = useTraceParser({
      trace: trace?.content,
      context: {
        theme: {
          foreground: palette.text.primary,
          background: palette.background.paper,
          accent: palette.primary.main,
        },
        color: {
          ...colorsHex,
          ...mapValues(accentColors, (_, v: AccentColor) =>
            getShade(v, palette.mode)
          ),
        },
        themeAccent: palette.primary.main,
        themeTextPrimary: palette.text.primary,
        themeBackground: palette.background.paper,
      },
      view: "main",
    });
    useEffect(() => {
      produce((l) =>
        set(l, "source.playbackTo", trace?.content?.events?.length ?? 0)
      );
    }, [trace?.content?.events?.length]);
    useEffectWhen(
      async () => {
        const parsedTrace = await parseTrace();
        produce((l) => {
          set(l, "source.parsedTrace", parsedTrace);
          set(l, "viewKey", id());
        });
      },
      [parseTrace],
      [trace?.key, palette.mode]
    );
    return (
      <>
        <PlaybackService value={value} />
      </>
    );
  }),
  renderer: ({ layer, index }) => {
    const parsedTrace = layer?.source?.parsedTrace?.components;
    const step = useThrottle(layer?.source?.step ?? 0, 1000 / 60);

    const path = use2DPath(layer, index, step);
    const steps = useMemo(
      () =>
        map(parsedTrace?.stepsPersistent, (c) =>
          map(c, (d) =>
            merge(d, {
              meta: {
                sourceLayer: layer?.key,
                sourceLayerIndex: index,
                sourceLayerAlpha: 1 - 0.01 * +(layer?.transparency ?? 0),
                sourceLayerDisplayMode: layer?.displayMode ?? "source-over",
              },
            })
          )
        ),
      [
        parsedTrace?.stepsPersistent,
        layer?.key,
        layer?.transparency,
        layer?.displayMode,
        index,
      ]
    );
    const steps1 = useMemo(
      () =>
        map(parsedTrace?.stepsTransient, (c) =>
          map(c, (d) =>
            merge(d, {
              meta: {
                sourceLayer: layer?.key,
                sourceLayerIndex: index,
                sourceLayerAlpha: 1 - 0.01 * +(layer?.transparency ?? 0),
                sourceLayerDisplayMode: layer?.displayMode ?? "source-over",
              },
            })
          )
        ),
      [
        parsedTrace?.stepsTransient,
        layer?.key,
        layer?.transparency,
        layer?.displayMode,
        index,
      ]
    );
    const steps2 = useMemo(() => [steps1[step] ?? []], [steps1, step]);
    return (
      <>
        <LazyNodeList step={step} nodes={steps} />
        <NodeList nodes={steps2} />
        {path}
      </>
    );
  },
  steps: (layer) => layer?.source?.parsedTrace?.content?.events ?? [],
  provideSelectionInfo: ({ layer: key, event, children }) => {
    const { layer, setLayer } = useLayer(key);
    const menu = useMemo(() => {
      const events = layer?.source?.parsedTrace?.content?.events ?? [];
      const steps = chain(event?.info?.components)
        .filter((c) => c.meta?.sourceLayer === layer?.key)
        .map((c) => c.meta?.step)
        .filter(negate(isUndefined))
        .sort((a, b) => a! - b!)
        .value() as number[];
      const info = chain(event?.info?.components)
        .filter((c) => c.meta?.sourceLayer === layer?.key)
        .filter((c) => c.meta?.info)
        .value() as any[];
      if (steps.length && layer) {
        const step = last(steps)!;
        const event = events[step];
        if (event) {
          return {
            ...keyBy(
              map(info, (x, i) => ({
                key: `${layer.key}.${i}`,
                primary: `Selection in ${inferLayerName(layer)}`,
                items: {
                  info: {
                    index: -1,
                    primary: <PropertyList event={x.meta.info} vertical />,
                  },
                },
              })),
              "key"
            ),
            [layer.key]: {
              primary: inferLayerName(layer),
              items: {
                properties: {
                  index: -2,
                  primary: (
                    <PropertyList event={event} vertical simple primitives />
                  ),
                },
                propertiesDetails: {
                  index: -1,
                  extras: (
                    <PropertyDialog
                      {...{ event }}
                      trigger={(onClick) => (
                        <MenuItem {...{ onClick }}>
                          <ListItemIcon>
                            <DataObjectOutlined />
                          </ListItemIcon>
                          <ListItemText sx={{ mr: 4 }}>
                            See properties
                          </ListItemText>
                          <Typography variant="body2" color="text.secondary">
                            Step {step}
                          </Typography>
                        </MenuItem>
                      )}
                    />
                  ),
                },
                [`${event}`]: {
                  primary: `Go to step ${step}`,
                  secondary: `${startCase(event.type)}`,
                  action: () =>
                    setLayer(
                      produce(layer, (l) => {
                        set(l, "source.step", step);
                      })
                    ),
                  icon: <ArrowOutwardRounded />,
                },
              },
            },
          };
        }
      }
      return {};
    }, [layer, event]);
    return <>{children?.(menu)}</>;
  },
  getSources: (layer) => {
    const trace = layer?.source?.trace;
    if (trace) {
      return [
        {
          id: "trace",
          name: `(Source) ${trace.name}`,
          language: "yaml",
          content: dump(trace.content, { noCompatMode: true }),
        },
      ];
    } else return [];
  },
} satisfies LayerController<"trace", TraceLayerData>;

function use2DPath(layer?: TraceLayer, index: number = 0, step: number = 0) {
  /// version < 1.4.0 compat
  const { palette } = useTheme();
  const { getPath } = useMemo(
    () =>
      layer?.source?.playback !== "playing" &&
      layer?.source?.parsedTrace?.content
        ? makePathIndex(layer.source.parsedTrace.content)
        : { getParent: constant(undefined), getPath: constant([]) },
    [layer?.source?.parsedTrace?.content, layer?.source?.playback]
  );
  const element = useMemo(() => {
    const trace = layer?.source?.parsedTrace?.content;
    if (trace?.render?.path || trace?.pivot) {
      const pivot = trace?.render?.path?.pivot ?? trace?.pivot ?? {};
      const scale = trace?.render?.path?.scale ?? trace?.pivot?.scale ?? 1;
      const { x, y } = pivot;

      const f =
        trace?.version === "1.4.0"
          ? parseProperty
          : (s: string) => (c: Partial<TraceEvent>) =>
              parsePropertyLegacy(s)({ event: c });

      const pivotX = x ? f(x) : (c: Partial<TraceEvent>) => c.x;
      const pivotY = y ? f(y) : (c: Partial<TraceEvent>) => c.y;

      const events = map(getPath(step), (p) => trace?.events?.[p]);

      if (events.length) {
        const primitive = [
          {
            $: "circle",
            x: pivotX({ x: 0, y: 0, ...head(events) }),
            y: pivotY({ x: 0, y: 0, ...head(events) }),
            fill: palette.background.paper,
            radius: 0.45 * scale,
          },
          {
            $: "circle",
            x: pivotX({ x: 0, y: 0, ...last(events) }),
            y: pivotY({ x: 0, y: 0, ...last(events) }),
            fill: palette.background.paper,
            radius: 0.45 * scale,
          },
          {
            $: "circle",
            x: pivotX({ x: 0, y: 0, ...head(events) }),
            y: pivotY({ x: 0, y: 0, ...head(events) }),
            fill: getColorHex("destination"),
            radius: 0.4 * scale,
          },
          {
            $: "circle",
            x: pivotX({ x: 0, y: 0, ...last(events) }),
            y: pivotY({ x: 0, y: 0, ...last(events) }),
            fill: getColorHex("source"),
            radius: 0.4 * scale,
          },
          {
            $: "path",
            points: events.map((c) => ({
              x: pivotX({ x: 0, y: 0, ...c }),
              y: pivotY({ x: 0, y: 0, ...c }),
            })),
            fill: palette.primary.main,
            alpha: 1,
            lineWidth: 0.3 * scale,
          },
        ];
        return (
          <NodeList
            nodes={[
              map(primitive, (c) => ({
                component: c,
                meta: { source: "path", sourceLayerIndex: -99999 + index },
              })),
            ]}
          />
        );
      }
    }
    return <></>;
  }, [layer, index, step, palette, getPath]);
  return element;
}
import { FileOpenOutlined } from "@mui/icons-material";
import { useSnackbar } from "components/generic/Snackbar";
import { find, get, startCase } from "lodash";
import { Map, UploadedTrace } from "slices/UIState";
import { LARGE_FILE_B, formatByte, useBusyState } from "slices/busy";
import { useConnections } from "slices/connections";
import { useFeatures } from "slices/features";
import { useLoadingState } from "slices/loading";
import { EditorProps } from "../Editor";
import { FeaturePicker } from "./FeaturePicker";
import { custom, uploadMap, uploadTrace } from "./upload";
function name(s: string) {
  return s.split(".").shift();
}

export const mapDefaults = { start: undefined, end: undefined };

export function MapPicker({ onChange, value }: EditorProps<Map>) {
  const notify = useSnackbar();
  const usingLoadingState = useLoadingState("map");
  const usingBusyState = useBusyState("map");
  const [connections] = useConnections();
  const [{ maps, formats }] = useFeatures();
  return (
    <FeaturePicker
      showTooltip
      showArrow
      icon={<FileOpenOutlined />}
      label="Choose Map"
      value={value?.id}
      items={[
        custom(value, "map"),
        ...maps.map((c) => ({
          ...c,
          description: find(connections, { url: c.source })?.name,
        })),
      ]}
      onChange={async (v) => {
        switch (v) {
          case custom().id:
            try {
              const f = await uploadMap(formats);
              if (f) {
                usingLoadingState(async () => {
                  notify("Opening map...");
                  const output =
                    f.file.size > LARGE_FILE_B
                      ? await usingBusyState(
                          f.read,
                          `Opening map (${formatByte(f.file.size)})`
                        )
                      : await f.read();
                  if (output) {
                    onChange?.(output);
                  }
                });
              }
            } catch (e) {
              notify(`${e}`);
            }
            break;
          default:
            onChange?.(find(maps, { id: v })!);
            break;
        }
      }}
    />
  );
}

export function TracePicker({
  onChange,
  value,
}: EditorProps<UploadedTrace & { error?: string }>) {
  const notify = useSnackbar();
  const usingLoadingState = useLoadingState("specimen");
  const usingBusyState = useBusyState("specimen");
  const [connections] = useConnections();
  const [{ traces }] = useFeatures();
  return (
    <FeaturePicker
      showTooltip
      showArrow
      icon={<FileOpenOutlined />}
      label="Choose Trace"
      value={value?.id}
      items={[
        custom(value, "trace"),
        ...traces.map((c) => ({
          ...c,
          description: find(connections, { url: c.source })?.name,
        })),
      ]}
      onChange={async (v) => {
        switch (v) {
          case custom().id:
            {
              try {
                const f = await uploadTrace();
                if (f)
                  usingLoadingState(async () => {
                    notify("Opening trace...");
                    try {
                      const output =
                        f.file.size > LARGE_FILE_B
                          ? await usingBusyState(
                              f.read,
                              `Opening trace (${formatByte(f.file.size)})`
                            )
                          : await f.read();
                      if (output) {
                        onChange?.(output);
                      }
                    } catch (e) {
                      console.error(e);
                      notify(`Error opening, ${get(e, "message")}`);
                      onChange?.({
                        id: custom().id,
                        error: get(e, "message"),
                        name: startCase(name(f.file.name)),
                      });
                    }
                  });
              } catch (e) {
                console.error(e);
                notify(`Error opening, ${get(e, "message")}`);
                onChange?.({
                  id: custom().id,
                  error: get(e, "message"),
                  name: "File",
                });
              }
            }
            break;
          default:
            onChange?.(find(traces, { id: v })!);
            break;
        }
      }}
    />
  );
}

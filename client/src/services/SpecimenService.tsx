import { Transport } from "client/Transport";
import { Label } from "components/generic/Label";
import { useSnackbar } from "components/generic/Snackbar";
import { useConnectionResolver } from "hooks/useConnectionResolver";
import { useMapContent } from "hooks/useMapContent";
import { find, isEmpty } from "lodash";
import { ParamsOf } from "protocol/Message";
import { PathfindingTask } from "protocol/SolveTask";
import { useAsyncAbortable as useAsync } from "react-async-hook";
import { useConnections } from "slices/connections";
import { useFeatures } from "slices/features";
import { useLoadingState } from "slices/loading";
import { Specimen, useSpecimen } from "slices/specimen";
import { useUIState } from "slices/UIState";
import { hashAsync as hash } from "workers/async";

async function solve(
  map: string,
  { format, ...params }: Omit<ParamsOf<PathfindingTask>, "mapURI">,
  call: Transport["call"]
): Promise<Specimen | undefined> {
  if (map) {
    for (const mapURI of [
      `hash:${await hash(map)}`,
      `map:${encodeURIComponent(map)}`,
    ] as const) {
      const p = { ...params, format, mapURI };
      try {
        const specimen = await call("solve/pathfinding", p);
        if (specimen)
          return {
            ...p,
            specimen,
            map,
            format: specimen?.format ?? format,
          };
      } catch (e) {
        ///@ts-ignore
        return { ...p, specimen: {}, map, format, error: e.message };
      }
    }
  }
}

export function SpecimenService() {
  const usingLoadingState = useLoadingState("specimen");
  const notify = useSnackbar();
  const [{ formats, algorithms }] = useFeatures();
  const [{ algorithm, start, end, parameters }, setUIState] = useUIState();
  const resolve = useConnectionResolver();
  const [connections] = useConnections();
  const [, setSpecimen] = useSpecimen();

  const { result: map } = useMapContent();
  useAsync(
    (signal) =>
      usingLoadingState(async () => {
        if (map?.format && map?.content) {
          let entry;
          for (const connection of connections) {
            const a = await connection.call("features/algorithms");
            const f = await connection.call("features/formats");
            if (find(a, { id: algorithm }) && find(f, { id: map?.format })) {
              entry = connection;
              break;
            }
          }
          if (entry) {
            const solution = await solve(
              map?.content ?? "",
              {
                algorithm,
                format: map?.format ?? "",
                instances: [{ end, start }],
                parameters,
              },
              entry.call
            );
            if (solution && !signal.aborted) {
              setSpecimen(solution);
              setUIState({ step: 0, playback: "paused", breakpoints: [] });
              notify(
                solution.error ??
                  (!isEmpty(solution.specimen) ? (
                    <Label
                      primary="Solution generated."
                      secondary={`${solution.specimen?.eventList?.length} steps`}
                    />
                  ) : (
                    "Ready."
                  ))
              );
            }
          } else
            notify(
              `No solver is available for the map format (${map?.format ??
                "none"}) and algorithm (${algorithm ?? "none"}).`
            );
        }
      }),
    [
      algorithm,
      start,
      end,
      map,
      notify,
      usingLoadingState,
      formats,
      resolve,
      setSpecimen,
      parameters,
    ]
  );

  return <></>;
}

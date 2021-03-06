import { Button } from "@material-ui/core";
import { ReplayOutlined as ResetIcon } from "@material-ui/icons";
import { defaultTransport } from "client";
import { ListEditor } from "components/generic/ListEditor";
import { debounce } from "lodash";
import { defaultRemotes, Remote, useSettings } from "slices/settings";
import { ServerEditor } from "./ServerEditor";

export function ServerListEditor() {
  const [{ remote }, setSettings] = useSettings();
  return (
    <>
      <ListEditor<Remote>
        editor={(v) => <ServerEditor value={v} />}
        icon={null}
        value={remote}
        onChange={debounce((v) => setSettings({ remote: v }), 300)}
        addItemLabel="Add Solver"
        create={() => ({
          transport: defaultTransport,
          url: "",
          disabled: true,
        })}
        extras={
          <Button
            startIcon={<ResetIcon />}
            sx={{ ml: 2 }}
            onClick={() => setSettings({ remote: defaultRemotes })}
          >
            Reset to Defaults
          </Button>
        }
      />
    </>
  );
}

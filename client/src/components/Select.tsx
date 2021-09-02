import { Menu, MenuItem, Tooltip } from "@material-ui/core";
import { useSmallDisplay } from "hooks/useSmallDisplay";
import { findIndex, map, max } from "lodash";
import State, { bindMenu, bindTrigger } from "material-ui-popup-state";
import { ReactElement, ReactNode } from "react";

type Key = string | number;

type SelectProps<T extends Key> = {
  trigger?: (props: ReturnType<typeof bindTrigger>) => ReactElement;
  items?: { value: T; label?: ReactNode }[];
  value?: T;
  onChange?: (value: T) => void;
  placeholder?: string;
};

const itemHeight = (sm: boolean) => (sm ? 48 : 36);
const padding = 8;

export function Select<T extends string>({
  trigger,
  items,
  value,
  onChange,
  placeholder = "Select Option",
}: SelectProps<T>) {
  const sm = useSmallDisplay();
  const index = max([findIndex(items, { value: value as any }), 0]) ?? 0;
  return (
    <State variant="popover">
      {(state) => (
        <>
          <Tooltip title={placeholder}>
            <span>{trigger?.(bindTrigger(state))}</span>
          </Tooltip>
          <Menu
            {...bindMenu(state)}
            anchorOrigin={{
              horizontal: "left",
              vertical: -itemHeight(sm) * index - padding,
            }}
          >
            {map(items, ({ value: v, label }) => (
              <MenuItem
                key={v}
                value={v}
                selected={v === value}
                onClick={() => {
                  state.close();
                  onChange?.(v);
                }}
              >
                {label}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </State>
  );
}
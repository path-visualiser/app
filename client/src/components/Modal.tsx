import {
  AppBar,
  Box,
  Dialog,
  Fade,
  IconButton,
  Toolbar,
  useTheme,
} from "@material-ui/core";
import { ArrowBack } from "@material-ui/icons";
import { ResizeSensor } from "css-element-queries";
import PopupState, { bindPopover, bindTrigger } from "material-ui-popup-state";
import {
  cloneElement,
  ComponentProps,
  CSSProperties,
  ReactElement,
  ReactNode,
  SyntheticEvent,
  useEffect,
  useState,
} from "react";
import { useScrollState } from "../hooks/useScrollState";
import { useSmallDisplay } from "../hooks/useSmallDisplay";
import { ScrollPanel, usePanel } from "./ScrollPanel";

export type Props = {
  children?: ReactNode;
  actions?: ReactNode;
  width?: number;
  height?: string | number;
  onTarget?: (target: HTMLDivElement | null) => void;
  variant?: "default" | "submodal";
  scrollable?: boolean;
};

type ModalAppBarProps = {
  onClose?: () => void;
  style?: CSSProperties;
  elevatedStyle?: CSSProperties;
  transitionProperties?: string[];
  children?: ReactNode;
  elevatedChildren?: ReactNode;
  simple?: boolean;
  position?: "fixed" | "absolute" | "sticky" | "static";
};

export function ModalAppBar({
  onClose = () => {},
  style,
  elevatedStyle,
  children,
  transitionProperties = ["box-shadow", "background", "border-bottom"],
  elevatedChildren,
  simple,
  position = "sticky",
}: ModalAppBarProps) {
  const panel = usePanel();
  const theme = useTheme();
  const [, , isAbsoluteTop, , setTarget] = useScrollState();
  useEffect(() => {
    setTarget(panel);
  }, [panel, setTarget]);

  const styles = isAbsoluteTop
    ? {
        background: theme.palette.background.paper,
        ...(!simple && {
          boxShadow: theme.shadows[0],
        }),
        ...style,
      }
    : {
        background: theme.palette.background.paper,
        ...(!simple && {
          boxShadow: theme.shadows[4],
          // borderBottom: `1px solid ${theme.palette.background.paper}`,
        }),
        ...elevatedStyle,
      };

  return (
    <AppBar
      elevation={0}
      position={position}
      style={{
        color: theme.palette.text.primary,
        transition: theme.transitions.create(transitionProperties),
        ...styles,
      }}
    >
      <Toolbar>
        <IconButton
          style={{
            marginRight: theme.spacing(1),
            // marginLeft: -theme.spacing(2),
          }}
          aria-label="open drawer"
          edge="start"
          onClick={() => onClose()}
        >
          <ArrowBack />
        </IconButton>

        {children && (
          <div
            style={{
              gridColumn: 1,
              gridRow: 1,
              flex: 1,
              overflow: "auto",
            }}
          >
            <Fade
              in={!!(!elevatedChildren || isAbsoluteTop)}
              mountOnEnter
              unmountOnExit
            >
              <Box style={{ width: "100%" }}>{children}</Box>
            </Fade>
          </div>
        )}
        {elevatedChildren && (
          <div
            style={{
              gridColumn: 1,
              gridRow: 1,
              flex: 1,
              overflow: "auto",
            }}
          >
            <Fade
              in={!!(elevatedChildren && !isAbsoluteTop)}
              mountOnEnter
              unmountOnExit
            >
              <Box style={{ width: "100%" }}>{elevatedChildren}</Box>
            </Fade>
          </div>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default function Modal({
  children,
  actions,
  width = 480,
  height,
  onTarget,
  variant = "default",
  scrollable = true,
  ...props
}: Props & ComponentProps<typeof Dialog>) {
  const [content, setContent] = useState<ReactNode | undefined>(undefined);
  useEffect(() => {
    if (children) setContent(children);
  }, [children]);
  const theme = useTheme();
  const sm = useSmallDisplay();

  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [contentRef, setContentRef] = useState<HTMLElement | null>(null);
  const [hasOverflowingChildren, setHasOverflowingChildren] = useState(false);
  const [childHeight, setChildHeight] = useState(0);

  useEffect(() => {
    if (target && contentRef && !sm && !height) {
      const callback = () => {
        const doesOverflow = window.innerHeight - 64 < contentRef.offsetHeight;
        setHasOverflowingChildren(doesOverflow);
        setChildHeight(
          contentRef.offsetHeight <= 1 ? 0 : Math.ceil(contentRef.offsetHeight)
        );
      };
      window.addEventListener("resize", callback);
      const ob = new ResizeSensor(contentRef, callback);
      callback();
      return () => {
        window.removeEventListener("resize", callback);
        ob.detach();
      };
    }
  }, [target, contentRef, sm, height]);

  const useVariant = variant === "submodal" && sm;

  return (
    <Dialog
      fullScreen={sm}
      {...props}
      style={{
        ...(useVariant && {
          paddingTop: theme.spacing(8),
        }),
        ...props.style,
      }}
      PaperProps={{
        ref: (e: HTMLElement | null) => setTarget(e),
        style: {
          ...(useVariant && {
            borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
          }),
          background: theme.palette.background.default,
          overflow: "hidden",
          height:
            height && !sm
              ? height
              : hasOverflowingChildren || sm
              ? "100%"
              : childHeight || "fit-content",
          position: "relative",
          maxWidth: "none",
          ...props.PaperProps?.style,
        },
        ...props.PaperProps,
      }}
    >
      <ScrollPanel
        style={{
          height: "100%",
          width: sm ? undefined : width,
          overflow: scrollable ? undefined : "hidden",
        }}
        onTarget={onTarget}
      >
        <div ref={(e) => setContentRef(e)}>{content}</div>
      </ScrollPanel>
      {actions}
    </Dialog>
  );
}

export function ManagedModal({
  ModalProps,
  ModalAppBarProps,
  trigger = () => <></>,
  children,
}: {
  ModalProps?: Props;
  trigger?: (onClick: (e: SyntheticEvent<any, Event>) => void) => ReactElement;
  ModalAppBarProps?: ModalAppBarProps;
  children?: ReactNode;
}) {
  return (
    <PopupState variant="popover">
      {(popupState) => {
        const { onClick } = bindTrigger(popupState);
        return (
          <>
            {cloneElement(trigger(onClick))}
            <Modal {...ModalProps} {...bindPopover(popupState)}>
              <ModalAppBar {...bindPopover(popupState)} {...ModalAppBarProps} />
              {children ?? ModalProps?.children}
            </Modal>
          </>
        );
      }}
    </PopupState>
  );
}

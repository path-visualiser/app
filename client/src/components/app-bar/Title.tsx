import { Typography as Type, BoxProps, Box, DialogTitle, IconButton, DialogContent, Dialog } from "@material-ui/core";
import { Welcome } from "components/welcome/Welcome"
import { useEffect, useState } from "react";
import { bindTrigger, bindPopover, usePopupState } from "material-ui-popup-state/hooks";
import CloseIcon from '@material-ui/icons/Close';

export function Title(props: BoxProps) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <Box sx={{cursor:"pointer", userSelect:"none"}} bgcolor="primary.main" p={2} onClick={() => setOpen(!open)}>
        <Type
          variant="body1"
          color="text.secondary"
          sx={{
            color: "primary.contrastText",
            whiteSpace: "nowrap",
            fontWeight: 500,
          }}
        >
          PFAlgoViz
        </Type>
      </Box>
      <Dialog maxWidth={'md'} fullWidth={true} open={open} onClose={() => setOpen(false)}>
        <DialogTitle sx={{ m: 0, p: 2 }}>
          <IconButton
              aria-label="close"
              onClick={() => setOpen(false)}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
        </DialogTitle>
        <DialogContent>
          <Welcome />
        </DialogContent>
      </Dialog>
    </div>
  );
}

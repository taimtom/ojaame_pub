import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';

import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export function ProductDetailsToolbar({
  publish,
  backLink,
  editLink,
  addQtyLink,
  adjustLink,
  changePriceLink,
  liveLink,
  publishOptions,
  onChangePublish,
  sx,
  ...other
}) {
  const popover = usePopover();

  return (
    <>
      <Stack spacing={1.5} direction="row" sx={{ mb: { xs: 3, md: 5 }, ...sx }} {...other}>
        <Button
          component={RouterLink}
          href={backLink}
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={16} />}
        >
          Back
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        {publish === 'publish' && (
          <Tooltip title="Go Live">
            <IconButton component={RouterLink} href={liveLink}>
              <Iconify icon="eva:external-link-fill" />
            </IconButton>
          </Tooltip>
        )}

        {addQtyLink && (
          <Button
            component={RouterLink}
            href={addQtyLink}
            variant="outlined"
            startIcon={<Iconify icon="solar:add-square-bold" width={18} />}
          >
            Add Qty
          </Button>
        )}

        {adjustLink && (
          <Button
            component={RouterLink}
            href={adjustLink}
            variant="outlined"
            color="error"
            startIcon={<Iconify icon="solar:danger-triangle-bold" width={18} />}
          >
            Record Loss
          </Button>
        )}

        {changePriceLink && (
          <Button
            component={RouterLink}
            href={changePriceLink}
            variant="outlined"
            color="warning"
            startIcon={<Iconify icon="solar:tag-price-bold" width={18} />}
          >
            Change Price
          </Button>
        )}

        <Tooltip title="Edit">
          <IconButton component={RouterLink} href={editLink}>
            <Iconify icon="solar:pen-bold" />
          </IconButton>
        </Tooltip>

        <LoadingButton
          color="inherit"
          variant="contained"
          loading={!publish}
          loadingIndicator="Loading…"
          endIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
          onClick={popover.onOpen}
          sx={{ textTransform: 'capitalize' }}
        >
          {publish}
        </LoadingButton>
      </Stack>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'top-right' } }}
      >
        <MenuList>
          {publishOptions.map((option) => (
            <MenuItem
              key={option.value}
              selected={option.value === publish}
              onClick={() => {
                popover.onClose();
                onChangePublish(option.value);
              }}
            >
              {option.value === 'publish' && <Iconify icon="eva:cloud-upload-fill" />}
              {option.value === 'draft' && <Iconify icon="solar:file-text-bold" />}
              {option.label}
            </MenuItem>
          ))}
        </MenuList>
      </CustomPopover>
    </>
  );
}

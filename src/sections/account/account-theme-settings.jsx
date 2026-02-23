import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';

import COLORS from 'src/theme/core/colors.json';
import { defaultFont } from 'src/theme/core/typography';
import PRIMARY_COLOR from 'src/theme/with-settings/primary-color.json';

import { Iconify } from 'src/components/iconify';
import { BaseOption } from 'src/components/settings/drawer/base-option';
import { NavOptions } from 'src/components/settings/drawer/nav-options';
import { FontOptions } from 'src/components/settings/drawer/font-options';
import { PresetsOptions } from 'src/components/settings/drawer/presets-options';
import { useSettingsContext } from 'src/components/settings/context';
import { defaultSettings } from 'src/components/settings/config-settings';

// ----------------------------------------------------------------------

export function AccountThemeSettings() {
  const settings = useSettingsContext();
  const { mode, setMode } = useColorScheme();

  const handleReset = () => {
    settings.onReset();
    setMode(defaultSettings.colorScheme);
  };

  return (
    <Stack spacing={4}>
      {/* Header row with reset */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h6">Theme settings</Typography>

        <Tooltip title="Reset to defaults">
          <IconButton onClick={handleReset}>
            <Badge color="error" variant="dot" invisible={!settings.canReset}>
              <Iconify icon="solar:restart-bold" />
            </Badge>
          </IconButton>
        </Tooltip>
      </Box>

      {/* Mode / Contrast / Direction / Compact */}
      <Card sx={{ p: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
          Display
        </Typography>
        <Box gap={2} display="grid" gridTemplateColumns="repeat(2, 1fr)">
          <BaseOption
            label="Dark mode"
            icon="moon"
            selected={settings.colorScheme === 'dark'}
            onClick={() => {
              settings.onUpdateField('colorScheme', mode === 'light' ? 'dark' : 'light');
              setMode(mode === 'light' ? 'dark' : 'light');
            }}
          />

          <BaseOption
            label="Contrast"
            icon="contrast"
            selected={settings.contrast === 'hight'}
            onClick={() =>
              settings.onUpdateField(
                'contrast',
                settings.contrast === 'default' ? 'hight' : 'default'
              )
            }
          />

          <BaseOption
            label="Right to left"
            icon="align-right"
            selected={settings.direction === 'rtl'}
            onClick={() =>
              settings.onUpdateField('direction', settings.direction === 'ltr' ? 'rtl' : 'ltr')
            }
          />

          <BaseOption
            tooltip="Dashboard only and available at large resolutions > 1600px (xl)"
            label="Compact"
            icon="autofit-width"
            selected={settings.compactLayout}
            onClick={() => settings.onUpdateField('compactLayout', !settings.compactLayout)}
          />
        </Box>
      </Card>

      {/* Nav layout & color */}
      <Card sx={{ p: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
          Navigation
        </Typography>
        <NavOptions
          value={{ color: settings.navColor, layout: settings.navLayout }}
          onClickOption={{
            color: (newValue) => settings.onUpdateField('navColor', newValue),
            layout: (newValue) => settings.onUpdateField('navLayout', newValue),
          }}
          options={{
            colors: ['integrate', 'apparent'],
            layouts: ['vertical', 'horizontal', 'mini'],
          }}
        />
      </Card>

      {/* Presets */}
      <Card sx={{ p: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
          Presets
        </Typography>
        <PresetsOptions
          value={settings.primaryColor}
          onClickOption={(newValue) => settings.onUpdateField('primaryColor', newValue)}
          options={[
            { name: 'default', value: COLORS.primary.main },
            { name: 'cyan', value: PRIMARY_COLOR.cyan.main },
            { name: 'purple', value: PRIMARY_COLOR.purple.main },
            { name: 'blue', value: PRIMARY_COLOR.blue.main },
            { name: 'orange', value: PRIMARY_COLOR.orange.main },
            { name: 'red', value: PRIMARY_COLOR.red.main },
          ]}
        />
      </Card>

      {/* Font */}
      <Card sx={{ p: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
          Font
        </Typography>
        <FontOptions
          value={settings.fontFamily}
          onClickOption={(newValue) => settings.onUpdateField('fontFamily', newValue)}
          options={[defaultFont, 'Inter', 'DM Sans', 'Nunito Sans']}
        />
      </Card>

      {/* Save / Reset actions */}
      <Box display="flex" justifyContent="flex-end">
        <Button variant="outlined" color="inherit" onClick={handleReset} disabled={!settings.canReset}>
          Reset to defaults
        </Button>
      </Box>
    </Stack>
  );
}

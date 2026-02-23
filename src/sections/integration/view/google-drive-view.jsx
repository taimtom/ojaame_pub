import { useState } from 'react';
import { Helmet } from 'react-helmet-async';

import { Box, Tab, Tabs, Card } from '@mui/material';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { FileManagerView } from 'src/sections/file-manager/view';
import { DriveFileManager } from 'src/sections/integration/components/drive-file-manager';

import { GoogleDriveUsageView } from './google-drive-usage-view';

// ----------------------------------------------------------------------

export function GoogleDriveView() {
  const [currentTab, setCurrentTab] = useState('upload');

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <>
      <Helmet>
        <title>Google Drive Integration | Dashboard - {CONFIG.site.name}</title>
      </Helmet>

      <Box sx={{ p: 3 }}>
        <CustomBreadcrumbs
          heading="Google Drive Integration"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Integration', href: paths.dashboard.integration.root },
            { name: 'Google Drive' },
          ]}
          sx={{ mb: 5 }}
        />

        <Card sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Upload & Manage" value="upload" />
            <Tab label="File Manager" value="manager" />
            <Tab label="Drive Manager" value="drive" />
          </Tabs>
        </Card>

        {currentTab === 'upload' && <GoogleDriveUsageView />}
        {currentTab === 'manager' && (
          <Box sx={{ mt: 3 }}>
            <FileManagerView />
          </Box>
        )}
        {currentTab === 'drive' && (
          <Box sx={{ mt: 3 }}>
            <DriveFileManager />
          </Box>
        )}
      </Box>
    </>
  );
}


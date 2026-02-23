import { useState, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Button,
  Select,
  Avatar,
  Divider,
  MenuItem,
  TextField,
  Typography,
  CardHeader,
  InputLabel,
  IconButton,
  FormControl,
  InputAdornment,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const MOCK_DRIVE_FILES = [
  {
    id: '1',
    name: 'Sales Report Q1 2024.xlsx',
    type: 'spreadsheet',
    size: '2.5 MB',
    modified: '2024-01-15',
    owner: 'You',
    shared: true,
    thumbnail: null,
  },
  {
    id: '2',
    name: 'Product Catalog Images',
    type: 'folder',
    size: '45 MB',
    modified: '2024-01-14',
    owner: 'You',
    shared: false,
    thumbnail: null,
  },
  {
    id: '3',
    name: 'Customer Database Backup.csv',
    type: 'csv',
    size: '8.7 MB',
    modified: '2024-01-13',
    owner: 'team@company.com',
    shared: true,
    thumbnail: null,
  },
  {
    id: '4',
    name: 'Inventory Management.pdf',
    type: 'pdf',
    size: '1.2 MB',
    modified: '2024-01-12',
    owner: 'You',
    shared: false,
    thumbnail: null,
  },
  {
    id: '5',
    name: 'POS System Manual.docx',
    type: 'document',
    size: '3.4 MB',
    modified: '2024-01-11',
    owner: 'admin@company.com',
    shared: true,
    thumbnail: null,
  },
  {
    id: '6',
    name: 'Marketing Assets',
    type: 'folder',
    size: '128 MB',
    modified: '2024-01-10',
    owner: 'You',
    shared: false,
    thumbnail: null,
  },
];

// ----------------------------------------------------------------------

export function DriveFileManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('modified');
  const [viewMode, setViewMode] = useState('grid');
  const [files, setFiles] = useState(MOCK_DRIVE_FILES);

  const handleSearch = useCallback((event) => {
    setSearchQuery(event.target.value);
  }, []);

  const handleSortChange = useCallback((event) => {
    setSortBy(event.target.value);
  }, []);

  const handleViewModeToggle = useCallback(() => {
    setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'));
  }, []);

  const handleRefresh = useCallback(() => {
    console.log('Refreshing Drive files...');
    // Add API call here
  }, []);

  const handleUpload = useCallback(() => {
    console.log('Opening file upload dialog...');
    // Add file upload logic here
  }, []);

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (type) => {
    switch (type) {
      case 'folder':
        return 'eva:folder-fill';
      case 'pdf':
        return 'eva:file-text-fill';
      case 'spreadsheet':
        return 'eva:file-fill';
      case 'document':
        return 'eva:file-text-fill';
      case 'csv':
        return 'eva:file-fill';
      default:
        return 'eva:file-fill';
    }
  };

  const getFileColor = (type) => {
    switch (type) {
      case 'folder':
        return 'warning.main';
      case 'pdf':
        return 'error.main';
      case 'spreadsheet':
        return 'success.main';
      case 'document':
        return 'info.main';
      case 'csv':
        return 'primary.main';
      default:
        return 'text.secondary';
    }
  };

  const renderFileCard = (file) => (
    <Card key={file.id} sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: getFileColor(file.type),
              color: 'white',
              width: 48,
              height: 48,
            }}
          >
            <Iconify icon={getFileIcon(file.type)} width={24} />
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>
              {file.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {file.size} • {file.modified}
            </Typography>
          </Box>

          <IconButton size="small">
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Owner: {file.owner}
          </Typography>
          {file.shared && (
            <Chip size="small" label="Shared" color="info" variant="outlined" />
          )}
        </Stack>
      </Stack>
    </Card>
  );

  return (
    <Card>
      <CardHeader
        title="Drive File Manager"
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:cloud-upload-fill" />}
              onClick={handleUpload}
            >
              Upload
            </Button>
            <IconButton onClick={handleRefresh}>
              <Iconify icon="eva:refresh-fill" />
            </IconButton>
            <IconButton onClick={handleViewModeToggle}>
              <Iconify icon={viewMode === 'grid' ? 'eva:list-fill' : 'eva:grid-fill'} />
            </IconButton>
          </Stack>
        }
      />

      <Divider />

      <Stack spacing={2} sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            fullWidth
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search files and folders..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Sort by</InputLabel>
            <Select value={sortBy} onChange={handleSortChange} label="Sort by">
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="modified">Modified</MenuItem>
              <MenuItem value="size">Size</MenuItem>
              <MenuItem value="type">Type</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {filteredFiles.length} items
          </Typography>
          <Button size="small" startIcon={<Iconify icon="eva:plus-fill" />}>
            New Folder
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ p: 3, pt: 0 }}>
        {viewMode === 'grid' ? (
          <Grid container spacing={2}>
            {filteredFiles.map((file) => (
              <Grid item xs={12} sm={6} md={4} key={file.id}>
                {renderFileCard(file)}
              </Grid>
            ))}
          </Grid>
        ) : (
          <Stack spacing={1}>
            {filteredFiles.map((file) => renderFileCard(file))}
          </Stack>
        )}

        {filteredFiles.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No files found
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
}


import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { agentApi } from 'src/lib/agentApi';

export default function AgentBusinessesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [completedFilter, setCompletedFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const fetchData = () => {
    setLoading(true);
    const params = { page: page + 1, page_size: rowsPerPage };
    if (completedFilter !== '') params.completed_signup = completedFilter;
    if (activeFilter !== '') params.is_active = activeFilter;
    agentApi
      .get('/api/referral/businesses', { params })
      .then((r) => setData(r.data))
      .catch(() => setError('Failed to load businesses'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchData, [page, rowsPerPage, completedFilter, activeFilter]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Referred Businesses
      </Typography>

      <Stack direction="row" spacing={2} mb={2}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Setup Complete</InputLabel>
          <Select
            value={completedFilter}
            label="Setup Complete"
            onChange={(e) => { setCompletedFilter(e.target.value); setPage(0); }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Yes</MenuItem>
            <MenuItem value="false">No</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={activeFilter}
            label="Status"
            onChange={(e) => { setActiveFilter(e.target.value); setPage(0); }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Business Name</TableCell>
                    <TableCell>Setup Complete</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Joined</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No businesses found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.items.map((biz) => (
                      <TableRow
                        key={biz.id}
                        hover
                        onClick={() => navigate(`/agent/businesses/${biz.id}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{biz.company_name}</TableCell>
                        <TableCell>
                          <Chip
                            label={biz.completed_signup ? 'Yes' : 'No'}
                            color={biz.completed_signup ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={biz.is_active ? 'Active' : 'Inactive'}
                            color={biz.is_active ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {biz.joined ? new Date(biz.joined).toLocaleDateString() : '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={data.total}
                page={page}
                onPageChange={(_, v) => setPage(v)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
                rowsPerPageOptions={[10, 20, 50]}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

/**
 * Transaction List Component
 * Displays bank transactions with filtering, categorization, and reconciliation status
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Typography,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Tooltip
} from '@mui/material';
import { format } from 'date-fns';

import axios from '../../utils/axios';
import { useCurrency } from '../../contexts/CurrencyContext';

import { Iconify } from 'src/components/iconify';

const FilterIcon = (props) => <Iconify icon="solar:filter-bold" width={20} {...props} />;
const ReconciledIcon = (props) => <Iconify icon="solar:check-circle-bold" width={20} {...props} />;
const UnreconciledIcon = (props) => <Iconify icon="solar:danger-triangle-bold" width={20} {...props} />;
const EditIcon = (props) => <Iconify icon="solar:pen-bold" width={20} {...props} />;
const LinkIcon = (props) => <Iconify icon="solar:link-bold" width={20} {...props} />;
const ExportIcon = (props) => <Iconify icon="solar:download-bold" width={20} {...props} />;

const TransactionList = ({ accountId = null, storeId = null }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    isReconciled: 'all', // 'all', 'true', 'false'
    type: 'all', // 'all', 'credit', 'debit'
    search: ''
  });

  const [categorizeDialog, setCategorizeDialog] = useState({ open: false, transaction: null });
  const [category, setCategory] = useState('');

  const { formatAmount } = useCurrency();

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, filters, accountId]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        account_id: accountId,
        store_id: storeId,
        start_date: filters.startDate,
        end_date: filters.endDate,
        limit: rowsPerPage,
        offset: page * rowsPerPage
      };

      if (filters.isReconciled !== 'all') {
        params.reconciled = filters.isReconciled === 'true';
      }
      if (filters.type !== 'all') {
        params.transaction_type = filters.type;
      }
      if (filters.search) {
        params.search = filters.search;
      }

      const response = await axios.get('/api/banking/transactions', { params });
      setTransactions(response.data.transactions || []);
      setTotalCount(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0); // Reset to first page when filters change
  };

  const handleCategorize = (transaction) => {
    setCategorizeDialog({ open: true, transaction });
    setCategory(transaction.category_id || '');
  };

  const saveCategorization = async () => {
    try {
      await axios.put(`/api/banking/transactions/${categorizeDialog.transaction.id}/categorize`, {
        category_id: category
      });
      
      setCategorizeDialog({ open: false, transaction: null });
      fetchTransactions(); // Refresh list
    } catch (error) {
      console.error('Failed to categorize transaction:', error);
    }
  };

  const handleReconcile = async (transactionId) => {
    // This would open a reconciliation dialog with sale suggestions
    // For now, we'll navigate to reconciliation page
    window.location.href = `/banking/reconciliation?transaction=${transactionId}`;
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('/api/banking/transactions/export', {
        params: { ...filters, account_id: accountId },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export transactions:', error);
    }
  };

  const getTransactionTypeColor = (isIncome) => isIncome ? 'success' : 'error';

  const getReconciliationStatus = (transaction) => {
    if (transaction.reconciled) {
      return (
        <Chip
          icon={<ReconciledIcon />}
          label="Reconciled"
          color="success"
          size="small"
        />
      );
    }
    return (
      <Chip
        icon={<UnreconciledIcon />}
        label="Unreconciled"
        color="warning"
        size="small"
      />
    );
  };

  return (
    <Card>
      {/* Filters */}
      <Box p={2} borderBottom={1} borderColor="divider">
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            label="Start Date"
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            label="End Date"
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.isReconciled}
              onChange={(e) => handleFilterChange('isReconciled', e.target.value)}
              label="Status"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="true">Reconciled</MenuItem>
              <MenuItem value="false">Unreconciled</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              label="Type"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="credit">Income</MenuItem>
              <MenuItem value="debit">Expense</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Search"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search description..."
            size="small"
            sx={{ flexGrow: 1, minWidth: 200 }}
          />
          <Button
            startIcon={<ExportIcon />}
            onClick={handleExport}
            variant="outlined"
            size="small"
          >
            Export
          </Button>
        </Stack>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Loading...</TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">No transactions found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction.id} hover>
                  <TableCell>
                    {format(new Date(transaction.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{transaction.description}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {transaction.provider_transaction_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {transaction.category_name || (
                      <Typography variant="caption" color="text.secondary">
                        Uncategorized
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      color={getTransactionTypeColor(transaction.is_income)}
                      fontWeight="medium"
                    >
                      {transaction.is_income ? '+' : '-'}
                      {formatAmount(Math.abs(transaction.amount), transaction.currency)}
                    </Typography>
                    {transaction.amount_in_base_currency && transaction.currency !== 'USD' && (
                      <Typography variant="caption" color="text.secondary">
                        ${transaction.amount_in_base_currency.toFixed(2)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.is_income ? 'Income' : 'Expense'}
                      color={getTransactionTypeColor(transaction.is_income)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {getReconciliationStatus(transaction)}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="Categorize">
                        <IconButton
                          size="small"
                          onClick={() => handleCategorize(transaction)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {!transaction.reconciled && (
                        <Tooltip title="Reconcile">
                          <IconButton
                            size="small"
                            onClick={() => handleReconcile(transaction.id)}
                          >
                            <LinkIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />

      {/* Categorize Dialog */}
      <Dialog
        open={categorizeDialog.open}
        onClose={() => setCategorizeDialog({ open: false, transaction: null })}
      >
        <DialogTitle>Categorize Transaction</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              label="Category"
            >
              <MenuItem value="inventory">Inventory</MenuItem>
              <MenuItem value="utilities">Utilities</MenuItem>
              <MenuItem value="salaries">Salaries</MenuItem>
              <MenuItem value="marketing">Marketing</MenuItem>
              <MenuItem value="rent">Rent</MenuItem>
              <MenuItem value="taxes">Taxes</MenuItem>
              <MenuItem value="other_expense">Other Expense</MenuItem>
              <MenuItem value="sales">Sales</MenuItem>
              <MenuItem value="other_income">Other Income</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategorizeDialog({ open: false, transaction: null })}>
            Cancel
          </Button>
          <Button onClick={saveCategorization} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default TransactionList;

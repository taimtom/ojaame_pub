/**
 * Reconciliation Dashboard - Match POS sales to bank deposits
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  AutoFixHigh as AutoIcon,
  Link as LinkIcon,
  CheckCircle as MatchedIcon,
  Warning as UnmatchedIcon
} from '@mui/icons-material';
import { useCurrency } from '../../contexts/CurrencyContext';
import axios from '../../utils/axios';
import { format } from 'date-fns';

const ReconciliationDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [unmatchedSales, setUnmatchedSales] = useState([]);
  const [unmatchedDeposits, setUnmatchedDeposits] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [matchDialog, setMatchDialog] = useState({ open: false, sale: null });
  const [autoReconcileResult, setAutoReconcileResult] = useState(null);

  const { formatAmount } = useCurrency();
  const companyId = localStorage.getItem('company_id');

  useEffect(() => {
    fetchUnmatched();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUnmatched = async () => {
    try {
      setLoading(true);
      const [salesRes, depositsRes] = await Promise.all([
        axios.get('/api/reconciliation/unreconciled', {
          params: { company_id: companyId, transaction_type: 'sales' }
        }),
        axios.get('/api/reconciliation/unreconciled', {
          params: { company_id: companyId, transaction_type: 'deposits' }
        })
      ]);

      setUnmatchedSales(salesRes.data.transactions || []);
      setUnmatchedDeposits(depositsRes.data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch unmatched transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoReconcile = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/reconciliation/auto-reconcile', {
        company_id: companyId,
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date().toISOString()
      });

      setAutoReconcileResult(response.data);
      fetchUnmatched(); // Refresh lists
    } catch (error) {
      console.error('Auto-reconciliation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualMatch = async (saleId) => {
    try {
      // Fetch suggestions for this sale
      const response = await axios.get(`/api/reconciliation/suggest-matches/${saleId}`, {
        params: { transaction_type: 'sale' }
      });

      const sale = unmatchedSales.find(s => s.id === saleId);
      setSuggestions(response.data.suggestions || []);
      setMatchDialog({ open: true, sale });
    } catch (error) {
      console.error('Failed to fetch match suggestions:', error);
    }
  };

  const confirmManualMatch = async (depositId) => {
    try {
      await axios.post('/api/reconciliation/manual-reconcile', {
        sale_id: matchDialog.sale.id,
        deposit_id: depositId,
        notes: 'Manually matched by user'
      });

      setMatchDialog({ open: false, sale: null });
      fetchUnmatched();
    } catch (error) {
      console.error('Failed to match transactions:', error);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence === 'high') return 'success';
    if (confidence === 'medium') return 'warning';
    return 'error';
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <Typography variant="h5" gutterBottom>
            Bank Reconciliation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Match POS sales to bank deposits for accurate accounting
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <AutoIcon />}
          onClick={handleAutoReconcile}
          disabled={loading}
        >
          Auto-Reconcile
        </Button>
      </Box>

      {/* Auto-Reconcile Result */}
      {autoReconcileResult && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setAutoReconcileResult(null)}
        >
          <Typography variant="body2">
            <strong>Auto-reconciliation complete!</strong><br />
            Matched: {autoReconcileResult.matched} transactions<br />
            Unmatched Sales: {autoReconcileResult.unmatched_sales}<br />
            Unmatched Deposits: {autoReconcileResult.unmatched_deposits}
          </Typography>
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <UnmatchedIcon color="warning" fontSize="large" />
              <div>
                <Typography variant="h4">{unmatchedSales.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Unmatched Sales
                </Typography>
              </div>
            </Stack>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <UnmatchedIcon color="warning" fontSize="large" />
              <div>
                <Typography variant="h4">{unmatchedDeposits.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Unmatched Deposits
                </Typography>
              </div>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Unmatched Sales Table */}
      <Card sx={{ mb: 3 }}>
        <Box p={2} borderBottom={1} borderColor="divider">
          <Typography variant="h6">Unmatched Sales</Typography>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Invoice #</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">Loading...</TableCell>
              </TableRow>
            ) : unmatchedSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">All sales are reconciled!</Typography>
                </TableCell>
              </TableRow>
            ) : (
              unmatchedSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{format(new Date(sale.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{sale.reference}</TableCell>
                  <TableCell align="right">
                    {formatAmount(sale.amount, sale.currency)}
                  </TableCell>
                  <TableCell>
                    <Chip label={sale.payment_method} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      startIcon={<LinkIcon />}
                      onClick={() => handleManualMatch(sale.id)}
                    >
                      Find Match
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Unmatched Deposits Table */}
      <Card>
        <Box p={2} borderBottom={1} borderColor="divider">
          <Typography variant="h6">Unmatched Bank Deposits</Typography>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Bank Account</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">Loading...</TableCell>
              </TableRow>
            ) : unmatchedDeposits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography color="text.secondary">All deposits are reconciled!</Typography>
                </TableCell>
              </TableRow>
            ) : (
              unmatchedDeposits.map((deposit) => (
                <TableRow key={deposit.id}>
                  <TableCell>{format(new Date(deposit.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{deposit.description}</TableCell>
                  <TableCell align="right">
                    {formatAmount(deposit.amount, deposit.currency)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{deposit.reference}</Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Match Suggestions Dialog */}
      <Dialog
        open={matchDialog.open}
        onClose={() => setMatchDialog({ open: false, sale: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Match Deposit to Sale
          {matchDialog.sale && (
            <Typography variant="body2" color="text.secondary">
              {matchDialog.sale.reference} - {formatAmount(matchDialog.sale.amount, matchDialog.sale.currency)}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {suggestions.length === 0 ? (
            <Alert severity="info">
              No matching deposits found. The deposit might not have arrived yet.
            </Alert>
          ) : (
            <List>
              {suggestions.map((suggestion, index) => (
                <React.Fragment key={suggestion.deposit_id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    secondaryAction={
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => confirmManualMatch(suggestion.deposit_id)}
                      >
                        Match
                      </Button>
                    }
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body1">
                            {formatAmount(suggestion.amount, 'USD')}
                          </Typography>
                          <Chip
                            label={`${(suggestion.score * 100).toFixed(0)}% Match`}
                            color={getConfidenceColor(suggestion.confidence)}
                            size="small"
                          />
                        </Stack>
                      }
                      secondary={
                        <>
                          {format(new Date(suggestion.date), 'MMM dd, yyyy')} • {suggestion.description}
                        </>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMatchDialog({ open: false, sale: null })}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReconciliationDashboard;

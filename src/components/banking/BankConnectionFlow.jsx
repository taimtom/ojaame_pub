/**
 * Bank Connection Flow - Integrates Plaid Link and Mono Connect
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  AccountBalance as BankIcon,
  Public as InternationalIcon,
  LocationOn as AfricaIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import { usePlaidLink } from 'react-plaid-link';
import axios from '../../utils/axios';

const BankConnectionFlow = ({ open, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState(0); // 0: International, 1: African
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [linkToken, setLinkToken] = useState(null);
  const [monoCode, setMonoCode] = useState(null);

  // Fetch Plaid Link Token
  useEffect(() => {
    if (open && activeTab === 0) {
      fetchPlaidLinkToken();
    }
  }, [open, activeTab]);

  const fetchPlaidLinkToken = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/banking/plaid/create-link-token', {
        user_id: localStorage.getItem('user_id'),
        company_id: localStorage.getItem('company_id')
      });
      setLinkToken(response.data.link_token);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch Plaid link token:', err);
      setError('Failed to initialize bank connection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Plaid Link Handler
  const onPlaidSuccess = async (publicToken, metadata) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/banking/connect-bank', {
        provider: 'plaid',
        public_token: publicToken,
        account_id: metadata.accounts[0]?.id,
        institution: metadata.institution
      });

      if (onSuccess) {
        onSuccess(response.data);
      }
      onClose();
    } catch (err) {
      console.error('Failed to connect bank:', err);
      setError('Failed to connect bank account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const { open: openPlaidLink, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: (err) => {
      if (err) {
        console.error('Plaid Link exit:', err);
        setError('Bank connection cancelled or failed.');
      }
    }
  });

  // Mono Connect Handler
  const openMonoConnect = () => {
    const monoConnect = new window.MonoConnect({
      key: process.env.REACT_APP_MONO_PUBLIC_KEY,
      onSuccess: async ({ code }) => {
        try {
          setLoading(true);
          const response = await axios.post('/api/banking/connect-bank', {
            provider: 'mono',
            mono_code: code
          });

          if (onSuccess) {
            onSuccess(response.data);
          }
          onClose();
        } catch (err) {
          console.error('Failed to connect Mono bank:', err);
          setError('Failed to connect bank account. Please try again.');
        } finally {
          setLoading(false);
        }
      },
      onClose: () => {
        console.log('Mono widget closed');
      }
    });

    monoConnect.setup();
    monoConnect.open();
  };

  const handleConnect = () => {
    if (activeTab === 0) {
      // Plaid for international
      if (ready && linkToken) {
        openPlaidLink();
      }
    } else {
      // Mono for African banks
      openMonoConnect();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <BankIcon color="primary" />
          <Typography variant="h6">Connect Your Bank Account</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab
            icon={<InternationalIcon />}
            label="International Banks"
            iconPosition="start"
          />
          <Tab
            icon={<AfricaIcon />}
            label="African Banks"
            iconPosition="start"
          />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* International Banks Tab */}
        {activeTab === 0 && (
          <Box>
            <Typography variant="body1" color="text.secondary" paragraph>
              Connect your bank accounts from the US, Canada, UK, Europe, and more.
              Powered by Plaid.
            </Typography>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Supported Countries
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {['US', 'CA', 'GB', 'FR', 'ES', 'IE', 'NL'].map(country => (
                        <Chip key={country} label={country} size="small" />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Features
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Real-time balance updates<br />
                      • Transaction history<br />
                      • Bank-level encryption
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mb: 2 }}>
              Your bank credentials are never stored. We use bank-level security.
            </Alert>
          </Box>
        )}

        {/* African Banks Tab */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="body1" color="text.secondary" paragraph>
              Connect your bank accounts from Nigeria, Ghana, Kenya, South Africa, and more.
              Powered by Mono.
            </Typography>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Supported Countries
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {['Nigeria', 'Ghana', 'Kenya', 'South Africa'].map(country => (
                        <Chip key={country} label={country} size="small" />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Supported Banks
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • All major Nigerian banks<br />
                      • GCB Bank, Access Bank (Ghana)<br />
                      • And many more...
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mb: 2 }}>
              We use secure, read-only access to your bank. No payments can be made without your approval.
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConnect}
          disabled={loading || (activeTab === 0 && !ready)}
          startIcon={loading ? <CircularProgress size={20} /> : <BankIcon />}
        >
          {loading ? 'Connecting...' : 'Connect Bank Account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BankConnectionFlow;

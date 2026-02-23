/**
 * Onboarding Wizard - Step-by-step setup for new businesses
 */

import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Business as BusinessIcon,
  Category as IndustryIcon,
  Store as StoreIcon,
  People as TeamIcon,
  AccountBalance as BankIcon,
  CheckCircle as CompleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import IndustrySelector from './IndustrySelector';
import BankConnectionFlow from '../banking/BankConnectionFlow';
import axios from '../../utils/axios';

const STEPS = [
  'Business Information',
  'Choose Industry',
  'Setup Store',
  'Invite Team',
  'Connect Bank (Optional)',
  'Complete'
];

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form data
  const [businessData, setBusinessData] = useState({
    companyName: '',
    legalName: '',
    taxId: '',
    country: '',
    currency: 'USD',
    logo: null
  });

  const [industryData, setIndustryData] = useState(null);
  
  const [storeData, setStoreData] = useState({
    storeName: '',
    location: '',
    contactEmail: '',
    contactPhone: ''
  });

  const [teamData, setTeamData] = useState({
    inviteEmails: [''],
    skipForNow: false
  });

  const [bankConnected, setBankConnected] = useState(false);
  const [showBankDialog, setShowBankDialog] = useState(false);

  const handleNext = async () => {
    try {
      setError(null);
      setLoading(true);

      // Validate current step
      if (activeStep === 0) {
        if (!businessData.companyName || !businessData.country || !businessData.currency) {
          setError('Please fill in all required fields');
          setLoading(false);
          return;
        }
        // Create company
        const response = await axios.post('/api/companies', {
          companyName: businessData.companyName,
          legalName: businessData.legalName || businessData.companyName,
          companyLocation: businessData.country,
          taxId: businessData.taxId,
          baseCurrency: businessData.currency
        });
        localStorage.setItem('company_id', response.data.id);
      }

      if (activeStep === 1) {
        if (!industryData) {
          setError('Please select an industry');
          setLoading(false);
          return;
        }
        // Save industry configuration
        await axios.post('/api/onboarding/industry-config', {
          company_id: localStorage.getItem('company_id'),
          industry_type: industryData.id,
          enabled_modules: industryData.features
        });
      }

      if (activeStep === 2) {
        if (!storeData.storeName) {
          setError('Please provide a store name');
          setLoading(false);
          return;
        }
        // Create first store
        await axios.post('/api/stores', {
          company_id: localStorage.getItem('company_id'),
          store_name: storeData.storeName,
          location: storeData.location,
          contact_email: storeData.contactEmail,
          contact_phone: storeData.contactPhone
        });
      }

      if (activeStep === 3) {
        if (!teamData.skipForNow && teamData.inviteEmails.some(email => email.trim())) {
          // Send team invitations
          await axios.post('/api/team/invite-bulk', {
            company_id: localStorage.getItem('company_id'),
            emails: teamData.inviteEmails.filter(email => email.trim())
          });
        }
      }

      if (activeStep === 5) {
        // Mark onboarding as complete
        await axios.post('/api/onboarding/complete', {
          company_id: localStorage.getItem('company_id')
        });
        
        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard/quick');
        }, 2000);
      }

      setActiveStep((prevStep) => prevStep + 1);
    } catch (err) {
      console.error('Onboarding step failed:', err);
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError(null);
  };

  const handleSkip = () => {
    if (activeStep === 3) {
      setTeamData({ ...teamData, skipForNow: true });
    }
    setActiveStep((prevStep) => prevStep + 1);
  };

  const addEmailField = () => {
    setTeamData({
      ...teamData,
      inviteEmails: [...teamData.inviteEmails, '']
    });
  };

  const updateEmailField = (index, value) => {
    const newEmails = [...teamData.inviteEmails];
    newEmails[index] = value;
    setTeamData({ ...teamData, inviteEmails: newEmails });
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Tell us about your business
            </Typography>
            <Grid container spacing={3} mt={1}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Business Name *"
                  value={businessData.companyName}
                  onChange={(e) => setBusinessData({ ...businessData, companyName: e.target.value })}
                  placeholder="e.g., Acme Store"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Legal Name"
                  value={businessData.legalName}
                  onChange={(e) => setBusinessData({ ...businessData, legalName: e.target.value })}
                  placeholder="Official registered name"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tax ID / Registration Number"
                  value={businessData.taxId}
                  onChange={(e) => setBusinessData({ ...businessData, taxId: e.target.value })}
                  placeholder="e.g., CAC123456 or EIN"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Country *"
                  value={businessData.country}
                  onChange={(e) => setBusinessData({ ...businessData, country: e.target.value })}
                  SelectProps={{ native: true }}
                >
                  <option value="">Select country</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Kenya">Kenya</option>
                  <option value="South Africa">South Africa</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Base Currency *"
                  value={businessData.currency}
                  onChange={(e) => setBusinessData({ ...businessData, currency: e.target.value })}
                  SelectProps={{ native: true }}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="NGN">NGN - Nigerian Naira</option>
                  <option value="GHS">GHS - Ghanaian Cedi</option>
                  <option value="KES">KES - Kenyan Shilling</option>
                  <option value="ZAR">ZAR - South African Rand</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                </TextField>
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <IndustrySelector
            onSelect={(industry) => setIndustryData(industry)}
          />
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Setup your first store
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              You can add more stores later
            </Typography>
            <Grid container spacing={3} mt={1}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Store Name *"
                  value={storeData.storeName}
                  onChange={(e) => setStoreData({ ...storeData, storeName: e.target.value })}
                  placeholder="e.g., Main Branch"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={storeData.location}
                  onChange={(e) => setStoreData({ ...storeData, location: e.target.value })}
                  placeholder="e.g., Lagos, Nigeria"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Email"
                  type="email"
                  value={storeData.contactEmail}
                  onChange={(e) => setStoreData({ ...storeData, contactEmail: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Phone"
                  value={storeData.contactPhone}
                  onChange={(e) => setStoreData({ ...storeData, contactPhone: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Invite your team
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Send invitations to staff members who will use the system
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={teamData.skipForNow}
                  onChange={(e) => setTeamData({ ...teamData, skipForNow: e.target.checked })}
                />
              }
              label="Skip for now, I'll add team members later"
            />

            {!teamData.skipForNow && (
              <Stack spacing={2} mt={3}>
                {teamData.inviteEmails.map((email, index) => (
                  <TextField
                    key={index}
                    fullWidth
                    label={`Team Member ${index + 1} Email`}
                    type="email"
                    value={email}
                    onChange={(e) => updateEmailField(index, e.target.value)}
                    placeholder="email@example.com"
                  />
                ))}
                <Button variant="outlined" onClick={addEmailField}>
                  + Add Another
                </Button>
              </Stack>
            )}
          </Box>
        );

      case 4:
        return (
          <Box textAlign="center">
            <BankIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Connect Your Bank Account (Optional)
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Connect your bank for automatic transaction sync and reconciliation
            </Typography>

            {bankConnected ? (
              <Alert severity="success" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Bank account connected!</strong><br />
                  Your transactions will sync automatically.
                </Typography>
              </Alert>
            ) : (
              <Stack spacing={2} mt={3}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => setShowBankDialog(true)}
                >
                  Connect Bank Account
                </Button>
                <Typography variant="caption" color="text.secondary">
                  You can skip this step and connect your bank later from settings
                </Typography>
              </Stack>
            )}

            <BankConnectionFlow
              open={showBankDialog}
              onClose={() => setShowBankDialog(false)}
              onSuccess={() => {
                setBankConnected(true);
                setShowBankDialog(false);
              }}
            />
          </Box>
        );

      case 5:
        return (
          <Box textAlign="center">
            <CompleteIcon sx={{ fontSize: 100, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              All Set!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your OJAAME account is ready. You&apos;ll be redirected to your dashboard shortly.
            </Typography>

            <Card variant="outlined" sx={{ mt: 4, maxWidth: 500, mx: 'auto' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  What&apos;s Next?
                </Typography>
                <Stack spacing={1} alignItems="flex-start">
                  <Chip label="✓ Add your products or services" color="success" />
                  <Chip label="✓ Customize your store settings" color="success" />
                  <Chip label="✓ Make your first sale" color="success" />
                  <Chip label="✓ Explore analytics" color="success" />
                </Stack>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 4 }}>
          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0 || activeStep === 5}
              onClick={handleBack}
            >
              Back
            </Button>

            <Box>
              {activeStep === 3 || activeStep === 4 ? (
                <Button onClick={handleSkip} sx={{ mr: 1 }}>
                  Skip
                </Button>
              ) : null}

              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading || activeStep === 5}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {activeStep === STEPS.length - 2 ? 'Finish' : 'Next'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default OnboardingWizard;

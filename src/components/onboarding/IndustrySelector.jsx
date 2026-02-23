/**
 * Industry Selector - Choose business industry template
 */

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Stack
} from '@mui/material';
import {
  School as EducationIcon,
  Restaurant as RestaurantIcon,
  Store as RetailIcon,
  LocalHospital as HealthcareIcon,
  Build as ServicesIcon,
  Inventory as WholesaleIcon,
  AccountBalance as FinanceIcon,
  FitnessCenter as FitnessIcon
} from '@mui/icons-material';

const INDUSTRY_TEMPLATES = [
  {
    id: 'education',
    name: 'Education',
    icon: <EducationIcon sx={{ fontSize: 60 }} />,
    description: 'Schools, universities, training centers',
    features: [
      'Student Management',
      'Class & Section Organization',
      'Attendance Tracking',
      'Result Recording',
      'Fee Management',
      'Lecturer Attendance'
    ],
    color: '#2196f3'
  },
  {
    id: 'restaurant',
    name: 'Restaurant & Hospitality',
    icon: <RestaurantIcon sx={{ fontSize: 60 }} />,
    description: 'Restaurants, cafes, bars, hotels',
    features: [
      'Table Management',
      'Kitchen Orders',
      'Reservations',
      'Menu Management',
      'Split Bills',
      'Delivery Integration'
    ],
    color: '#ff9800'
  },
  {
    id: 'retail',
    name: 'Retail Store',
    icon: <RetailIcon sx={{ fontSize: 60 }} />,
    description: 'Shops, boutiques, convenience stores',
    features: [
      'Quick POS',
      'Inventory Management',
      'Barcode Scanning',
      'Loyalty Programs',
      'Returns & Exchanges',
      'Multi-location Support'
    ],
    color: '#4caf50'
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: <HealthcareIcon sx={{ fontSize: 60 }} />,
    description: 'Clinics, pharmacies, hospitals',
    features: [
      'Patient Records',
      'Appointment Scheduling',
      'Prescription Management',
      'Insurance Processing',
      'Lab Results',
      'Billing & Claims'
    ],
    color: '#e91e63'
  },
  {
    id: 'services',
    name: 'Service Business',
    icon: <ServicesIcon sx={{ fontSize: 60 }} />,
    description: 'Salons, repair shops, consultancies',
    features: [
      'Service Booking',
      'Staff Scheduling',
      'Service Packages',
      'Commission Tracking',
      'Customer History',
      'Automated Reminders'
    ],
    color: '#9c27b0'
  },
  {
    id: 'wholesale',
    name: 'Wholesale & Distribution',
    icon: <WholesaleIcon sx={{ fontSize: 60 }} />,
    description: 'Distributors, wholesalers, suppliers',
    features: [
      'Bulk Pricing',
      'Purchase Orders',
      'Supplier Management',
      'Stock Transfer',
      'Credit Management',
      'Route Planning'
    ],
    color: '#607d8b'
  },
  {
    id: 'fitness',
    name: 'Fitness & Wellness',
    icon: <FitnessIcon sx={{ fontSize: 60 }} />,
    description: 'Gyms, yoga studios, spas',
    features: [
      'Membership Management',
      'Class Scheduling',
      'Trainer Assignment',
      'Equipment Tracking',
      'Progress Monitoring',
      'Automated Renewals'
    ],
    color: '#ff5722'
  },
  {
    id: 'other',
    name: 'Other / Custom',
    icon: <FinanceIcon sx={{ fontSize: 60 }} />,
    description: 'Generic business setup',
    features: [
      'Basic POS',
      'Inventory',
      'Sales Tracking',
      'Financial Reports',
      'Multi-currency',
      'Bank Integration'
    ],
    color: '#795548'
  }
];

const IndustrySelector = ({ onSelect }) => {
  const [selectedIndustry, setSelectedIndustry] = useState(null);

  const handleSelect = (industry) => {
    setSelectedIndustry(industry.id);
    if (onSelect) {
      onSelect(industry);
    }
  };

  return (
    <Box>
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" gutterBottom>
          Choose Your Industry
        </Typography>
        <Typography variant="body1" color="text.secondary">
          We'll customize OJAAME with features specific to your business
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {INDUSTRY_TEMPLATES.map((industry) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={industry.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: selectedIndustry === industry.id ? 2 : 0,
                borderColor: industry.color,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => handleSelect(industry)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  display="flex"
                  justifyContent="center"
                  mb={2}
                  color={industry.color}
                >
                  {industry.icon}
                </Box>

                <Typography variant="h6" align="center" gutterBottom>
                  {industry.name}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  paragraph
                >
                  {industry.description}
                </Typography>

                <Stack spacing={0.5} mt={2}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary">
                    Key Features:
                  </Typography>
                  {industry.features.slice(0, 4).map((feature, index) => (
                    <Typography key={index} variant="caption" color="text.secondary">
                      • {feature}
                    </Typography>
                  ))}
                  {industry.features.length > 4 && (
                    <Typography variant="caption" color="primary">
                      + {industry.features.length - 4} more...
                    </Typography>
                  )}
                </Stack>
              </CardContent>

              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  variant={selectedIndustry === industry.id ? 'contained' : 'outlined'}
                  sx={{
                    backgroundColor: selectedIndustry === industry.id ? industry.color : 'transparent',
                    borderColor: industry.color,
                    color: selectedIndustry === industry.id ? 'white' : industry.color,
                    '&:hover': {
                      backgroundColor: industry.color,
                      color: 'white'
                    }
                  }}
                >
                  {selectedIndustry === industry.id ? 'Selected' : 'Select'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mt={4} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          Don't worry, you can customize these features later or add more modules
        </Typography>
      </Box>
    </Box>
  );
};

export default IndustrySelector;
export { INDUSTRY_TEMPLATES };

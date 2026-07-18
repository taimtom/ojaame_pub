import { Navigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { isHotelLodgingBusiness } from 'src/utils/hotel-lodging';

import { useCompany } from 'src/actions/company';

/** Restricts Front Desk routes to hotel / lodge / resort businesses. */
export function HotelLodgingGuard({ children }) {
  const { company, companyLoading } = useCompany({ skip: false });

  if (companyLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isHotelLodgingBusiness(company)) {
    return <Navigate to={paths.dashboard.root} replace />;
  }

  return children;
}

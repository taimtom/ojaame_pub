import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAgentAuth } from 'src/contexts/AgentAuthContext';

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/agent/dashboard', icon: <DashboardIcon /> },
  { label: 'Businesses', path: '/agent/businesses', icon: <BusinessIcon /> },
  { label: 'Earnings', path: '/agent/earnings', icon: <AttachMoneyIcon /> },
  { label: 'Withdrawals', path: '/agent/withdrawals', icon: <AccountBalanceWalletIcon /> },
  { label: 'Settings', path: '/agent/settings', icon: <SettingsIcon /> },
];

export default function AgentLayout() {
  const { agent, logout } = useAgentAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/agent/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }} elevation={1}>
        <Toolbar>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            Ojaame Agent Portal
          </Typography>
          <Typography variant="body2" sx={{ mr: 2, opacity: 0.85 }}>
            {agent?.first_name} {agent?.last_name}
          </Typography>
          <Button color="inherit" size="small" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', pt: 1 }}>
          <List dense>
            {NAV_ITEMS.map((item) => (
              <ListItemButton
                key={item.path}
                component={NavLink}
                to={item.path}
                end
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  mb: 0.5,
                  '&.active': { bgcolor: 'primary.lighter', color: 'primary.main' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
}

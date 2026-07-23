/**
 * Permission-Aware Navigation Component
 * 
 * Filters navigation items based on user permissions.
 */

import React, { useMemo } from 'react';
import { usePermissions } from '../../contexts/PermissionContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Collapse
} from '@mui/material';
import { Iconify } from 'src/components/iconify';

const DashboardIcon = (props) => <Iconify icon="solar:widget-bold" width={20} {...props} />;
const POSIcon = (props) => <Iconify icon="solar:point-of-sale-bold" width={20} {...props} />;
const InventoryIcon = (props) => <Iconify icon="solar:box-bold" width={20} {...props} />;
const PeopleIcon = (props) => <Iconify icon="solar:users-group-rounded-bold" width={20} {...props} />;
const BankIcon = (props) => <Iconify icon="solar:bank-bold" width={20} {...props} />;
const ReportsIcon = (props) => <Iconify icon="solar:chart-bold" width={20} {...props} />;
const SettingsIcon = (props) => <Iconify icon="solar:settings-bold" width={20} {...props} />;
const StoreIcon = (props) => <Iconify icon="solar:shop-bold" width={20} {...props} />;
const ExpandLess = (props) => <Iconify icon="solar:alt-arrow-up-bold" width={20} {...props} />;
const ExpandMore = (props) => <Iconify icon="solar:alt-arrow-down-bold" width={20} {...props} />;

const NAVIGATION_ITEMS = [
  {
    id: 'quick-dashboard',
    label: 'Quick Dashboard',
    path: '/dashboard/quick',
    icon: <POSIcon />,
    permission: { feature: 'quick_dashboard', action: 'view' }
  },
  {
    id: 'store-dashboard',
    label: 'Store Dashboard',
    path: '/dashboard/store',
    icon: <StoreIcon />,
    permission: { feature: 'store_dashboard', action: 'view' }
  },
  {
    id: 'company-dashboard',
    label: 'Company Dashboard',
    path: '/dashboard/company',
    icon: <DashboardIcon />,
    permission: { feature: 'company_dashboard', action: 'view' }
  },
  { divider: true },
  {
    id: 'sales',
    label: 'Sales',
    icon: <POSIcon />,
    permission: { feature: 'sales', action: 'view' },
    children: [
      {
        id: 'sales-list',
        label: 'View Sales',
        path: '/sales',
        permission: { feature: 'sales', action: 'view' }
      },
      {
        id: 'sales-create',
        label: 'New Sale',
        path: '/sales/new',
        permission: { feature: 'sales', action: 'create' }
      }
    ]
  },
  {
    id: 'products',
    label: 'Products',
    icon: <InventoryIcon />,
    permission: { feature: 'products', action: 'view' },
    children: [
      {
        id: 'products-list',
        label: 'View Products',
        path: '/products',
        permission: { feature: 'products', action: 'view' }
      },
      {
        id: 'products-create',
        label: 'Add Product',
        path: '/products/new',
        permission: { feature: 'products', action: 'create' }
      },
      {
        id: 'inventory-management',
        label: 'Manage Stock',
        path: '/inventory',
        permission: { feature: 'products', action: 'manage_stock' }
      }
    ]
  },
  {
    id: 'banking',
    label: 'Banking',
    icon: <BankIcon />,
    permission: { feature: 'banking', action: 'view_accounts' },
    children: [
      {
        id: 'bank-accounts',
        label: 'Bank Accounts',
        path: '/banking/accounts',
        permission: { feature: 'banking', action: 'view_accounts' }
      },
      {
        id: 'transactions',
        label: 'Transactions',
        path: '/banking/transactions',
        permission: { feature: 'banking', action: 'view_transactions' }
      },
      {
        id: 'reconciliation',
        label: 'Reconciliation',
        path: '/banking/reconciliation',
        permission: { feature: 'banking', action: 'reconcile' }
      }
    ]
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <ReportsIcon />,
    permission: { feature: 'reports', action: 'view_sales' },
    children: [
      {
        id: 'sales-reports',
        label: 'Sales Reports',
        path: '/reports/sales',
        permission: { feature: 'reports', action: 'view_sales' }
      },
      {
        id: 'financial-reports',
        label: 'Financial Reports',
        path: '/reports/financial',
        permission: { feature: 'reports', action: 'view_financial' }
      }
    ]
  },
  { divider: true },
  {
    id: 'team',
    label: 'Team',
    path: '/team',
    icon: <PeopleIcon />,
    permission: { feature: 'users', action: 'view' }
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: <SettingsIcon />,
    permission: { feature: 'company', action: 'edit_settings' }
  }
];

const PermissionAwareNavigation = ({ open, onClose, drawerWidth = 280 }) => {
  const { hasPermission } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = React.useState({});

  // Filter navigation items based on permissions
  const filteredItems = useMemo(() => NAVIGATION_ITEMS.filter(item => {
      if (item.divider) return true;
      
      if (!item.permission) return true;
      
      const { feature, action } = item.permission;
      return hasPermission(feature, action);
    }).map(item => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter(child => {
            if (!child.permission) return true;
            const { feature, action } = child.permission;
            return hasPermission(feature, action);
          })
        };
      }
      return item;
    }), [hasPermission]);

  const handleItemClick = (item) => {
    if (item.children && item.children.length > 0) {
      setExpandedItems(prev => ({
        ...prev,
        [item.id]: !prev[item.id]
      }));
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const renderNavItem = (item, depth = 0) => {
    if (item.divider) {
      return <Divider key={`divider-${depth}`} sx={{ my: 1 }} />;
    }

    const isActive = location.pathname === item.path;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[item.id];

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding sx={{ pl: depth * 2 }}>
          <ListItemButton
            selected={isActive}
            onClick={() => handleItemClick(item)}
          >
            {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
            <ListItemText primary={item.label} />
            {hasChildren && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>
        
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map(child => renderNavItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Drawer
      variant="permanent"
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', mt: 8 }}>
        <List>
          {filteredItems.map(item => renderNavItem(item))}
        </List>
      </Box>
    </Drawer>
  );
};

export default PermissionAwareNavigation;

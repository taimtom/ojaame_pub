import { keyframes } from '@emotion/react';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { paramCase } from 'src/utils/change-case';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

// Glow keyframes for pulsing effect
const glow = keyframes`
  0% { box-shadow: 0 0 0px rgba(25,118,210,0.5); }
  50% { box-shadow: 0 0 8px rgba(25,118,210,0.7); }
  100% { box-shadow: 0 0 0px rgba(25,118,210,0.5); }
`;

export function WorkspacesPopover({ data = [], sx, ...other }) {
  const router = useRouter();
  const popover = usePopover();
  const location = useLocation();
  const navigate = useNavigate();

  const { id: currentStoreParam } = useParams();
  const storedWorkspaceJson = localStorage.getItem('activeWorkspace');
  const storedWorkspace = storedWorkspaceJson ? JSON.parse(storedWorkspaceJson) : null;
  const storedWorkspaceId = storedWorkspace?.id;

  // Redirect to store creation if no stores exist
  useEffect(() => {
    if (data.length === 0 && !storedWorkspace) navigate(paths.dashboard.store);
  }, [data, storedWorkspace, navigate]);

  const mediaQuery = 'sm';
  const currentId = currentStoreParam?.split('-').pop() || storedWorkspaceId;
  const found = data.find(s => s.id.toString() === currentId);
  const initial = found || storedWorkspace || (data.length ? data[0] : null);

  const [workspace, setWorkspace] = useState(initial);
  const noWorkspace = !workspace;

  // Sync on URL or storage change
  useEffect(() => {
    const active = data.find(s => s.id.toString() === (currentStoreParam?.split('-').pop() || storedWorkspaceId));
    if (active) setWorkspace(active);
  }, [currentStoreParam, data, storedWorkspaceId]);

  // Poll localStorage for changes
  useEffect(() => {
    const interval = setInterval(() => {
      const json = localStorage.getItem('activeWorkspace');
      if (json) {
        const parsed = JSON.parse(json);
        setWorkspace(prev => (prev?.id !== parsed.id ? parsed : prev));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const buildStoreParam = store => `${paramCase(store.storeName)}-${store.id}`;

  const handleChangeWorkspace = useCallback(newWs => {
    setWorkspace(newWs);
    popover.onClose();
    localStorage.setItem('activeWorkspace', JSON.stringify(newWs));
    navigate(`${paths.dashboard.root}/${buildStoreParam(newWs)}`);
  }, [popover, navigate]);

  const handleEditStore = useCallback(
    (storeId) => {
      if (storeId.toString() === workspace?.id.toString()) {
        const storeParam = buildStoreParam(workspace);
        const destination = paths.dashboard.store.account(storeParam);
        popover.onClose();
        if (location.pathname === destination) {
          window.location.reload();
        } else {
          navigate(destination);
        }
      }
    },
    [location.pathname, navigate, popover, workspace]
  );

  const handleAddNewStore = useCallback(() => {
    popover.onClose();
    navigate(paths.dashboard.store.new);
  }, [navigate, popover]);

  return (
    <>
      <ButtonBase
        disableRipple
        onClick={popover.onOpen}
        sx={{
          py: 0.5,
          gap: { xs: 0.5, [mediaQuery]: 1 },
          display: 'flex',
          alignItems: 'center',
          ...sx,
        }}
        {...other}
      >
        {/* Workspace Avatar or Glowing Placeholder */}
        {workspace ? (
          workspace.avatarUrl ? (
            <Avatar
              alt={workspace.storeName}
              src={workspace.avatarUrl}
              sx={{ width: 24, height: 24 }}
            />
          ) : (
            <Avatar
              alt={workspace.storeName}
              sx={{ width: 24, height: 24, bgcolor: 'grey.300', fontSize: '0.75rem', fontWeight: 'bold' }}
            >
              {workspace.storeName.substring(0, 2).toUpperCase()}
            </Avatar>
          )
        ) : (
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: 'grey.200',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: `${glow} 2s infinite`,
            }}
          >
            <Iconify icon="akar-icons:store" width={16} height={16} />
          </Box>
        )}

        {/* Workspace Name or Prompt */}
        <Box
          component="span"
          sx={{
            typography: 'subtitle2',
            display: { xs: 'none', [mediaQuery]: 'inline-flex' },
            ...(noWorkspace && {
              color: 'primary.main',
              animation: `${glow} 2s infinite`,
            }),
          }}
        >
          {workspace ? workspace.storeName : 'Select a store'}
        </Box>

        {/* Plan Badge (only if workspace exists) */}
        {workspace && (
          <Label
            color={workspace.plan === 'Free' ? 'default' : 'info'}
            sx={{ height: 22, display: { xs: 'none', [mediaQuery]: 'inline-flex' } }}
          >
            {workspace.plan}
          </Label>
        )}

        <Iconify
          width={16}
          icon="carbon:chevron-sort"
          sx={{ color: 'text.disabled' }}
        />
      </ButtonBase>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'top-left' } }}
      >
        <MenuList sx={{ width: 240 }}>
          {data.map(option => {
            const isActive = option.id.toString() === workspace?.id.toString();
            return (
              <MenuItem
                key={option.id}
                selected={isActive}
                onClick={() => handleChangeWorkspace(option)}
                sx={{ height: 48 }}
              >
                {option.avatarUrl ? (
                  <Avatar alt={option.storeName} src={option.avatarUrl} sx={{ width: 24, height: 24 }} />
                ) : (
                  <Avatar
                    alt={option.storeName}
                    sx={{ width: 24, height: 24, bgcolor: 'grey.300', fontSize: '0.75rem', fontWeight: 'bold' }}
                  >
                    {option.storeName.substring(0, 2).toUpperCase()}
                  </Avatar>
                )}
                <Box component="span" sx={{ flexGrow: 1, ml: 1 }}>
                  {option.storeName}
                </Box>
                <Label color={option.plan === 'Free' ? 'default' : 'info'}>
                  {option.plan}
                </Label>
                <IconButton
                  size="small"
                  disabled={!isActive}
                  onClick={e => {
                    e.stopPropagation();
                    handleEditStore(option.id);
                  }}
                >
                  <Iconify icon="mdi:pencil" width={18} sx={{ color: 'text.secondary' }} />
                </IconButton>
              </MenuItem>
            );
          })}

          <MenuItem onClick={handleAddNewStore} sx={{ height: 48, mt: 1 }}>
            <Iconify icon="eva:plus-fill" width={20} sx={{ mr: 1 }} />
            Add new store
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}

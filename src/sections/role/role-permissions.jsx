// src/sections/role/view/role-permissions.jsx
import React, { useMemo } from 'react';

import List from '@mui/material/List';
import Card from '@mui/material/Card';
import ListItem from '@mui/material/ListItem';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import ListItemText from '@mui/material/ListItemText';

export function RolePermissions({ groupedPermissions }) {
  // sort categories alphabetically
  const categories = useMemo(
    () => Object.keys(groupedPermissions).sort(),
    [groupedPermissions]
  );

  return (
    <Grid container spacing={2}>
      {categories.map((category) => (
        <Grid xs={12} sm={6} key={category}>
          <Card>
            <CardHeader
              title={category.charAt(0).toUpperCase() + category.slice(1)}
              titleTypographyProps={{ variant: 'subtitle2', textTransform: 'capitalize' }}
            />
            <CardContent sx={{ pt: 0 }}>
              <List dense>
                {groupedPermissions[category]
                  .slice()
                  .sort()
                  .map((action) => (
                    <ListItem key={action} disableGutters>
                      <ListItemText
                        primary={action}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';

function AppLayout({ children, userRole, handleLogout }) {
  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            MD 2.0
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Exit
          </Button>
        </Toolbar>
      </AppBar>
      {children}
    </div>
  );
}

export default AppLayout;

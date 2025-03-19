// src/components/Admin/AdminDashboard.js
import React from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ManageASMs from './ManageASMs';
import ManageSDs from './ManageSDs';
import ManageDistributors from './ManageDistributors';
import ManageMaterials from './ManageMaterials';
import ManageRequests from './ManageRequests';
import MaterialOrderManagement from './MaterialOrderManagement'; // Import the new component

function AdminDashboard() {
  return (
    <div>
      <Typography variant="h4" sx={{ mt: 4, fontWeight: 'bold' }} gutterBottom>
        Admin Dashboard
      </Typography>

      {/* ASM Management Section */}
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="asm-content"
          id="asm-header"
        >
          <Typography>ASM Management</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ManageASMs />
        </AccordionDetails>
      </Accordion>

      {/* SD Management Section */}
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="sd-content"
          id="sd-header"
        >
          <Typography>SD Management</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ManageSDs />
        </AccordionDetails>
      </Accordion>

      {/* Distributors Management Section */}
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="distributors-content"
          id="distributors-header"
        >
          <Typography>Distributors Management</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ManageDistributors />
        </AccordionDetails>
      </Accordion>

      {/* Materials Management Section */}
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="materials-content"
          id="materials-header"
        >
          <Typography>Materials Management</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ManageMaterials />
        </AccordionDetails>
      </Accordion>

      {/* Request History Section */}
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="requests-content"
          id="requests-header"
        >
          <Typography>Request History</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ManageRequests />
        </AccordionDetails>
      </Accordion>

      {/* New Material Order Management Section */}
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="material-order-content"
          id="material-order-header"
        >
          <Typography>Material Order Management</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <MaterialOrderManagement />
        </AccordionDetails>
      </Accordion>
    </div>
  );
}

export default AdminDashboard;

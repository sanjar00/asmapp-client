// src/components/Admin/ManageRequests.js

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Collapse,
  IconButton,
  Box,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import api from '../../services/api';

function ManageRequests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/admin/request-history'); // Updated API endpoint
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const downloadRequest = async (requestId) => {
    try {
      const response = await api.get(`/admin/requests/${requestId}/download`, {
        responseType: 'blob',
      });

      // Create a link to download the file
      const blob = new Blob([response.data], {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Request_${requestId}.xlsx`;
      link.click();
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  return (
    <div>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Request ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Distributor</TableCell>
              <TableCell>SD Username</TableCell>
              <TableCell>ASM Username</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                downloadRequest={downloadRequest}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

function RequestRow({ request, downloadRequest }) {
  const [open, setOpen] = useState(false);

  const {
    id,
    createdAt,
    status,
    Distributor,
    ASM,
    RequestMaterials,
  } = request;

  const sdUsername = Distributor?.SD?.User?.username || 'N/A';
  const asmUsername = ASM?.User?.username || 'N/A';

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </TableCell>
        <TableCell>{id}</TableCell>
        <TableCell>{new Date(createdAt).toLocaleString()}</TableCell>
        <TableCell>{Distributor?.name || 'N/A'}</TableCell>
        <TableCell>{sdUsername}</TableCell>
        <TableCell>{asmUsername}</TableCell>
        <TableCell>{status}</TableCell>
        <TableCell>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => downloadRequest(id)}
          >
            Download
          </Button>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={8} style={{ paddingBottom: 0, paddingTop: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="subtitle1" gutterBottom component="div">
                Materials
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Material Code</TableCell>
                    <TableCell>Material Name</TableCell>
                    <TableCell>Quantity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {RequestMaterials.map((rm, index) => (
                    <TableRow key={`${rm.id}-${rm.Material?.id}-${index}`}>
                      <TableCell>{rm.Material?.code || 'N/A'}</TableCell>
                      <TableCell>{rm.Material?.name || 'N/A'}</TableCell>
                      <TableCell>{rm.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default ManageRequests;

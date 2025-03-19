// src/components/asm/ASMOrderPage.js

import React, { useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Button,
  TextField,
  Tabs,
  Tab,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material'; // Import the ArrowBack icon
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import api from '../../services/api';

function ASMOrderPage() {
  const [channel, setChannel] = useState('TT');
  const [materials, setMaterials] = useState({ TT: [], OP: [] }); // Separate materials for each channel
  const [quantities, setQuantities] = useState({ TT: {}, OP: {} });
  const [submittedStatus, setSubmittedStatus] = useState({ TT: false, OP: false }); // Track submission status
  const [orderSent, setOrderSent] = useState(false); // Overall order submission status
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const navigate = useNavigate(); // Initialize the navigate function

  // Fetch materials for a specific channel
  const fetchMaterials = useCallback(async (ch) => {
    try {
      const response = await api.get(`/asm/order-materials/${ch}`);
      setMaterials((prevMaterials) => ({
        ...prevMaterials,
        [ch]: response.data,
      }));
      console.log(`Fetched materials for channel ${ch}:`, response.data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  }, []);

  // Fetch saved orders for a specific channel
  const fetchSavedOrder = useCallback(async (ch) => {
    try {
      const response = await api.get(`/asm/orders/${ch}`);
      console.log(`Fetched saved orders for channel ${ch}:`, response.data);
      const savedQuantities = {};
      let isSubmitted = false;

      // Check the 'status' field to determine submission status
      if (response.data.status === 'Submitted') {
        isSubmitted = true;
      }

      response.data.materials.forEach((material) => {
        savedQuantities[material.materialId] = material.quantity;
      });

      setQuantities((prevQuantities) => ({
        ...prevQuantities,
        [ch]: savedQuantities,
      }));

      setSubmittedStatus((prevStatus) => ({
        ...prevStatus,
        [ch]: isSubmitted,
      }));

      console.log(`Channel ${ch} submitted: ${isSubmitted}`);
    } catch (error) {
      console.error('Error fetching saved order:', error);
    }
  }, []);

  // Fetch materials when channel changes
  useEffect(() => {
    fetchMaterials(channel);
  }, [fetchMaterials, channel]);

  // Fetch saved orders for all channels on component mount
  useEffect(() => {
    const channels = ['TT', 'OP'];
    channels.forEach((ch) => fetchSavedOrder(ch));
  }, [fetchSavedOrder]);

  // Determine if all orders have been submitted
  useEffect(() => {
    const { TT, OP } = submittedStatus;
    if (TT && OP) {
      setOrderSent(true);
      console.log('All orders submitted. Button should be disabled.');
    } else {
      setOrderSent(false);
      console.log('Orders not fully submitted yet.');
    }
  }, [submittedStatus]);

  // Handle quantity input changes
  const handleQuantityChange = (materialId, value) => {
    console.log(`Quantity changed: materialId=${materialId}, value=${value}`);
    setQuantities((prevQuantities) => ({
      ...prevQuantities,
      [channel]: {
        ...prevQuantities[channel],
        [materialId]: value,
      },
    }));
  };

  // Handle channel tab changes
  const handleTabChange = (event, newValue) => {
    setChannel(newValue);
  };

  // Open confirmation dialog
  const handleOpenConfirmDialog = () => {
    setOpenConfirmDialog(true);
  };

  // Close confirmation dialog
  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  // Handle submit action
  const handleConfirmAction = async () => {
    try {
      // Prepare data for both channels
      const channelsToSubmit = ['TT', 'OP'];

      // Create an array of promises to handle both channels
      const submitPromises = channelsToSubmit.map(async (ch) => {
        const materialsArray = materials[ch].map((material) => ({
          id: material.id,
          quantity: parseInt(quantities[ch][material.id], 10) || 0,
        }));

        console.log(`Submitting order for channel ${ch}:`, materialsArray);

        return api.post('/asm/orders', {
          channel: ch,
          materials: materialsArray,
          // status is no longer needed; backend sets it automatically
        });
      });

      // Execute all POST requests
      await Promise.all(submitPromises);

      alert('Orders submitted successfully.');
      setOpenConfirmDialog(false);

      // Reset quantities after submitting
      setQuantities({ TT: {}, OP: {} });

      // Re-fetch saved orders for both channels to update the UI
      channelsToSubmit.forEach((ch) => fetchSavedOrder(ch));
    } catch (error) {
      console.error('Error submitting orders:', error);
      alert('Error submitting orders. Please try again.');
    }
  };

  return (
    <div>
      {/* Back Button and Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }} gutterBottom>
          Order Materials
        </Typography>
      </Box>

      {/* Channel Tabs */}
      <Tabs value={channel} onChange={handleTabChange}>
        <Tab label="TT" value="TT" />
        <Tab label="OP" value="OP" />
      </Tabs>

      {/* Materials List */}
      <Box sx={{ mt: 2 }}>
        {materials[channel].map((material) => (
          <Box key={material.id} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <img
              src={`http://localhost:5000/${material.imageUrl}`}
              alt={material.name}
              style={{ width: 100, height: 100, marginRight: 16 }}
            />
            <Typography variant="body1" sx={{ flexGrow: 1 }}>
              {material.name}
            </Typography>
            <TextField
              type="number"
              label="Quantity"
              value={quantities[channel][material.id] || ''}
              onChange={(e) => handleQuantityChange(material.id, e.target.value)}
              inputProps={{ min: 0 }}
            />
          </Box>
        ))}
      </Box>

      {/* Action Button */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpenConfirmDialog}
        disabled={orderSent}
        sx={{ mt: 2 }}
      >
        {orderSent ? 'Sent' : 'Send Order'}
      </Button>

      {/* Confirmation Dialog */}
      <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Submit Order</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to send the order? It cannot be changed after sending.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button onClick={handleConfirmAction} variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default ASMOrderPage;
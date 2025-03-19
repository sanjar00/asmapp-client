// src/components/admin/MaterialOrderManagement.js

import React, { useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import api from '../../services/api';

function MaterialOrderManagement() {
  const [channel, setChannel] = useState('TT');
  const [materials, setMaterials] = useState([]);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    image: null,
  });
  const [orderStatus, setOrderStatus] = useState({
    totalASMs: 0,
    submittedOrders: 0,
    allSubmitted: false,
  });

  // State variables for editing materials
  const [editMaterial, setEditMaterial] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const fetchMaterials = useCallback(async () => {
    try {
      const response = await api.get(`/admin/order-materials/${channel}`);
      setMaterials(response.data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  }, [channel]);

  const fetchOrderStatus = async () => {
    try {
      const response = await api.get('/admin/orders/status');
      const { totalASMs, submittedOrders } = response.data;

      // Determine if all ASMs have submitted both TT and OP orders
      const allSubmitted = submittedOrders >= 2 * totalASMs;

      setOrderStatus({
        totalASMs,
        submittedOrders,
        allSubmitted,
      });
    } catch (error) {
      console.error('Error fetching order status:', error);
    }
  };

  useEffect(() => {
    fetchMaterials();
    fetchOrderStatus();
  }, [channel, fetchMaterials]);

  const handleChannelChange = (event) => {
    setChannel(event.target.value);
  };

  const handleInputChange = (event) => {
    const { name, value, files } = event.target;
    setNewMaterial({
      ...newMaterial,
      [name]: files ? files[0] : value,
    });
  };

  const handleAddMaterial = async () => {
    try {
      const formData = new FormData();
      formData.append('name', newMaterial.name);
      formData.append('channel', channel);
      if (newMaterial.image) {
        formData.append('image', newMaterial.image);
      }

      await api.post('/admin/order-materials', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setNewMaterial({ name: '', image: null });
      fetchMaterials();
    } catch (error) {
      console.error('Error adding material:', error);
    }
  };

  const handleDownloadOrder = async () => {
    try {
      const response = await api.get('/admin/orders/download', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Material-orders-2025.xlsx');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Error downloading order:', error);
      alert('Error downloading order. Please try again later.');
    }
  };

  // Edit material functions
  const handleEditMaterial = (material) => {
    setEditMaterial(material);
    setOpenEditDialog(true);
  };

  const handleUpdateMaterial = async () => {
    try {
      const formData = new FormData();
      formData.append('name', editMaterial.name);
      formData.append('channel', channel);
      if (editMaterial.image) {
        formData.append('image', editMaterial.image);
      }

      await api.put(`/admin/order-materials/${editMaterial.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setEditMaterial(null);
      setOpenEditDialog(false);
      fetchMaterials();
    } catch (error) {
      console.error('Error updating material:', error);
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await api.delete(`/admin/order-materials/${id}`);
        fetchMaterials();
      } catch (error) {
        console.error('Error deleting material:', error);
      }
    }
  };

  const handleEditInputChange = (event) => {
    const { name, value, files } = event.target;
    setEditMaterial({
      ...editMaterial,
      [name]: files ? files[0] : value,
    });
  };

  return (
    <div>
      <FormControl variant="outlined" margin="normal">
        <InputLabel id="channel-select-label">Channel</InputLabel>
        <Select
          labelId="channel-select-label"
          value={channel}
          onChange={handleChannelChange}
          label="Channel"
        >
          <MenuItem value="TT">TT</MenuItem>
          <MenuItem value="OP">OP</MenuItem>
        </Select>
      </FormControl>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Add New Material
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          name="name"
          label="Material Name"
          value={newMaterial.name}
          onChange={handleInputChange}
          margin="normal"
          sx={{ mr: 2 }}
        />
        <Button
          variant="contained"
          component="label"
          sx={{ mt: 2, mr: 2 }}
        >
          Upload Image
          <input
            accept="image/*"
            type="file"
            name="image"
            onChange={handleInputChange}
            hidden
          />
        </Button>
        <Button variant="contained" onClick={handleAddMaterial} sx={{ mt: 2 }}>
          Add Material
        </Button>
      </Box>

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Materials List ({channel})
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Material Name</TableCell>
              <TableCell>Image</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {materials.map((material) => (
              <TableRow key={material.id}>
                <TableCell>{material.name}</TableCell>
                <TableCell>
                  {material.imageUrl && (
                    <img
                      src={`http://localhost:5000/${material.imageUrl}`}
                      alt={material.name}
                      width={50}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditMaterial(material)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteMaterial(material.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Order Status
      </Typography>
      <Typography>Total ASMs: {orderStatus.totalASMs}</Typography>
      <Typography>Submitted Orders: {orderStatus.submittedOrders}</Typography>

      <Button
        variant="contained"
        onClick={handleDownloadOrder}
        disabled={!orderStatus.allSubmitted}
        sx={{ mt: 2 }}
      >
        Download Consolidated Order
      </Button>

      {/* Edit Material Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Material</DialogTitle>
        <DialogContent>
          <TextField
            name="name"
            label="Material Name"
            value={editMaterial?.name || ''}
            onChange={handleEditInputChange}
            margin="normal"
            fullWidth
          />
          <Button
            variant="contained"
            component="label"
            sx={{ mt: 2, mr: 2 }}
          >
            Upload New Image
            <input
              accept="image/*"
              type="file"
              name="image"
              onChange={handleEditInputChange}
              hidden
            />
          </Button>
          {editMaterial?.imageUrl && (
            <img
              src={`/${editMaterial.imageUrl}`}
              alt={editMaterial.name}
              width={100}
              style={{ marginTop: '16px' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateMaterial} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default MaterialOrderManagement;

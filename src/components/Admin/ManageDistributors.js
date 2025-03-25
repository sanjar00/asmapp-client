import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  OutlinedInput,
  FormControlLabel, Checkbox  // Add this import
} from '@mui/material';

function ManageDistributors() {
  const [distributors, setDistributors] = useState([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [sdId, setSdId] = useState('');
  const [regionId, setRegionId] = useState('');
  const [points_OP, setPointsOP] = useState('');
  const [points_TT, setPointsTT] = useState('');
  const [sds, setSDs] = useState([]);
  const [regions, setRegions] = useState([]);
  const [editingDistributorId, setEditingDistributorId] = useState(null);

  // New state for Excel file
  const [excelFile, setExcelFile] = useState(null);

  useEffect(() => {
    fetchDistributors();
    fetchSDs();
    fetchRegions();
  }, []);

  const fetchDistributors = async () => {
    try {
      const response = await api.get('/admin/distributors');
      setDistributors(response.data);
    } catch (error) {
      console.error('Error while getting distributors:', error);
    }
  };

  const fetchSDs = async () => {
    try {
      const response = await api.get('/admin/sds');
      setSDs(response.data);
    } catch (error) {
      console.error('Error while getting SDs:', error);
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await api.get('/regions');
      setRegions(response.data);
    } catch (error) {
      console.error('Error while getting regions:', error);
    }
  };

  const [isHistorical, setIsHistorical] = useState(false);  // Add this state

  // Add the missing handleFileChange function
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setExcelFile(file);
    }
  };

  // Find the handleUpdateQuantities function and update it
  const handleUpdateQuantities = async () => {
    if (!excelFile) {
      alert('Please select an Excel file first');
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append('file', excelFile);
  
      // Use the correct endpoint
      await api.post('/admin/distributors/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      alert('Quantities updated successfully');
      fetchDistributors(); // Refresh the list
      setExcelFile(null); // Reset the file input
    } catch (error) {
      console.error('Error updating quantities:', error);
      alert('Failed to update quantities. Please check the console for details.');
    }
  };

  // Add the missing editDistributor function
  const editDistributor = (id) => {
    const distributor = distributors.find(dist => dist.id === id);
    if (distributor) {
      setName(distributor.name);
      setCode(distributor.code);
      setSdId(distributor.sdId);
      setRegionId(distributor.regionId);
      setPointsOP(distributor.points_OP || '');
      setPointsTT(distributor.points_TT || '');
      setIsHistorical(distributor.isHistorical || false);
      setEditingDistributorId(distributor.id);
    }
  };

  // Add the missing deleteDistributor function
  const deleteDistributor = async (id) => {
    if (window.confirm('Are you sure you want to delete this distributor?')) {
      try {
        await api.delete(`/admin/distributors/${id}`);
        // Update local state by filtering out the deleted distributor
        setDistributors(distributors.filter(dist => dist.id !== id));
      } catch (error) {
        console.error('Error deleting distributor:', error);
        alert('Error deleting distributor');
      }
    }
  };

  // Also update the resetForm function to reset the excelFile state
  const resetForm = () => {
    setName('');
    setCode('');
    setSdId('');
    setRegionId('');
    setPointsOP('');
    setPointsTT('');
    setEditingDistributorId(null);
    setExcelFile(null); // Reset the file input
    setIsHistorical(false); // Reset historical checkbox
  };

  // Modify the addDistributor function
  const addDistributor = async () => {
    if (!name || !code || !sdId || !regionId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await api.post('/admin/distributors', {
        name,
        code,
        sdId,
        regionId,
        points_OP,
        points_TT,
        isHistorical  // Add this field
      });

      setDistributors([...distributors, response.data]);
      // Reset form
      setName('');
      setCode('');
      setSdId('');
      setRegionId('');
      setPointsOP('');
      setPointsTT('');
      setIsHistorical(false);  // Reset historical checkbox
    } catch (error) {
      console.error('Error adding distributor:', error);
      alert('Error adding distributor');
    }
  };

  // Modify the updateDistributor function
  const updateDistributor = async (id) => {
    try {
      await api.put(`/admin/distributors/${id}`, {
        name,
        code,
        sdId,
        regionId,
        points_OP,
        points_TT,
        isHistorical  // Add this field
      });

      // Update local state
      const updatedDistributors = distributors.map((dist) =>
        dist.id === id
          ? {
              ...dist,
              name,
              code,
              sdId,
              regionId,
              points_OP,
              points_TT,
              isHistorical
            }
          : dist
      );

      setDistributors(updatedDistributors);
      setEditingDistributorId(null);
      // Reset form
      setName('');
      setCode('');
      setSdId('');
      setRegionId('');
      setPointsOP('');
      setPointsTT('');
      setIsHistorical(false);
    } catch (error) {
      console.error('Error updating distributor:', error);
      alert('Error updating distributor');
    }
  };

  // Add this in your form JSX, before the submit button
  // Fix the JSX structure by wrapping everything in a single parent div
  return (
    <div>
      <Box component="form">
        <Typography variant="h5" gutterBottom>
          {editingDistributorId ? 'Edit Distributor' : 'Add Distributor'}
        </Typography>
        <TextField
          label="Name"
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Distributor Code"
          variant="outlined"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          fullWidth
          margin="normal"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>SD</InputLabel>
          <Select
            value={sdId}
            onChange={(e) => setSdId(e.target.value)}
            input={<OutlinedInput label="SD" />}
          >
            {sds.map((sd) => (
              <MenuItem key={sd.id} value={sd.id}>
                {sd.User?.username || `SD ${sd.id}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>Region</InputLabel>
          <Select
            value={regionId}
            onChange={(e) => setRegionId(e.target.value)}
            input={<OutlinedInput label="Region" />}
          >
            {regions.map((region) => (
              <MenuItem key={region.id} value={region.id}>
                {region.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="OP outlets number"
          type="number"
          value={points_OP}
          onChange={(e) => setPointsOP(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="TT outlets number"
          type="number"
          value={points_TT}
          onChange={(e) => setPointsTT(e.target.value)}
          fullWidth
          margin="normal"
        />
        {/* Historical checkbox - add this before the buttons */}
        <FormControlLabel
          control={
            <Checkbox
              checked={isHistorical}
              onChange={(e) => setIsHistorical(e.target.checked)}
            />
          }
          label="Historical Distributor"
          sx={{ mt: 2, display: 'block' }}
        />
        
        {editingDistributorId ? (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => updateDistributor(editingDistributorId)}
              sx={{ mr: 1 }}
            >
              Update
            </Button>
            <Button
              variant="outlined"
              onClick={resetForm}
            >
              Cancel
            </Button>
          </Box>
        ) : (
          <Button variant="contained" color="primary" onClick={addDistributor} sx={{ mt: 2 }}>
            Add
          </Button>
        )}

        {/* New section for uploading Excel and updating quantities */}
        <Box sx={{ mt: 4 }}>
          {/* Hidden file input for selecting the Excel file */}
          <input
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            id="upload-excel"
            onChange={handleFileChange}
          />
          <label htmlFor="upload-excel">
            <Button variant="outlined" component="span" sx={{ mr: 2 }}>
              Upload file
            </Button>
          </label>
          <Button
            variant="contained"
            color="primary"
            disabled={!excelFile}
            onClick={handleUpdateQuantities}
          >
            Update the quantities
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ mt: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Distributor Code</TableCell>
              <TableCell>SD</TableCell>
              <TableCell>Region</TableCell>
              <TableCell>OP outlets</TableCell>
              <TableCell>TT outlets</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {distributors.map((distributor) => (
              <TableRow key={distributor.id}>
                <TableCell>{distributor.name}</TableCell>
                <TableCell>{distributor.code}</TableCell>
                <TableCell>{sds.find((sd) => sd.id === distributor.sdId)?.User?.username || `SD ${distributor.sdId}`}</TableCell>
                <TableCell>{regions.find((r) => r.id === distributor.regionId)?.name}</TableCell>
                <TableCell>{distributor.points_OP}</TableCell>
                <TableCell>{distributor.points_TT}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => editDistributor(distributor.id)}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => deleteDistributor(distributor.id)}
                    size="small"
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default ManageDistributors;

// components/Admin/ManageMaterials.js

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  FormControl,
  InputLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Collapse,
  IconButton,
  Checkbox 
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

function ManageMaterials() {
  // All materials in DB
  const [allMaterials, setAllMaterials] = useState([]);
  // "Main" materials (parentId=null or undefined)
  const [mainMaterials, setMainMaterials] = useState([]);

  // Editing state (if we're editing an existing main item)
  const [editingMain, setEditingMain] = useState(null);

  // "Single" or "Extra"
  const [materialType, setMaterialType] = useState('single');

  // Fields for the main material
  const [mainName, setMainName] = useState('');
  const [mainCode, setMainCode] = useState('');
  const [mainChannel, setMainChannel] = useState('OP');
  const [mainQuantity, setMainQuantity] = useState(0);
  const [isHistorical, setIsHistorical] = useState(false);

  // Accessories array for type=extra
  const [accessories, setAccessories] = useState([
    { name: '', code: '', channel: 'OP', quantity: 0 },
  ]);

  // For expand/collapse in the table
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    fetchAllMaterials();
  }, []);

  // Fetch full material list from DB
  const fetchAllMaterials = async () => {
    try {
      const response = await api.get('/materials');
      const data = response.data;

      setAllMaterials(data);

      // Identify "main" materials => parentId is null/undefined
      const mainItems = data.filter(
        (m) => m.parentId === null || m.parentId === undefined
      );
      setMainMaterials(mainItems);
    } catch (error) {
      console.error('Error while getting materials:', error);
    }
  };

  // ---------------------------
  // DOWNLOAD DISTRIBUTION EXCEL
  // ---------------------------
  const handleDownloadDistribution = async () => {
    try {
      // We assume your new endpoint is GET /sd/distribution-excel
      const response = await api.get('/sd/distribution-excel', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'SD_Distribution.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading distribution excel:', error);
      alert('Failed to download distribution Excel');
    }
  };

  // Reset form
  const resetForm = () => {
    setEditingMain(null);
    setMaterialType('single');
    setMainName('');
    setMainCode('');
    setMainChannel('OP');
    setMainQuantity(0);
    setIsHistorical(false); // Reset historical checkbox
    setAccessories([{ name: '', code: '', channel: 'OP', quantity: 0 }]);
  };

  // Add a new accessory row in the "extra" form
  const handleAddAccessory = () => {
    setAccessories((prev) => [
      ...prev,
      { name: '', code: '', channel: 'OP', quantity: 0 },
    ]);
  };

  // Handle changes in an accessory row
  const handleAccessoryChange = (index, field, value) => {
    const newAcc = [...accessories];
    newAcc[index][field] = value;
    setAccessories(newAcc);
  };

  // Toggle single <-> extra
  const handleMaterialTypeChange = (e) => {
    const newType = e.target.value;
    setMaterialType(newType);

    // If single, clear out accessories
    if (newType === 'single') {
      setAccessories([{ name: '', code: '', channel: 'OP', quantity: 0 }]);
    }
  };

  // Create a brand-new item (single or extra)
  const handleCreate = async () => {
    // Basic checks
    if (!mainName || !mainCode || !mainChannel || mainQuantity < 0) {
      alert('Please fill out the main material fields properly.');
      return;
    }
    if (materialType === 'extra') {
      for (const acc of accessories) {
        if (!acc.name || !acc.code || !acc.channel || acc.quantity < 0) {
          alert('Fill out all accessory fields properly.');
          return;
        }
      }
    }

    // Post to /materials
    try {
      if (materialType === 'single') {
        await api.post('/materials', {
          type: 'single',
          name: mainName,
          code: mainCode,
          channel: mainChannel,
          quantity: parseInt(mainQuantity, 10),
          isHistorical: isHistorical, // Include isHistorical flag
        });
      } else {
        // extra
        await api.post('/materials', {
          type: 'extra',
          mainMaterial: {
            name: mainName,
            code: mainCode,
            channel: mainChannel,
            quantity: parseInt(mainQuantity, 10),
            isHistorical: isHistorical, // Include isHistorical flag
          },
          accessories: accessories.map(acc => ({
            name: acc.name,
            code: acc.code,
            channel: acc.channel,
            quantity: parseInt(acc.quantity, 10),
          })),
        });
      }
      await fetchAllMaterials();
      resetForm();
    } catch (error) {
      console.error('Error creating material:', error);
    }
  };

  // Editing an existing main => load it into the form
  const handleStartEdit = (mainItem) => {
    setEditingMain(mainItem);
    setMainName(mainItem.name);
    setMainCode(mainItem.code);
    setMainChannel(mainItem.channel);
    setMainQuantity(mainItem.quantity);
    setIsHistorical(mainItem.isHistorical || false); // Set historical value

    // find accessories that have parentId=mainItem.id
    const itemAccessories = allMaterials.filter(
      (m) => m.parentId === mainItem.id
    );
    if (itemAccessories.length === 0) {
      setMaterialType('single');
      setAccessories([{ name: '', code: '', channel: 'OP', quantity: 0 }]);
    } else {
      setMaterialType('extra');
      const arr = itemAccessories.map((acc) => ({
        name: acc.name,
        code: acc.code,
        channel: acc.channel,
        quantity: acc.quantity,
      }));
      setAccessories(arr);
    }
  };

  // Save updates to an existing main item
  const handleUpdate = async () => {
    if (!mainName || !mainCode || !mainChannel || mainQuantity < 0) {
      alert('Please fill out the main fields properly.');
      return;
    }
    if (materialType === 'extra') {
      for (const acc of accessories) {
        if (!acc.name || !acc.code || !acc.channel || acc.quantity < 0) {
          alert('Fill out accessory fields properly.');
          return;
        }
      }
    }

    try {
      if (materialType === 'single') {
        await api.put(`/materials/${editingMain.id}`, {
          type: 'single',
          name: mainName,
          code: mainCode,
          channel: mainChannel,
          quantity: mainQuantity,
          isHistorical: isHistorical
        });
      } else {
        // extra
        await api.put(`/materials/${editingMain.id}`, {
          type: 'extra',
          mainMaterial: {
            name: mainName,
            code: mainCode,
            channel: mainChannel,
            quantity: mainQuantity,
            isHistorical: isHistorical
          },
          accessories,
        });
      }
      await fetchAllMaterials();
      resetForm();
    } catch (error) {
      console.error('Error updating material:', error);
    }
  };

  // Delete a main item
  const deleteMaterial = async (id) => {
    if (window.confirm('Are you sure you want to delete material?')) {
      try {
        await api.delete(`/materials/${id}`);
        fetchAllMaterials();
      } catch (error) {
        console.error('Error deleting material:', error);
      }
    }
  };

  // Distribute a main item
  const distributeMaterial = async (id) => {
    if (window.confirm('Are you sure you want to distribute this material?')) {
      try {
        await api.post(`/materials/${id}/distribute`);
        fetchAllMaterials();
      } catch (error) {
        console.error('Error distributing material:', error);
      }
    }
  };

  // Toggle expand/collapse for a row
  const toggleExpand = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div style={{ margin: '0 auto' }}>
      <Typography variant="h4" sx={{ mt: 2, mb: 3 }}>
        Materials Management
      </Typography>

      {/* NEW: Download Distribution Excel Button */}
      <Box sx={{ mb: 3 }}>
        <Button variant="contained" color="success" onClick={handleDownloadDistribution}>
          Download Distribution Excel
        </Button>
      </Box>

      {/* FORM: Add or Edit */}
      <Box>
        <Typography variant="h5" gutterBottom>
          {editingMain ? 'Edit Material' : 'Add Material'}
        </Typography>

        {/* radio => single vs extra */}
        <FormControl sx={{ mt: 1, mb: 2 }}>
          <RadioGroup
            row
            value={materialType}
            onChange={handleMaterialTypeChange}
          >
            <FormControlLabel
              value="single"
              control={<Radio />}
              label="Single Material"
            />
            <FormControlLabel
              value="extra"
              control={<Radio />}
              label="Material w/ Accessories"
            />
          </RadioGroup>
        </FormControl>

        <TextField
          label="Name"
          variant="outlined"
          value={mainName}
          onChange={(e) => setMainName(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Code"
          variant="outlined"
          value={mainCode}
          onChange={(e) => setMainCode(e.target.value)}
          fullWidth
          margin="normal"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Channel</InputLabel>
          <Select
            value={mainChannel}
            onChange={(e) => setMainChannel(e.target.value)}
          >
            <MenuItem value="OP">OP</MenuItem>
            <MenuItem value="TT">TT</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Total amount"
          type="number"
          value={mainQuantity}
          onChange={(e) => setMainQuantity(parseInt(e.target.value) || 0)}
          fullWidth
          margin="normal"
        />

        {/* Historical checkbox */}
        // In the form for creating/editing materials
        <FormControlLabel
          control={
            <Checkbox
              checked={isHistorical}
              onChange={(e) => setIsHistorical(e.target.checked)}
              name="isHistorical"
            />
          }
          label="Historical Material"
        />

        {/* Accessories section (only if type=extra) */}
        {materialType === 'extra' && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Accessories
            </Typography>
            {accessories.map((acc, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  label="Name"
                  variant="outlined"
                  value={acc.name}
                  onChange={(e) =>
                    handleAccessoryChange(index, 'name', e.target.value)
                  }
                  sx={{ flex: 2 }}
                />
                <TextField
                  label="Code"
                  variant="outlined"
                  value={acc.code}
                  onChange={(e) =>
                    handleAccessoryChange(index, 'code', e.target.value)
                  }
                  sx={{ flex: 1 }}
                />
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Channel</InputLabel>
                  <Select
                    value={acc.channel}
                    onChange={(e) =>
                      handleAccessoryChange(index, 'channel', e.target.value)
                    }
                  >
                    <MenuItem value="OP">OP</MenuItem>
                    <MenuItem value="TT">TT</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Quantity"
                  type="number"
                  value={acc.quantity}
                  onChange={(e) =>
                    handleAccessoryChange(
                      index,
                      'quantity',
                      parseInt(e.target.value) || 0
                    )
                  }
                  sx={{ flex: 1 }}
                />
              </Box>
            ))}
            <Button
              variant="outlined"
              onClick={handleAddAccessory}
              sx={{ mt: 1 }}
            >
              Add Accessory
            </Button>
          </Box>
        )}

        {/* Submit buttons */}
        <Box sx={{ mt: 3 }}>
          {editingMain ? (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpdate}
                sx={{ mr: 1 }}
              >
                Update
              </Button>
              <Button variant="outlined" onClick={resetForm}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="contained" color="primary" onClick={handleCreate}>
              Create
            </Button>
          )}
        </Box>
      </Box>

      {/* TABLE: List of materials */}
      <TableContainer component={Paper} sx={{ mt: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Channel</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Historical</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mainMaterials.map((material) => {
              const hasAccessories = allMaterials.some(
                (m) => m.parentId === material.id
              );
              const isExpanded = expandedRows[material.id] || false;

              return (
                <React.Fragment key={material.id}>
                  <TableRow>
                    <TableCell>
                      {hasAccessories && (
                        <IconButton
                          size="small"
                          onClick={() => toggleExpand(material.id)}
                        >
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      )}
                    </TableCell>
                    <TableCell>{material.name}</TableCell>
                    <TableCell>{material.code}</TableCell>
                    <TableCell>{material.channel}</TableCell>
                    <TableCell>{material.quantity}</TableCell>
                    <TableCell>{material.isHistorical ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => handleStartEdit(material)}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => deleteMaterial(material.id)}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        Delete
                      </Button>
                      <Button
                        variant="outlined"
                        color="success"
                        onClick={() => distributeMaterial(material.id)}
                        size="small"
                      >
                        Distribute
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Accessories (if expanded) */}
                  {hasAccessories && (
                    <TableRow>
                      <TableCell colSpan={7} style={{ padding: 0 }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ m: 2 }}>
                            <Typography variant="h6" gutterBottom>
                              Accessories
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Name</TableCell>
                                  <TableCell>Code</TableCell>
                                  <TableCell>Channel</TableCell>
                                  <TableCell>Quantity</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {allMaterials
                                  .filter((m) => m.parentId === material.id)
                                  .map((acc) => (
                                    <TableRow key={acc.id}>
                                      <TableCell>{acc.name}</TableCell>
                                      <TableCell>{acc.code}</TableCell>
                                      <TableCell>{acc.channel}</TableCell>
                                      <TableCell>{acc.quantity}</TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default ManageMaterials;

const handleEditMaterial = (material) => {
  setEditingMain(material);
  setMainName(material.name);
  setMainCode(material.code);
  setMainChannel(material.channel);
  setMainQuantity(material.quantity);
  setIsHistorical(material.isHistorical || false); // Set the historical status
  setMaterialType('single'); // Assume single for editing
  
  // Scroll to form
  formRef.current.scrollIntoView({ behavior: 'smooth' });
};

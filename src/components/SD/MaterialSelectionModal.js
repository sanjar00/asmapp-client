// components/SD/MaterialSelectionModal.js

import React, { useEffect, useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Button,
  TextField,
  IconButton,
  Divider,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { Edit, Save, Close } from '@mui/icons-material';
import api from '../../services/api';

const MaterialSelectionModal = ({
  open,
  onClose,
  materials = [],
  onSubmit,
  distributorId,
  totalAllowedQuantities = {},
  distributorsMaterialsSum = {},
  refreshDistributors,
}) => {
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [errorText, setErrorText] = useState('');
  const [distributor, setDistributor] = useState(null);
  const [localTotalAllowedQuantities, setLocalTotalAllowedQuantities] = useState(totalAllowedQuantities);
  const [localDistributorsMaterialsSum, setLocalDistributorsMaterialsSum] = useState(distributorsMaterialsSum);

  // 0 = All, 1 = TT, 2 = OP
  const [selectedChannel, setSelectedChannel] = useState(0);

  useEffect(() => {
    setSelectedMaterials([]);
    setSelectedChannel(0);
    
    // Get distributor details to check if it's historical
    if (distributorId) {
      fetchDistributorDetails();
    }
  }, [materials, distributorId]); // Remove fetchDistributorDetails from the dependency array

  // Update local state when props change
  useEffect(() => {
    setLocalTotalAllowedQuantities(totalAllowedQuantities);
    setLocalDistributorsMaterialsSum(distributorsMaterialsSum);
  }, [totalAllowedQuantities, distributorsMaterialsSum]);

  // Fetch distributor details to get isHistorical status
  const fetchDistributorDetails = async () => {
    try {
      const response = await api.get(`/sd/distributor/${distributorId}`);
      setDistributor(response.data);
    } catch (error) {
      console.error('Error fetching distributor details:', error);
    }
  };

  const handleToggle = (materialId) => {
    setSelectedMaterials((prev) =>
      prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId]
    );
  };

  const handleSelectAll = () => {
    const selectable = filteredMaterials
      .filter(
        (mat) =>
          !mat.RequestMaterials ||
          !mat.RequestMaterials.some(
            (rm) =>
              rm.locked && rm.Request && rm.Request.distributorId === distributorId
          )
      )
      .map((mat) => mat.id);
    setSelectedMaterials(selectable);
  };

  const handleDeselectAll = () => {
    setSelectedMaterials([]);
  };

  const handleStartEditing = (material) => {
    setEditingMaterialId(material.id);
    setNewQuantity(
      material.MaterialDistribution?.distributedQuantity?.toString() || ''
    );
    setErrorText('');
  };

  const handleCancelEditing = () => {
    setEditingMaterialId(null);
    setNewQuantity('');
    setErrorText('');
  };

  const handleSaveQuantity = async (material) => {
    const intValue = parseInt(newQuantity, 10);
    if (!intValue || intValue < 1) {
      setErrorText('Quantity must be a positive number');
      return;
    }
  
    // Get current distributor quantity
    const currentDistributorQty = material.MaterialDistribution?.distributedQuantity || 0;
    
    // Check if this material is locked for this distributor
    const isLockedForThisDistributor = material.RequestMaterials && 
      material.RequestMaterials.some(rm => 
        rm.locked && rm.Request && rm.Request.distributorId === distributorId
      );
    
    // If locked for this distributor, don't allow changes
    if (isLockedForThisDistributor) {
      setErrorText('This material is locked and cannot be modified');
      return;
    }
    
    // Calculate available quantity using the new structure
    const materialTotal = localTotalAllowedQuantities[material.id]?.total || 0;
    const lockedTotal = localTotalAllowedQuantities[material.id]?.locked_total || 0;
    const availableForEditing = materialTotal - lockedTotal;
    
    // Calculate how much is currently used by other distributors (excluding this one)
    const totalUsedByAll = localDistributorsMaterialsSum[material.id] || 0;
    const usedByOthers = totalUsedByAll - currentDistributorQty;
    
    // Maximum this distributor can set
    const maxUserCanSet = availableForEditing - usedByOthers;
    
    if (intValue > maxUserCanSet + currentDistributorQty) {
      setErrorText(`Cannot exceed available limit of ${maxUserCanSet + currentDistributorQty}`);
      return;
    }

    try {
      setErrorText('');
      await api.patch('/sd/distribute', {
        distributorId,
        materialId: material.id,
        newQuantity: intValue
      });
      
      // Update the materials array directly to reflect changes immediately
      const updatedMaterials = materials.map(m => {
        if (m.id === material.id) {
          return {
            ...m,
            MaterialDistribution: {
              ...m.MaterialDistribution,
              distributedQuantity: intValue
            }
          };
        }
        return m;
      });
      
      // Update the materials in the parent component
      if (typeof refreshDistributors === 'function') {
        refreshDistributors();
      }
      
      // Update the local state with the modified materials
      // This is the key fix - we need to update the materials array in the modal
      setEditingMaterialId(null);
      
      // Also fetch updated material info to refresh the available quantities
      try {
        const materialsInfoResponse = await api.get('/sd/materials-info');
        if (materialsInfoResponse.data) {
          // Update the quantities information
          setLocalTotalAllowedQuantities(materialsInfoResponse.data.totalAllowedQuantities);
          setLocalDistributorsMaterialsSum(materialsInfoResponse.data.distributorsMaterialsSum);
        }
      } catch (infoError) {
        console.error('Error refreshing materials info:', infoError);
      }
    } catch (error) {
      console.error('Error saving quantity:', error);
      // Display the specific error message from the backend
      const errorMessage = error.response?.data?.message || 
        'Failed to update quantity. Please try again.';
      setErrorText(errorMessage);
    }
  };

  const handleSubmit = () => {
    // gather selected
    const selected = materials.filter((mat) => selectedMaterials.includes(mat.id));
    onSubmit(selected);
    onClose();
  };

  const handleChannelChange = (evt, newVal) => {
    setSelectedChannel(newVal);
  };

  // Add search functionality
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add sorting functionality
  const [sortOrder, setSortOrder] = useState('name-asc');

  // Filter materials based on all criteria (channel, search, historical status)
  const filteredMaterials = materials.filter((mat) => {
    // Skip accessories
    if (mat.parentId !== null && mat.parentId !== undefined) {
      return false;
    }
    
    // Check historical status match
    if (distributor && distributor.isHistorical !== undefined) {
      // If distributor is historical, only show historical materials
      if (distributor.isHistorical && !mat.isHistorical) {
        return false;
      }
      
      // If distributor is not historical, don't show historical materials
      if (!distributor.isHistorical && mat.isHistorical) {
        return false;
      }
    }
    
    // Apply search filter
    if (searchTerm && !mat.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !mat.code.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Apply channel filter
    if (selectedChannel === 1) return mat.channel === 'TT';
    if (selectedChannel === 2) return mat.channel === 'OP';
    return true; // 0 => All
  });
  
  // Sort the filtered materials
  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    if (sortOrder === 'name-asc') return a.name.localeCompare(b.name);
    if (sortOrder === 'name-desc') return b.name.localeCompare(a.name);
    if (sortOrder === 'code-asc') return a.code.localeCompare(b.code);
    if (sortOrder === 'code-desc') return b.code.localeCompare(a.code);
    return 0;
  });

  // Check if the distributor is historical
  const isHistorical = distributor?.isHistorical || false;

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          maxWidth: 800,
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h6" component="h2" gutterBottom>
          Select Materials for {distributor?.name}
        </Typography>

        {/* Channel filter tabs */}
        <Tabs
          value={selectedChannel}
          onChange={(e, newValue) => setSelectedChannel(newValue)}
          sx={{ mb: 2 }}
        >
          <Tab label="All" />
          <Tab label="TT" />
          <Tab label="OP" />
        </Tabs>

        {/* Select/Deselect All buttons at the top */}
        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={handleSelectAll}>
            Select All
          </Button>
          <Button variant="outlined" onClick={handleDeselectAll}>
            Deselect All
          </Button>
        </Box>

        {/* Materials list */}
        <List sx={{ mb: 2, flexGrow: 1, overflow: 'auto' }}>
          {filteredMaterials.map((material) => {
            const isLocked =
              material.RequestMaterials &&
              material.RequestMaterials.some(
                (rm) =>
                  rm.locked && rm.Request && rm.Request.distributorId === distributorId
              );
  
            // FIX: Access the 'total' property from the object
            const maxAllowed = totalAllowedQuantities[material.id]?.total || 0;
            const totalLockedAll = distributorsMaterialsSum[material.id] || 0;
            const distQty = material.MaterialDistribution?.distributedQuantity || 0;
  
            const lockedByOthers = Math.max(0, totalLockedAll - distQty);
            const leftForThisDist = Math.max(0, maxAllowed - lockedByOthers);
  
            const isEditing = editingMaterialId === material.id;
  
            return (
              <React.Fragment key={material.id}>
                <ListItem
                  disableGutters
                  disabled={isLocked}
                  sx={{
                    backgroundColor: isLocked ? 'rgba(0,0,0,0.1)' : 'inherit',
                    flexDirection: 'column',
                    alignItems: 'start',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedMaterials.includes(material.id)}
                        disabled={isLocked}
                        onChange={() => handleToggle(material.id)}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${material.name} (Code: ${material.code})${material.isHistorical ? ' - Historical' : ''}`}
                      secondary={`Channel: ${material.channel} | Currently distributed: ${distQty}`}
                    />
                    {!isLocked && !isEditing && (
                      <IconButton onClick={() => handleStartEditing(material)}>
                        <Edit />
                      </IconButton>
                    )}
                  </Box>
  
                  {isEditing && (
                    <Box sx={{ pl: 7, display: 'flex', flexDirection: 'column', mt: 1 }}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        Total allowed: {maxAllowed} | Left for you: {leftForThisDist}
                      </Typography>
  
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                          label="New Quantity"
                          variant="outlined"
                          size="small"
                          value={newQuantity}
                          onChange={(e) =>
                            setNewQuantity(e.target.value.replace(/^0+/, ''))
                          }
                          sx={{ mr: 1, width: '120px' }}
                        />
                        <IconButton onClick={() => handleSaveQuantity(material)} color="primary">
                          <Save />
                        </IconButton>
                        <IconButton onClick={handleCancelEditing} color="secondary">
                          <Close />
                        </IconButton>
                      </Box>
                      
                      {errorText && (
                        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                          {errorText}
                        </Alert>
                      )}
                    </Box>
                  )}
                </ListItem>
                <Divider />
              </React.Fragment>
            );
          })}
        </List>

        {/* Submit button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={selectedMaterials.length === 0}
          >
            Submit
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default MaterialSelectionModal;

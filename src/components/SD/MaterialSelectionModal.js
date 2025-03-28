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

  // 0 = All, 1 = TT, 2 = OP
  const [selectedChannel, setSelectedChannel] = useState(0);

  useEffect(() => {
    setSelectedMaterials([]);
    setSelectedChannel(0);
  }, [materials]);

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
    const materialTotal = totalAllowedQuantities[material.id]?.total || 0;
    const lockedTotal = totalAllowedQuantities[material.id]?.locked_total || 0;
    const availableForEditing = materialTotal - lockedTotal;
    
    // Calculate how much is currently used by other distributors (excluding this one)
    const totalUsedByAll = distributorsMaterialsSum[material.id] || 0;
    const usedByOthers = totalUsedByAll - currentDistributorQty;
    
    // Maximum this distributor can set
    const maxUserCanSet = availableForEditing - usedByOthers;
    
    if (intValue > maxUserCanSet + currentDistributorQty) {
      setErrorText(`Cannot exceed available limit of ${maxUserCanSet + currentDistributorQty}`);
      return;
    }

    try {
      await api.patch('/sd/distribute', {
        distributorId,
        materialId: material.id,
        newQuantity: intValue,
      });

      // local UI update
      material.MaterialDistribution.distributedQuantity = intValue;
      refreshDistributors();

      setEditingMaterialId(null);
      setNewQuantity('');
      setErrorText('');
    } catch (error) {
      console.error('Error saving quantity:', error.response?.data || error);
      setErrorText(error.response?.data?.message || 'Error saving quantity.');
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
    setSelectedMaterials([]);
  };

  // *** Filter out accessories => only main items have parentId == null
  const filteredMaterials = materials.filter((mat) => {
    if (mat.parentId !== null && mat.parentId !== undefined) {
      return false; // skip accessories
    }
    // then apply channel filter
    if (selectedChannel === 1) return mat.channel === 'TT';
    if (selectedChannel === 2) return mat.channel === 'OP';
    return true; // 0 => All
  });

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
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <Typography variant="h6" component="h2" gutterBottom>
          Select Materials for {materials[0]?.Distributors?.name || 'Distributor'}
        </Typography>

        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <Close />
        </IconButton>

        <Typography variant="h6" gutterBottom>
          Select Materials
        </Typography>

        {/* Channel Tabs */}
        <Tabs
          value={selectedChannel}
          onChange={handleChannelChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ mb: 2 }}
        >
          <Tab label="All" />
          <Tab label="TT" />
          <Tab label="OP" />
        </Tabs>

        {filteredMaterials.length === 0 ? (
          <Typography variant="body1" color="textSecondary">
            No main materials available for this channel.
          </Typography>
        ) : (
          <List>
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
                        primary={`${material.name} (Code: ${material.code})`}
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
                          <Alert severity="error" sx={{ mt: 1 }}>
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
        )}

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSelectAll}
            disabled={
              filteredMaterials.length === 0 ||
              filteredMaterials.every(
                (mat) =>
                  mat.RequestMaterials &&
                  mat.RequestMaterials.some(
                    (rm) => rm.locked && rm.Request && rm.Request.distributorId === distributorId
                  )
              )
            }
          >
            Select All
          </Button>
          <Button
            variant="outlined"
            onClick={handleDeselectAll}
            disabled={selectedMaterials.length === 0}
          >
            Deselect All
          </Button>
        </Box>

        <Box sx={{ mt: 2, textAlign: 'right' }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSubmit}
            sx={{ mr: 1 }}
            disabled={selectedMaterials.length === 0}
          >
            Download Request
          </Button>
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default MaterialSelectionModal;

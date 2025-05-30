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
  const [localMaterials, setLocalMaterials] = useState(materials);
  const [selectedChannel, setSelectedChannel] = useState(0);

  // New state to store the fixed total allowed quantities for the current modal session
  const [sessionFixedTotalAllowedQuantities, setSessionFixedTotalAllowedQuantities] = useState(null);

  // Helper function to calculate available quantities for a material
  const getAvailableQuantity = (material) => {
    // Determine which total allowed quantities to use: session fixed or live local state
    const capsToUse = sessionFixedTotalAllowedQuantities || localTotalAllowedQuantities;
    
    // Get the total allowed quantity for this material using the determined caps
    const materialTotal = capsToUse[material.id]?.total || 0;
    
    // Get the locked quantity (already requested by distributors)
    // Assuming locked_total comes from localTotalAllowedQuantities which is kept live
    const lockedTotal = localTotalAllowedQuantities[material.id]?.locked_total || 0;
    
    // Get current distributor quantity
    const currentDistributorQty = material.MaterialDistribution?.distributedQuantity || 0;
    
    // Calculate how much is currently used by other distributors (excluding this one)
    const totalUsedByAll = localDistributorsMaterialsSum[material.id] || 0;
    const usedByOthers = totalUsedByAll - currentDistributorQty;
    
    // Maximum this distributor can set, based on the materialTotal (which is now session-fixed if available)
    const maxUserCanSet = materialTotal - lockedTotal - usedByOthers;
    
    return {
      total: materialTotal, // This will reflect the fixed cap for the session if available
      available: maxUserCanSet < 0 ? 0 : maxUserCanSet, // Ensure available is not negative
      current: currentDistributorQty
    };
  };

  useEffect(() => {
    // Effect to manage modal state based on 'open' status and initial data
    if (open) {
      setSelectedMaterials([]);
      setSelectedChannel(0);
      setLocalMaterials(materials); // Update local copy of materials

      // Capture the initial totalAllowedQuantities when modal opens for the first time in a session,
      // and if they haven't been captured yet for this session.
      if (!sessionFixedTotalAllowedQuantities && Object.keys(totalAllowedQuantities).length > 0) {
        setSessionFixedTotalAllowedQuantities(JSON.parse(JSON.stringify(totalAllowedQuantities)));
      }
      
      if (distributorId) {
        fetchDistributorDetails();
      }
    } else {
      // Reset states when modal closes
      setSessionFixedTotalAllowedQuantities(null); // Reset the session-fixed caps
      setEditingMaterialId(null);
      setNewQuantity('');
      setErrorText('');
      // Consider resetting distributor state if necessary: setDistributor(null);
    }
  }, [open, materials, distributorId, totalAllowedQuantities]); // Added totalAllowedQuantities

  // Effect to keep localTotalAllowedQuantities and localDistributorsMaterialsSum in sync with props
  // These are used for live display aspects if not overridden by sessionFixedTotalAllowedQuantities
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

  // Update this to use localMaterials instead of materials
  const filteredMaterials = localMaterials.filter((material) => {
    if (selectedChannel === 0) return true;
    if (selectedChannel === 1 && material.channel === 'TT') return true;
    if (selectedChannel === 2 && material.channel === 'OP') return true;
    return false;
  });

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
    if (isNaN(intValue) || intValue < 0) { // Allow 0 for quantity to remove distribution
      setErrorText('Quantity must be a non-negative number.');
      return;
    }
    if (newQuantity.trim() === '') { // Handle empty input specifically if needed
        setErrorText('Quantity cannot be empty.');
        return;
    }
  
    const currentDistributorQty = material.MaterialDistribution?.distributedQuantity || 0;
    
    if (isLockedForThisDistributor(material)) {
      setErrorText('This material is locked and cannot be modified');
      return;
    }
    
    // getAvailableQuantity now uses sessionFixedTotalAllowedQuantities if available
    const { available, total: effectiveTotalCap } = getAvailableQuantity(material);
    
    const totalUsedByAll = localDistributorsMaterialsSum[material.id] || 0;
    const otherDistributorsUsage = totalUsedByAll - currentDistributorQty;
    const newTotalUsage = otherDistributorsUsage + intValue;
    
    // Check if the new total usage would exceed the effective total cap for the session
    if (newTotalUsage > effectiveTotalCap) {
      setErrorText(`Cannot exceed total allowed quantity of ${effectiveTotalCap}`);
      return;
    }
    
    // This check uses 'available' which is also calculated based on effectiveTotalCap
    // This check is particularly for when intValue itself is more than what's available for this user to set.
    if (intValue > currentDistributorQty + available) {
      setErrorText(`Cannot exceed available quantity of ${currentDistributorQty + available}`);
      return;
    }
    
    // Always enforce the total cap as a hard limit, regardless of what the user previously had
    if (intValue > effectiveTotalCap) {
      setErrorText(`Cannot exceed the maximum allowed quantity of ${effectiveTotalCap}`);
      return;
    }
    
    try {
      setErrorText('');
      await api.patch('/sd/distribute', {
        distributorId,
        materialId: material.id,
        newQuantity: intValue
      });
      
      // Update the local materials array to reflect changes immediately
      setLocalMaterials(prevMaterials => 
        prevMaterials.map(m => {
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
        })
      );
      
      // Reset editing state
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
      
      // Optionally refresh the parent component's data
      if (typeof refreshDistributors === 'function') {
        refreshDistributors();
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
    // Get the full material objects for selected IDs
    const materialsToSubmit = localMaterials.filter(mat => 
      selectedMaterials.includes(mat.id)
    );
    
    // Call the onSubmit function passed from parent component
    onSubmit(materialsToSubmit);
    onClose();
  };

  const handleSubmitRequest = async () => {
    if (selectedMaterials.length === 0) {
      setErrorText('Please select at least one material');
      return;
    }

    try {
      setErrorText('');
      
      // Get the selected material objects
      const selectedMaterialObjects = localMaterials.filter(material => 
        selectedMaterials.includes(material.id)
      );
      
      // Call the onSubmit function passed from parent component
      await onSubmit(selectedMaterialObjects);
      
      // Add download functionality
      const materialIds = selectedMaterials;
      const response = await api.get(`/sd/distributors/${distributorId}/download-request`, {
        params: { materialIds: materialIds.join(',') },
        responseType: 'blob'
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Request_${distributorId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Close the modal after successful submission and download
      onClose();
      
      // Refresh the distributors list if refreshDistributors function is provided
      if (refreshDistributors) {
        refreshDistributors();
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      setErrorText('Failed to submit request. Please try again.');
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedChannel(newValue);
  };

  // Calculate the number of materials that can be selected
  const selectableMaterialsCount = filteredMaterials.filter(
    (mat) =>
      !mat.RequestMaterials ||
      !mat.RequestMaterials.some(
        (rm) =>
          rm.locked && rm.Request && rm.Request.distributorId === distributorId
      )
  ).length;

  // Calculate the number of materials that are already locked
  const lockedMaterialsCount = filteredMaterials.filter((mat) =>
    mat.RequestMaterials &&
    mat.RequestMaterials.some(
      (rm) =>
        rm.locked && rm.Request && rm.Request.distributorId === distributorId
    )
  ).length;

  // Check if the distributor is historical
  const isHistorical = distributor?.isHistorical || false;

  // Add this new function to download the request
  const handleDownloadRequest = async (requestId) => {
    try {
      const response = await api.get(`/sd/requests/${requestId}/download`, {
        responseType: 'blob',
      });
  
      // Create a link to download the file
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Request_${requestId}.xlsx`;
      link.click();
    } catch (error) {
      console.error('Error downloading request:', error);
      setErrorText('Failed to download request. Please try again.');
    }
  };

  // Add this new function to check if material is locked for any distributor
  const isMaterialLockedForAnyDistributor = (material) => {
    return material.RequestMaterials && 
      material.RequestMaterials.some(rm => rm.locked);
  };

  // Move this function outside of handleSaveQuantity to make it accessible throughout the component
  // Helper function to check if a material is locked for this distributor
  // Helper to check if a material is locked for this distributor
const isLockedForThisDistributor = (material) => {
  // Check if there is a locked RequestMaterial for this material and this distributor
  return (
    material.RequestMaterials &&
    material.RequestMaterials.some(
      (rm) =>
        rm.locked &&
        rm.Request &&
        rm.Request.distributorId === distributorId // Only lock for this distributor
    )
  );
};

  // New helper function to check if a material is downloaded in any distributor
  const isDownloadedInAnyDistributor = (material) => {
    return material.RequestMaterials && 
      material.RequestMaterials.some(rm => 
        rm.locked && rm.Request && rm.Request.distributorId !== distributorId
      );
  };

  // Update the isEditDisabled function to check if material is locked for any distributor of this SD
  const isEditDisabled = (material) => {
    // Check if this material is locked for any distributor belonging to this SD
    const isLockedForAnyDistributorOfThisSD = 
      material.RequestMaterials && 
      material.RequestMaterials.some(rm => 
        rm.locked && rm.Request && rm.Request.Distributor && 
        rm.Request.Distributor.sdId === distributor?.sdId
      );
    
    return isLockedForAnyDistributorOfThisSD;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="material-selection-modal-title"
    >
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
          borderRadius: 1,
          overflow: 'auto',
        }}
      >
        <Typography
          id="material-selection-modal-title"
          variant="h6"
          component="h2"
          gutterBottom
        >
          Select Materials
        </Typography>

        {isHistorical && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This is a historical distributor. You can view but not modify its materials.
          </Alert>
        )}

        <Tabs
          value={selectedChannel}
          onChange={handleTabChange}
          sx={{ mb: 2 }}
        >
          <Tab label="All" />
          <Tab label="TT" />
          <Tab label="OP" />
        </Tabs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Button
              variant="outlined"
              onClick={handleSelectAll}
              sx={{ mr: 1 }}
              disabled={selectableMaterialsCount === 0 || isHistorical}
            >
              Select All
            </Button>
            <Button
              variant="outlined"
              onClick={handleDeselectAll}
              disabled={selectedMaterials.length === 0 || isHistorical}
            >
              Deselect All
            </Button>
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitRequest}
            disabled={selectedMaterials.length === 0 || isHistorical}
          >
            Submit Request
          </Button>
        </Box>

        {errorText && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorText}
          </Alert>
        )}

        <List>
          {filteredMaterials.map((material) => {
            const isLocked =
              material.RequestMaterials &&
              material.RequestMaterials.some(
                (rm) =>
                  rm.locked &&
                  rm.Request &&
                  rm.Request.distributorId === distributorId
              );

            const isLockedForAny = isMaterialLockedForAnyDistributor(material);
            const isEditing = editingMaterialId === material.id;
            
            // Get material quantities
            const { total: materialTotal } = getAvailableQuantity(material);

            return (
              <React.Fragment key={material.id}>
                <ListItem
                  secondaryAction={
                    isLocked || isHistorical || isLockedForAny ? null : isEditing ? (
                      <>
                        <TextField
                          value={newQuantity}
                          onChange={(e) => setNewQuantity(e.target.value)}
                          type="number"
                          size="small"
                          sx={{ width: 80, mr: 1 }}
                          inputProps={{ min: 1 }}
                          autoFocus
                        />
                        <Typography variant="body2" sx={{ display: 'inline', mr: 1 }}>
                          Total allowed: {materialTotal}
                        </Typography>
                        <IconButton
                          edge="end"
                          onClick={() => handleSaveQuantity(material)}
                          color="primary"
                        >
                          <Save />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={handleCancelEditing}
                          color="error"
                        >
                          <Close />
                        </IconButton>
                      </>
                    ) : (
                      !isLocked && (
                        <IconButton 
                          onClick={() => handleStartEditing(material)}
                          disabled={isEditDisabled(material)}
                          color="primary"
                          size="small"
                        >
                          <Edit />
                        </IconButton>
                      )
                    )
                  }
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selectedMaterials.includes(material.id)}
                      onChange={() => handleToggle(material.id)}
                      disabled={isLocked || isHistorical || isLockedForThisDistributor(material)}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${material.name} (${material.code})`}
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          Channel: {material.channel}
                        </Typography>
                        <br />
                        <Typography
                          component="span"
                          variant="body2"
                          color={isLocked || isLockedForAny ? 'success.main' : 'text.primary'}
                        >
                          {isLocked || isLockedForAny
                            ? 'Status: Locked (Already requested)'
                            : `Distributed Quantity: ${
                                material.MaterialDistribution?.distributedQuantity || 0
                              }`}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            );
          })}
        </List>

        {filteredMaterials.length === 0 && (
          <Typography variant="body1" sx={{ textAlign: 'center', my: 2 }}>
            No materials available for this channel.
          </Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button onClick={onClose} sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitRequest} // Changed from handleSubmit to handleSubmitRequest
            disabled={selectedMaterials.length === 0 || isHistorical}
          >
            Submit Request 
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default MaterialSelectionModal;
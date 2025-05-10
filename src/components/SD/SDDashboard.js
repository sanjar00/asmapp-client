// components/SD/SDDashboard.js

import React, { useEffect, useState } from 'react';
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
  Box,
  Alert,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Collapse,
  IconButton
} from '@mui/material';
import { FilterList } from '@mui/icons-material';
import api from '../../services/api';
import MaterialSelectionModal from './MaterialSelectionModal';

function SDDashboard() {
  const [distributors, setDistributors] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const [totalAllowedQuantities, setTotalAllowedQuantities] = useState({});
  const [distributorsMaterialsSum, setDistributorsMaterialsSum] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'completed', 'partial', 'none'
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchDistributors();
  }, []);

  const handleDownloadRequest = async (selectedMaterials) => {
    if (!selectedDistributor) return;

    try {
        // First lock the quantities
        await api.post('/sd/lock', {
            distributorId: selectedDistributor.id,
            materials: selectedMaterials.map(mat => ({
                materialId: mat.id,
                quantity: mat.MaterialDistribution.distributedQuantity
            }))
        });

        const requestData = {
            distributorName: selectedDistributor.name,
            distributorCode: selectedDistributor.code || 'Unknown',
            asmCode: selectedDistributor.asmCode || 'Unknown',
            materials: selectedMaterials.map((mat) => ({
                name: mat.name,
                code: mat.code,
                quantity: mat.MaterialDistribution.distributedQuantity,
            })),
        };

        const response = await api.post('/requests/generate-request', requestData, {
            responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Request_${selectedDistributor.name}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Refresh data after locking
        await fetchMaterialsInfo(selectedDistributor.sdId);
        fetchDistributors();
        handleCloseModal();
    } catch (error) {
        console.error('Error generating document:', error);
    }
  };

  const fetchDistributors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/sd/distributors');
      // Sort distributors by ID or name to maintain consistent order
      const sortedDistributors = response.data.sort((a, b) => {
        // Sort by ID (numeric) or by name (alphabetical) if you prefer
        return a.id - b.id; // For numeric ID sorting
        // Or use: return a.name.localeCompare(b.name); // For alphabetical name sorting
      });
      setDistributors(sortedDistributors);
    } catch (error) {
      console.error('Error while getting distributors:', error);
      setError('Failed to load distributors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterialsInfo = async (sdId) => {
    try {
      const response = await api.get(`/sd/materials-info?sdId=${sdId}`);
      setTotalAllowedQuantities(response.data.totalAllowedQuantities);
      setDistributorsMaterialsSum(response.data.distributorsMaterialsSum);
    } catch (error) {
      console.error('Error fetching materials info:', error);
    }
  };

  const handleOpenModal = async (distributor) => {
    await fetchMaterialsInfo(distributor.sdId);
    setSelectedDistributor(distributor);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedDistributor(null);
  };

  const handleFilterChange = (event, newFilterStatus) => {
    if (newFilterStatus !== null) {
      setFilterStatus(newFilterStatus);
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Add the filteredDistributors computed property
  const filteredDistributors = distributors.filter(distributor => {
    const materials = distributor.Materials || [];
    const totalMaterials = materials.length;
    
    const lockedMaterialsCount = materials.filter(mat => 
      mat.RequestMaterials && 
      mat.RequestMaterials.some(rm => 
        rm.locked && 
        rm.Request && 
        rm.Request.distributorId === distributor.id
      )
    ).length;
    
    const allLocked = totalMaterials > 0 && lockedMaterialsCount === totalMaterials;
    const partiallyLocked = lockedMaterialsCount > 0 && !allLocked;
    const noMaterials = totalMaterials === 0;
    
    if (filterStatus === 'all') return true;
    if (filterStatus === 'completed' && allLocked) return true;
    if (filterStatus === 'partial' && partiallyLocked) return true;
    if (filterStatus === 'none' && !partiallyLocked && !allLocked && !noMaterials) return true;
    
    return false;
  });

  return (
    <div>
      <Typography variant="h4" sx={{ mt: 4, fontWeight: 'bold' }} gutterBottom>
        SD Dashboard
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 2 }}>
        <Button 
          variant="outlined" 
          startIcon={<FilterList />}
          onClick={toggleFilters}
          sx={{ mb: 1 }}
        >
          Filter Options
        </Button>
        
        <Collapse in={showFilters}>
          <Box sx={{ mt: 1, mb: 2 }}>
            <ToggleButtonGroup
              value={filterStatus}
              exclusive
              onChange={handleFilterChange}
              aria-label="filter status"
              size="small"
            >
              <ToggleButton value="all" aria-label="all distributors">
                All
              </ToggleButton>
              <ToggleButton value="completed" aria-label="completed distributors" color="success">
                Completed
              </ToggleButton>
              <ToggleButton value="partial" aria-label="partial distributors" color="warning">
                Partial
              </ToggleButton>
              <ToggleButton value="none" aria-label="not started distributors" color="primary">
                Not Started
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Collapse>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer sx={{ mb: 4 }} component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Distributor Name</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDistributors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} align="center">
                    No distributors found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredDistributors.map((distributor) => {
                  const materials = distributor.Materials || [];
                  const totalMaterials = materials.length;

                  const lockedMaterialsCount = materials.filter((mat) => {
                    return (
                      mat.RequestMaterials &&
                      mat.RequestMaterials.some(
                        (rm) =>
                          rm.locked &&
                          rm.Request &&
                          rm.Request.distributorId === distributor.id
                      )
                    );
                  }).length;

                  const allLocked =
                    totalMaterials > 0 && lockedMaterialsCount === totalMaterials;
                  const partiallyLocked = lockedMaterialsCount > 0 && !allLocked;

                  return (
                    <TableRow key={distributor.id}>
                      <TableCell>{distributor.name}</TableCell>
                      <TableCell>
                        {totalMaterials === 0 ? (
                          <Button variant="contained" disabled>
                            No Materials
                          </Button>
                        ) : allLocked ? (
                          <Button variant="contained" color="success" disabled>
                            Completed
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            color={partiallyLocked ? 'warning' : 'primary'}
                            onClick={() => handleOpenModal(distributor)}
                          >
                            Choose Materials
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {openModal && selectedDistributor && (
          <MaterialSelectionModal
            open={openModal}
            onClose={handleCloseModal}
            materials={selectedDistributor.Materials || []}
            onSubmit={handleDownloadRequest}
            distributorId={selectedDistributor.id}
            totalAllowedQuantities={totalAllowedQuantities}
            distributorsMaterialsSum={distributorsMaterialsSum}
            refreshDistributors={fetchDistributors}
          />
        )}
      </div>
    );
}

export default SDDashboard;

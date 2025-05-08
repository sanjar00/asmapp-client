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
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'completed', 'partial', 'none'

  useEffect(() => {
    fetchDistributors();
  }, []);

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

  // This is where we gather selected materials from the modal 
  // => send them to POST /requests/generate-request
  // This is where we gather selected materials from the modal 
// => send them to POST /requests/generate-request
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

  // Filter distributors based on search term and status
  const filteredDistributors = distributors.filter(distributor => {
    // Apply search filter
    if (searchTerm && !distributor.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Apply status filter
    const materials = distributor.Materials || [];
    const totalMaterials = materials.length;
    
    if (totalMaterials === 0) {
      return filterStatus === 'all' || filterStatus === 'none';
    }
    
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
    
    const allLocked = totalMaterials > 0 && lockedMaterialsCount === totalMaterials;
    const partiallyLocked = lockedMaterialsCount > 0 && !allLocked;
    
    if (filterStatus === 'completed' && !allLocked) return false;
    if (filterStatus === 'partial' && !partiallyLocked) return false;
    if (filterStatus === 'none' && (allLocked || partiallyLocked || totalMaterials === 0)) return false;
    
    return true;
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
      
      <Box sx={{ mb: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <TextField
          label="Search distributors"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name"
          size="small"
        />
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button 
            variant={filterStatus === 'all' ? 'contained' : 'outlined'} 
            size="small"
            onClick={() => setFilterStatus('all')}
          >
            All
          </Button>
          <Button 
            variant={filterStatus === 'completed' ? 'contained' : 'outlined'} 
            color="success"
            size="small"
            onClick={() => setFilterStatus('completed')}
          >
            Completed
          </Button>
          <Button 
            variant={filterStatus === 'partial' ? 'contained' : 'outlined'} 
            color="warning"
            size="small"
            onClick={() => setFilterStatus('partial')}
          >
            Partial
          </Button>
          <Button 
            variant={filterStatus === 'none' ? 'contained' : 'outlined'} 
            color="primary"
            size="small"
            onClick={() => setFilterStatus('none')}
          >
            Not Started
          </Button>
        </Box>
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
                <TableCell><strong>Region</strong></TableCell>
                <TableCell><strong>Materials</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDistributors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
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

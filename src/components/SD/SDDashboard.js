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
} from '@mui/material';
import api from '../../services/api';
import MaterialSelectionModal from './MaterialSelectionModal';

function SDDashboard() {
  const [distributors, setDistributors] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const [totalAllowedQuantities, setTotalAllowedQuantities] = useState({});
  const [distributorsMaterialsSum, setDistributorsMaterialsSum] = useState({});

  useEffect(() => {
    fetchDistributors();
  }, []);

  const fetchDistributors = async () => {
    try {
      const response = await api.get('/sd/distributors');
      setDistributors(response.data);
    } catch (error) {
      console.error('Error while getting distributors:', error);
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

  return (
    <div>
      <Typography variant="h4" sx={{ mt: 4, fontWeight: 'bold' }} gutterBottom>
        SD Dashboard
      </Typography>

      <TableContainer sx={{ mb: 4 }} component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Distributor Name</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {distributors.map((distributor) => {
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
            })}
          </TableBody>
        </Table>
      </TableContainer>

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

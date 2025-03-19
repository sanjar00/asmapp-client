// src/components/ASM/ASMDashboard.js
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
import { Link } from 'react-router-dom'; // Import Link for navigation
import api from '../../services/api';
import MaterialListModal from './MaterialListModal';

function ASMDashboard() {
  const [distributors, setDistributors] = useState([]);
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    fetchDistributors();
  }, []);

  const fetchDistributors = async () => {
    try {
      const response = await api.get('/asm/distributors');
      setDistributors(response.data);
    } catch (error) {
      console.error('Error while getting distributors:', error);
    }
  };

  const handleOpenModal = (distributor) => {
    setSelectedDistributor(distributor);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setSelectedDistributor(null);
    setOpenModal(false);
  };

  return (
    <div>
      <Typography variant="h4" sx={{ mt: 4, fontWeight: 'bold' }} gutterBottom>
        ASM Dashboard
      </Typography>

      {/* New Order Materials Button */}
      <Button
        component={Link}
        to="/asm/order-materials"
        variant="contained"
        color="primary"
        sx={{ mb: 2 }}
      >
        Order Materials
      </Button>

      <TableContainer sx={{ mb: 4 }} component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Distributor Name</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {distributors.map((distributor) => (
              <TableRow key={distributor.id}>
                <TableCell>{distributor.name}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    onClick={() => handleOpenModal(distributor)}
                  >
                    Show Materials
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Material List Modal */}
      {selectedDistributor && (
        <MaterialListModal
          open={openModal}
          onClose={handleCloseModal}
          distributor={selectedDistributor}
        />
      )}
    </div>
  );
}

export default ASMDashboard;

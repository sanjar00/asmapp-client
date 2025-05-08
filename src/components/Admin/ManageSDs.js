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
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';

function ManageSDs() {
  const [sds, setSDs] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [asmId, setAsmId] = useState('');
  const [asms, setASMs] = useState([]);
  const [editingSdId, setEditingSdId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSDs();
    fetchASMs();
  }, []);

  const fetchSDs = async () => {
    try {
      const response = await api.get('/admin/sds');
      setSDs(response.data);
    } catch (error) {
      console.error('Error while getting SD:', error);
    }
  };

  const fetchASMs = async () => {
    try {
      const response = await api.get('/admin/asms');
      setASMs(response.data);
    } catch (error) {
      console.error('Error while getting ASM:', error);
    }
  };

  const addSD = async () => {
    if (!username || !password || !asmId) {
      alert('Please, fill in all fields');
      return;
    }
    try {
      await api.post('/admin/sds', { username, password, asmId });
      fetchSDs();
      setUsername('');
      setPassword('');
      setAsmId('');
    } catch (error) {
      console.error('Error while adding SD:', error);
    }
  };

  const editSD = (sdId) => {
    const sd = sds.find((s) => s.id === sdId);
    if (sd) {
      setEditingSdId(sdId);
      setUsername(sd.User.username);
      setPassword('');
      setAsmId(sd.asmId);
    }
  };

  const updateSD = async () => {
    if (!username || !asmId) {
      alert('Please, fill in all fields');
      return;
    }
    try {
      await api.put(`/admin/sds/${editingSdId}`, {
        username,
        password: password || undefined,
        asmId,
      });
      fetchSDs();
      setUsername('');
      setPassword('');
      setAsmId('');
      setEditingSdId(null);
    } catch (error) {
      console.error('Error while updating SD:', error);
    }
  };

  const deleteSD = async (sdId) => {
    if (window.confirm('Are you sure you want to delete SD?')) {
      try {
        await api.delete(`/admin/sds/${sdId}`);
        fetchSDs();
      } catch (error) {
        console.error('Error while deleting SD:', error);
      }
    }
  };

  const handleFilterChange = (event, newFilterStatus) => {
    if (newFilterStatus !== null) {
      setFilterStatus(newFilterStatus);
    }
  };
  
  // Filter SDs based on search term and ASM
  const filteredSDs = sds.filter(sd => {
    // Apply search filter
    if (searchTerm && !sd.User.username.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Apply ASM filter
    if (filterStatus === 'all') return true;
    if (filterStatus === 'withASM' && sd.asmId) return true;
    if (filterStatus === 'withoutASM' && !sd.asmId) return true;
    return false;
  });

  return (
    <div>
      {/* Form for adding or editing SD */}
      <Box component="form">
        <Typography variant="h5" gutterBottom>
          {editingSdId ? 'Edit SD' : 'Add SD'}
        </Typography>
        <TextField
          label="Login"
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Password"
          variant="outlined"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>ASM</InputLabel>
          <Select
            value={asmId}
            onChange={(e) => setAsmId(e.target.value)}
          >
            {asms.map((asm) => (
              <MenuItem key={asm.id} value={asm.id}>
                {asm.User.username} ({asm.id})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {editingSdId ? (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={updateSD}
              sx={{ mr: 1 }}
            >
              Update
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setEditingSdId(null);
                setUsername('');
                setPassword('');
                setAsmId('');
              }}
            >
              Cancel
            </Button>
          </Box>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={addSD}
            sx={{ mt: 2 }}
          >
            Add SD
          </Button>
        )}
      </Box>

      {/* Filter controls */}
      <Box sx={{ mt: 3, mb: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <TextField
          label="Search SDs"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by username"
          size="small"
        />
        
        <ToggleButtonGroup
          value={filterStatus}
          exclusive
          onChange={handleFilterChange}
          aria-label="filter status"
          size="small"
        >
          <ToggleButton value="all" aria-label="all SDs">
            All
          </ToggleButton>
          <ToggleButton value="withASM" aria-label="SDs with ASM" color="primary">
            With ASM
          </ToggleButton>
          <ToggleButton value="withoutASM" aria-label="SDs without ASM" color="warning">
            Without ASM
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Table of SDs */}
      <TableContainer component={Paper} sx={{ mt: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Login</TableCell>
              <TableCell>ASM</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSDs.map((sd) => (
              <TableRow key={sd.id}>
                <TableCell>{sd.User.username}</TableCell>
                <TableCell>
                  {asms.find((a) => a.id === sd.asmId)?.User.username || 'Not specified'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => editSD(sd.id)}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => deleteSD(sd.id)}
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

export default ManageSDs;

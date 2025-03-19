// src/components/Admin/ManageASMs.js

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
  FormHelperText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Box,
} from '@mui/material';

function ManageASMs() {
  const [asms, setAsms] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [regionIds, setRegionIds] = useState([]);
  const [regions, setRegions] = useState([]);
  const [editingAsmId, setEditingAsmId] = useState(null);
  const [channels, setChannels] = useState([]);
  const [channelIds, setChannelIds] = useState([]);

  useEffect(() => {
    fetchASMs();
    fetchRegions();
    fetchChannels();
  }, []);

  const fetchASMs = async () => {
    try {
      const response = await api.get('/admin/asms');
      setAsms(response.data);
    } catch (error) {
      console.error('Error while getting ASM:', error);
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

  const fetchChannels = async () => {
    try {
      const response = await api.get('/admin/channels');
      const uniqueChannels = [...new Map(response.data.map(item => [item.id, item])).values()]; // Ensure uniqueness
      setChannels(uniqueChannels);
    } catch (error) {
      console.error('Error while getting channels:', error);
    }
  };

  const addASM = async () => {
    if (!username || !password || !code || regionIds.length === 0 || channelIds.length === 0) {
      alert('Please, fill in all fields');
      return;
    }
    try {
      await api.post('/admin/asms', {
        username,
        password,
        code,
        regionIds,
        channelIds,
      });
      fetchASMs();
      setUsername('');
      setPassword('');
      setCode('');
      setRegionIds([]);
      setChannelIds([]);
    } catch (error) {
      console.error('Error while adding ASM:', error);
    }
  };

  const editASM = (asmId) => {
    const asm = asms.find((a) => a.id === asmId);
    if (asm) {
      setEditingAsmId(asmId);
      setUsername(asm.User?.username || '');
      setPassword('');
      setCode(asm.code || '');
      setRegionIds(asm.Regions?.map((region) => region.id.toString()) || []);
      setChannelIds(asm.Channels?.map((channel) => channel.id.toString()) || []);
    }
  };

  const updateASM = async () => {
    if (!username || !code || regionIds.length === 0 || channelIds.length === 0) {
      alert('Please, fill in all fields');
      return;
    }
    try {
      await api.put(`/admin/asms/${editingAsmId}`, {
        username,
        password: password || undefined,
        code,
        regionIds,
        channelIds,
      });
      fetchASMs();
      setUsername('');
      setPassword('');
      setCode('');
      setRegionIds([]);
      setChannelIds([]);
      setEditingAsmId(null);
    } catch (error) {
      console.error('Error while updating ASM:', error);
    }
  };

  const deleteASM = async (asmId) => {
    if (window.confirm('Are you sure you want to delete ASM?')) {
      try {
        await api.delete(`/admin/asms/${asmId}`);
        fetchASMs();
      } catch (error) {
        console.error('Error while deleting ASM:', error);
      }
    }
  };

  return (
    <div>
      <Box component="form" noValidate autoComplete="off">
        <Typography variant="h5" gutterBottom>
          {editingAsmId ? 'Edit ASM' : 'Add ASM'}
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
        <TextField
          label="Code"
          variant="outlined"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          fullWidth
          margin="normal"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel id="regions-label">Regions</InputLabel>
          <Select
            labelId="regions-label"
            id="regions"
            multiple
            value={regionIds}
            onChange={(e) => setRegionIds(e.target.value)}
            input={<OutlinedInput label="Regions" />}
            renderValue={(selected) =>
              regions
                .filter((region) => selected.includes(region.id.toString()))
                .map((region) => region.name)
                .join(', ')
            }
          >
            {regions.map((region) => (
              <MenuItem key={region.id} value={region.id.toString()}>
                <Checkbox checked={regionIds.indexOf(region.id.toString()) > -1} />
                <ListItemText primary={region.name} />
              </MenuItem>
            ))}
          </Select>
          {regionIds.length === 0 && (
            <FormHelperText error>Please, choose at least one region</FormHelperText>
          )}
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel id="channels-label">Channels</InputLabel>
          <Select
            labelId="channels-label"
            id="channels"
            multiple
            value={channelIds}
            onChange={(e) => setChannelIds(e.target.value)}
            input={<OutlinedInput label="Channels" />}
            renderValue={(selected) =>
              channels
                .filter((channel) => selected.includes(channel.id.toString()))
                .map((channel) => channel.name)
                .join(', ')
            }
          >
            {channels.map((channel) => (
              <MenuItem key={channel.id} value={channel.id.toString()}>
                <Checkbox checked={channelIds.indexOf(channel.id.toString()) > -1} />
                <ListItemText primary={channel.name} />
              </MenuItem>
            ))}
          </Select>
          {channelIds.length === 0 && (
            <FormHelperText error>Please, choose at least one channel</FormHelperText>
          )}
        </FormControl>
        {editingAsmId ? (
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" color="primary" onClick={updateASM} sx={{ mr: 1 }}>
              Update ASM
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                setEditingAsmId(null);
                setUsername('');
                setPassword('');
                setCode('');
                setRegionIds([]);
                setChannelIds([]);
              }}
            >
              Cancel
            </Button>
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" color="primary" onClick={addASM}>
              Add ASM
            </Button>
          </Box>
        )}
      </Box>


      <TableContainer sx={{ mt: 2 }} component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Login</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Regions</TableCell>
              <TableCell>Channels</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {asms.map((asm) => (
              <TableRow key={asm.id}>
                <TableCell>{asm.User.username}</TableCell>
                <TableCell>{asm.code}</TableCell>
                <TableCell>{asm.Regions.map((region) => region.name).join(', ')}</TableCell>
                <TableCell>{asm.Channels.map((channel) => channel.name).join(', ')}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => editASM(asm.id)}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    onClick={() => deleteASM(asm.id)}
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

export default ManageASMs;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, TextField, Button, Typography, Alert } from '@mui/material';
import api from '../services/api';
import logo from '../logo.webp'; // Import the logo

function Login({ setUserRole }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token } = response.data;
      localStorage.setItem('token', token);

      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserRole(payload.role);

      if (payload.role === 'Admin') {
        navigate('/admin');
      } else if (payload.role === 'ASM') {
        navigate('/asm');
      } else if (payload.role === 'SD') {
        navigate('/sd');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      if (error.response) {
        // Server responded with an error
        setError(error.response.data.message || 'Login failed');
      } else if (error.request) {
        // Request was made but no response
        setError('Unable to connect to server');
      } else {
        // Other errors
        setError('An error occurred during login');
      }
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          height: '100vh', // Full viewport height
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <img
          src={logo}
          alt="Logo"
          style={{
            width: 100,
            height: 100,
            marginBottom: '20px',
            borderRadius: '12px', // Slightly rounded corners
          }}
        />
        <Typography variant="h4" sx={{ fontWeight: 'bold' }} align="center" gutterBottom>
          Material Distribution 2.0
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <form onSubmit={handleLogin} style={{ width: '100%' }}>
          <TextField
            label="Login"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Password"
            variant="outlined"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            Enter
          </Button>
        </form>
      </Box>
    </Container>
  );
}

export default Login;

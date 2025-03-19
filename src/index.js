import React from 'react';
import { createRoot } from 'react-dom/client'; // Updated import
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App';
import './index.css';

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#d90429', // Buttons and links
    },
    secondary: {
      main: '#2b2d42', // Background color for nav bars
    },
    background: {
      default: '#edf2f4', // General background
      paper: '#ffffff',
    },
    text: {
      primary: '#000000', // Text color
      secondary: '#575757', // Secondary text
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#2b2d42', // Apply globally to all AppBars
        },
      },
    },
  },
  typography: {
    fontFamily: 'Rubik, Arial, sans-serif',
  },
});

// Get the root element
const container = document.getElementById('root');

// Create a root and render the app
const root = createRoot(container); // New API
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

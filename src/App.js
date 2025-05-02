import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Container } from '@mui/material';
import Login from './components/Login';
import AdminDashboard from './components/Admin/AdminDashboard';
import ASMDashboard from './components/ASM/ASMDashboard';
import ASMOrderPage from './components/ASM/ASMOrderPage'; // Import ASMOrderPage
import SDDashboard from './components/SD/SDDashboard';
import AppLayout from './components/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      } catch (error) {
        console.error('Ошибка декодирования токена:', error);
        setUserRole(null);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUserRole(null);
  };

  return (
    <Router>
      <CssBaseline />
      {userRole ? (
        <AppLayout userRole={userRole} handleLogout={handleLogout}>
          <Container>
            <ErrorBoundary>
              <Routes>
                <Route
                  path="/"
                  element={<Navigate to={`/${userRole.toLowerCase()}`} replace />}
                />

                {/* Admin Routes */}
                {userRole === 'Admin' && (
                  <>
                    <Route path="/admin" element={<AdminDashboard />} />
                    {/* Add other admin routes if needed */}
                  </>
                )}

                {/* ASM Routes */}
                {userRole === 'ASM' && (
                  <>
                    <Route path="/asm" element={<ASMDashboard />} />
                    <Route path="/asm/order-materials" element={<ASMOrderPage />} />
                  </>
                )}

                {/* SD Routes */}
                {userRole === 'SD' && (
                  <>
                    <Route path="/sd" element={<SDDashboard />} />
                    {/* Add other SD routes if needed */}
                  </>
                )}

                <Route path="*" element={<h2>Страница не найдена</h2>} />
              </Routes>
            </ErrorBoundary>
          </Container>
        </AppLayout>
      ) : (
        <Container>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Login setUserRole={setUserRole} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </Container>
      )}
    </Router>
  );
}

export default App;

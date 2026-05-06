import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Pages Marketing
import LandingPage from './pages/LandingPage';
import Produit from './pages/Produit';
import Solutions from './pages/Solutions';
import Tarifs from './pages/Tarifs';
import Ressources from './pages/Ressources';

// Sprint 1: Auth
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import ConfirmEmail from './features/auth/pages/ConfirmEmail';
import VerifyEmail from './features/auth/pages/VerifyEmail';
import ConfirmationSuccess from './features/auth/pages/ConfirmationSuccess';
import ResetPassword from './features/auth/pages/ResetPassword';

// Protected Routes & Layouts
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import AppLayout from './components/AppLayout';

// Dashboard & Wizard
import Dashboard from './pages/Dashboard';
import Wizard from './pages/Wizard.tsx';
import Security from './features/account/pages/Security';

import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/produit" element={<Produit />} />
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/tarifs" element={<Tarifs />} />
        <Route path="/ressources" element={<Ressources />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/confirmation-success" element={<ConfirmationSuccess />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes with AppLayout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/account/security" element={<Security />} />
          <Route path="/wizard" element={<Wizard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);

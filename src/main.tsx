/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import './i18n'; // initialise i18next (détection langue + traductions FR/EN)

// Protected Routes & Layouts (toujours chargés)
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import AppLayout from './components/AppLayout';

// === Code-splitting : pages marketing ===
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const Produit = React.lazy(() => import('./pages/Produit'));
const Solutions = React.lazy(() => import('./pages/Solutions'));
const Tarifs = React.lazy(() => import('./pages/Tarifs'));
const Ressources = React.lazy(() => import('./pages/Ressources'));

// === Code-splitting : auth ===
const Login = React.lazy(() => import('./features/auth/pages/Login'));
const Register = React.lazy(() => import('./features/auth/pages/Register'));
const ConfirmEmail = React.lazy(() => import('./features/auth/pages/ConfirmEmail'));
const VerifyEmail = React.lazy(() => import('./features/auth/pages/VerifyEmail'));
const ConfirmationSuccess = React.lazy(() => import('./features/auth/pages/ConfirmationSuccess'));
const ResetPassword = React.lazy(() => import('./features/auth/pages/ResetPassword'));

// === Code-splitting : pages protégées ===
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Contacts = React.lazy(() => import('./pages/Contacts'));
const Campaigns = React.lazy(() => import('./pages/Campaigns'));
const CampaignEditor = React.lazy(() => import('./pages/CampaignEditor'));
const Automations = React.lazy(() => import('./pages/Automations'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const CampaignReport = React.lazy(() => import('./pages/CampaignReport'));
const Rechargement = React.lazy(() => import('./pages/Rechargement'));
const ContactDetail = React.lazy(() => import('./features/contacts/pages/ContactDetail'));
const Security = React.lazy(() => import('./features/account/pages/Security'));
const Team = React.lazy(() => import('./features/account/pages/Team'));
const Settings = React.lazy(() => import('./features/account/pages/Settings'));
const Profile = React.lazy(() => import('./features/account/pages/Profile'));
const AuditLogs = React.lazy(() => import('./features/account/pages/AuditLogs'));
const Integrations = React.lazy(() => import('./features/account/pages/Integrations'));

import './index.css';

const Fallback = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      color: 'var(--text-2)',
      fontSize: 14,
    }}
  >
    Chargement…
  </div>
);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <React.Suspense fallback={<Fallback />}>
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
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected Routes with AppLayout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/contacts/:id" element={<ContactDetail />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaigns/new" element={<CampaignEditor />} />
            <Route path="/campaigns/:id" element={<CampaignEditor />} />
            <Route path="/campaigns/:id/edit" element={<CampaignEditor />} />
            <Route path="/campaigns/:id/report" element={<CampaignReport />} />
            <Route path="/automations" element={<Automations />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/segments" element={<Contacts />} />
            <Route path="/rechargement" element={<Rechargement />} />
            <Route path="/account/profile" element={<Profile />} />
            <Route path="/account/security" element={<Security />} />
            <Route path="/account/team" element={<Team />} />
            <Route path="/account/settings" element={<Settings />} />
            <Route path="/account/audit-logs" element={<AuditLogs />} />
            <Route path="/account/integrations" element={<Integrations />} />
          </Route>
        </Routes>
      </React.Suspense>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  </React.StrictMode>,
);

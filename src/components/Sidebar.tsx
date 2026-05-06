import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

function DashboardIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <rect x="1" y="1" width="5" height="5" rx="1" />
      <rect x="8" y="1" width="5" height="5" rx="1" />
      <rect x="1" y="8" width="5" height="5" rx="1" />
      <rect x="8" y="8" width="5" height="5" rx="1" />
    </svg>
  );
}

function ContactsIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="7" cy="4.5" r="2.5" />
      <path d="M1.5 12.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    </svg>
  );
}

function CampaignsIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="1" y="3" width="12" height="9" rx="1" />
      <polyline points="1,4 7,9 13,4" />
    </svg>
  );
}

function AutomationsIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="8,1 4,8 7,8 6,13 11,6 7,6" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <rect x="1" y="7" width="3" height="6" />
      <rect x="5.5" y="4" width="3" height="9" />
      <rect x="10" y="1" width="3" height="12" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="5.5" cy="4" r="2.5" />
      <path d="M1 12c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" />
      <line x1="10.5" y1="4.5" x2="10.5" y2="8.5" />
      <line x1="8.5" y1="6.5" x2="12.5" y2="6.5" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="2.5" />
      <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13" />
    </svg>
  );
}

function SecurityIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="5.5" cy="4" r="2.5" />
      <path d="M1 12c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" />
      <path d="M10.5 4.5h2M11.5 3.5v2" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 1.5h-2A1.5 1.5 0 0 0 1.5 3v8A1.5 1.5 0 0 0 3 12.5h2" />
      <path d="M8 4l3 3-3 3" />
      <path d="M11 7H4" />
    </svg>
  );
}

function Item({
  to,
  icon,
  label,
  badge,
  collapsed,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  badge?: string;
  collapsed: boolean;
}) {
  return (
    <NavLink to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <span className="nav-icon" aria-hidden="true">
        {icon}
      </span>
      {!collapsed && <span className="nav-text">{label}</span>}
      {!collapsed && badge && <span className="nav-badge">{badge}</span>}
    </NavLink>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sb-logo">
        <div className="sb-logomark">N</div>
        {!collapsed && (
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>NovaSMS</span>
        )}
        <button
          type="button"
          className="sb-collapse"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Ouvrir la navigation' : 'Réduire la navigation'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>
      <div className="sb-nav">
        {!collapsed && <div className="sb-section-label">Principal</div>}
        <Item
          to="/dashboard"
          icon={<DashboardIcon />}
          label="Tableau de bord"
          collapsed={collapsed}
        />
        <Item
          to="/contacts"
          icon={<ContactsIcon />}
          label="Contacts"
          badge="12k"
          collapsed={collapsed}
        />
        <Item to="/campaigns" icon={<CampaignsIcon />} label="Campagnes" collapsed={collapsed} />
        <Item
          to="/automations"
          icon={<AutomationsIcon />}
          label="Automatisations"
          badge="3"
          collapsed={collapsed}
        />
        <Item to="/analytics" icon={<AnalyticsIcon />} label="Analytics" collapsed={collapsed} />

        <div className="sb-divider" />
        {!collapsed && <div className="sb-section-label">Compte</div>}
        <Item
          to="/account/security"
          icon={<SecurityIcon />}
          label="Sécurité"
          collapsed={collapsed}
        />
        <Item to="/account/team" icon={<TeamIcon />} label="Équipe" collapsed={collapsed} />
        <Item
          to="/account/settings"
          icon={<SettingsIcon />}
          label="Paramètres"
          collapsed={collapsed}
        />
      </div>
      <div className="sb-footer">
        <button type="button" className="nav-item logout-item" onClick={handleLogout}>
          <span className="nav-icon" aria-hidden="true">
            <LogoutIcon />
          </span>
          {!collapsed && <span className="nav-text">Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}

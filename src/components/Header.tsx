import { useAuthStore } from '@/stores/authStore';
import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="hdr-title">
        <h1>Tableau de bord</h1>
        <p>Bonjour, {user?.name || 'Marchand'}</p>
      </div>

      <div className="hdr-actions">
        <Link to="/notifications" className="notif-btn" aria-label="notifications">
          🔔
        </Link>
        <button type="button" className="credits-recharge" onClick={handleLogout}>
          Déconnexion
        </button>
        <Link to="/campaigns/new" className="btn-primary">
          + Nouvelle campagne
        </Link>
        <div className="avatar">
          {user?.name
            ? user.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
            : 'KM'}
        </div>
      </div>
    </header>
  );
}

import { useAuthStore } from '@/stores/authStore';
import { Link, useNavigate } from 'react-router-dom';
import { useCampaignActions } from '@/hooks/useCampaign';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { createNewCampaign } = useCampaignActions();

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
        <button
          type="button"
          className="btn-primary"
          onClick={async () => {
            await createNewCampaign();
            navigate('/campaigns/new?fresh=1');
          }}
        >
          + Nouvelle campagne
        </button>
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

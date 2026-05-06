import { useAuthStore } from '@/stores/authStore';
import { Link } from 'react-router-dom';

export default function Header() {
  const { user } = useAuthStore();

  return (
    <header className="header">
      <div className="hdr-title">
        <h1>Tableau de bord</h1>
        <p>Bonjour, {user?.name || 'Marchand'}</p>
      </div>

      <div className="credits-pill">
        <div className="credits-pill-top">
          <span className="credits-label">Crédits disponibles</span>
          <button className="credits-recharge">Recharger ↗</button>
        </div>
        <div className="flex items-center gap-8">
          <span className="credits-amount">--</span>
          <div style={{ flex: 1 }}>
            <div className="credits-bar">
              <div className="credits-bar-fill" />
            </div>
            <div className="credits-hint">Chargement…</div>
          </div>
        </div>
      </div>

      <div className="hdr-actions">
        <Link to="/notifications" className="notif-btn" aria-label="notifications">
          🔔
        </Link>
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

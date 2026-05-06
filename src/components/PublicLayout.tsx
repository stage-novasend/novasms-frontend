import { Outlet } from 'react-router-dom';

export default function PublicLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background">
      {children ?? <Outlet />}
    </div>
  );
}

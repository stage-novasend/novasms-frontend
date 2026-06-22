import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import type { AppRole } from '@/config/roles';
import { FALLBACK_REDIRECT } from '@/config/roles';

type Props = {
  roles: AppRole[];
  children: React.ReactNode;
};

export default function RoleGuard({ roles, children }: Props) {
  const user = useAuthStore((s) => s.user);
  const role = (user?.role ?? 'Admin') as AppRole;

  if (!roles.includes(role)) {
    return <Navigate to={FALLBACK_REDIRECT[role]} replace />;
  }

  return <>{children}</>;
}

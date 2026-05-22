import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, accessToken, isHydrated } = useAuthStore();
  const location = useLocation();

  // Dev-only bypass: allow rendering the app without authentication when
  // running the frontend in development mode to ease local testing.
  // This is intentional for developer ergonomics and should NOT be shipped.
  if (import.meta.env && import.meta.env.DEV) {
    return <>{children}</>;
  }

  // ✅ Attendre que le store soit hydraté depuis localStorage
  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

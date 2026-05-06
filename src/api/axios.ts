import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Intercepteur de requête : ajouter le Bearer token
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Intercepteur de réponse : gérer les erreurs 401 + refresh token
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const { status } = error.response || {};

    // Si 401 et pas déjà en train de retry
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      if (refreshToken) {
        try {
          // Appel pour refresh le token
          const res = await axios.post('http://localhost:3000/api/auth/refresh', {
            refreshToken,
          });

          if (res.data.success) {
            // Mettre à jour les tokens dans le store
            const currentUser = useAuthStore.getState().user;
            if (currentUser) {
              setTokens(res.data.accessToken, res.data.refreshToken, currentUser);
            } else {
              // si pas d'utilisateur, on déconnecte pour éviter l'état incohérent
              useAuthStore.getState().logout();
              window.location.href = '/login';
            }
            // Retry la requête originale avec le nouveau token
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
            return api(originalRequest);
          }
        } catch {
          // Refresh échoué → déconnexion
          logout();
          window.location.href = '/login';
        }
      } else {
        // Pas de refresh token → déconnexion
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default api;

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type User = {
  id: string;
  email: string;
  name: string;
  onboardingCompleted?: boolean; // ✅ Champ ajouté
  role?: string;
  sector?: string | null;
  primaryChannels?: string[];
};

export type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isFirstLogin: boolean; // Calculé depuis le backend
  rememberMe: boolean;
  sessionExpiresAt: number | null;
  requiresTwoFactor: boolean;
  twoFactorToken: string | null;
  twoFactorMessage: string | null;
  pendingRememberMe: boolean;

  // Actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  verifyTwoFactor: (twoFactorToken: string, code: string) => Promise<boolean>;
  logout: () => void;
  setTokens: (access: string, refresh: string, user: User) => void;
  clearError: () => void;
  markOnboardingCompleted: () => Promise<void>;
  saveWizardProfile: (profile: {
    companyName: string;
    role: string;
    sector: string;
    primaryChannels: string[];
  }) => Promise<boolean>;
  isHydrated: boolean;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isFirstLogin: false,
      rememberMe: false,
      sessionExpiresAt: null,
      requiresTwoFactor: false,
      twoFactorToken: null,
      twoFactorMessage: null,
      pendingRememberMe: false,
      isHydrated: false,

      login: async (email: string, password: string, rememberMe = false) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, motDePasse: password }),
          });

          const data = await res.json();

          if (!res.ok) {
            set({
              error: data.message || 'Échec de la connexion',
              isLoading: false,
              requiresTwoFactor: false,
              twoFactorToken: null,
              twoFactorMessage: null,
            });
            return false;
          }

          if (data.requiresTwoFactor) {
            set({
              isLoading: false,
              error: null,
              requiresTwoFactor: true,
              twoFactorToken: data.twoFactorToken ?? null,
              twoFactorMessage: data.message ?? 'Un code de vérification a été envoyé.',
              pendingRememberMe: rememberMe,
            });
            return false;
          }

          // ✅ Calculer isFirstLogin depuis le backend
          const onboardingCompleted = data.account?.onboardingCompleted ?? false;
          const sessionExpiresAt =
            Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000);

          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user: data.account,
            isAuthenticated: true,
            isLoading: false,
            isFirstLogin: !onboardingCompleted, // ✅ Vrai si onboarding NON complété
            rememberMe,
            sessionExpiresAt,
            requiresTwoFactor: false,
            twoFactorToken: null,
            twoFactorMessage: null,
            pendingRememberMe: false,
          });
          return true;
        } catch {
          set({
            error: 'Erreur de connexion au serveur',
            isLoading: false,
            requiresTwoFactor: false,
            twoFactorToken: null,
            twoFactorMessage: null,
            pendingRememberMe: false,
          });
          return false;
        }
      },

      verifyTwoFactor: async (twoFactorToken: string, code: string) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('http://localhost:3000/api/auth/verify-2fa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ twoFactorToken, code }),
          });

          const data = await res.json();

          if (!res.ok) {
            set({
              error: data.message || 'Code de vérification invalide',
              isLoading: false,
            });
            return false;
          }

          const onboardingCompleted = data.account?.onboardingCompleted ?? false;
          const rememberMe = get().pendingRememberMe;
          const sessionExpiresAt =
            Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000);

          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user: data.account,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            requiresTwoFactor: false,
            twoFactorToken: null,
            twoFactorMessage: null,
            isFirstLogin: !onboardingCompleted,
            rememberMe,
            sessionExpiresAt,
            pendingRememberMe: false,
          });
          return true;
        } catch {
          set({
            error: 'Erreur de connexion au serveur',
            isLoading: false,
            pendingRememberMe: false,
          });
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
          isFirstLogin: false,
          rememberMe: false,
          sessionExpiresAt: null,
          requiresTwoFactor: false,
          twoFactorToken: null,
          twoFactorMessage: null,
          pendingRememberMe: false,
        });
      },

      setTokens: (access: string, refresh: string, user: User) => {
        const onboardingCompleted = user.onboardingCompleted ?? false;
        set({
          accessToken: access,
          refreshToken: refresh,
          user,
          isAuthenticated: true,
          requiresTwoFactor: false,
          twoFactorToken: null,
          twoFactorMessage: null,
          isFirstLogin: !onboardingCompleted,
          rememberMe: true,
          sessionExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
          pendingRememberMe: false,
        });
      },

      clearError: () => set({ error: null }),

      // ✅ Action pour marquer l'onboarding comme complété (appelle le backend)
      markOnboardingCompleted: async () => {
        const { user, accessToken } = get();
        if (!user?.id || !accessToken) return;

        try {
          await fetch('http://localhost:3000/api/auth/onboarding/complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          });
        } catch (err) {
          console.error('Failed to mark onboarding completed', err);
        }

        // Mettre à jour l'état local
        set((state) => ({
          user: state.user ? { ...state.user, onboardingCompleted: true } : null,
          isFirstLogin: false,
        }));
      },

      saveWizardProfile: async ({ companyName, role, sector, primaryChannels }) => {
        const { accessToken, user } = get();
        if (!user?.id || !accessToken) return false;

        try {
          const res = await fetch('http://localhost:3000/api/auth/profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ companyName, role, sector, primaryChannels }),
          });

          const data = await res.json();

          if (!res.ok) {
            set({ error: data.message || 'Impossible de sauvegarder le profil' });
            return false;
          }

          set((state) => ({
            user: state.user
              ? {
                  ...state.user,
                  name: data.account?.companyName ?? companyName,
                  role: data.account?.role ?? role,
                  sector: data.account?.sector ?? sector,
                  primaryChannels: data.account?.primaryChannels ?? primaryChannels,
                }
              : null,
          }));

          return true;
        } catch {
          set({ error: 'Erreur de connexion au serveur' });
          return false;
        }
      },
    }),
    {
      name: 'novasms-auth',
      partialize: (state) => ({
        // ✅ Persister uniquement les champs nécessaires
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isFirstLogin: state.isFirstLogin,
        rememberMe: state.rememberMe,
        sessionExpiresAt: state.sessionExpiresAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        const hasValidSession =
          typeof state.sessionExpiresAt === 'number' &&
          Number.isFinite(state.sessionExpiresAt) &&
          Date.now() < state.sessionExpiresAt;

        if (!hasValidSession) {
          state.user = null;
          state.accessToken = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
          state.isFirstLogin = false;
          state.rememberMe = false;
          state.sessionExpiresAt = null;
          state.requiresTwoFactor = false;
          state.twoFactorToken = null;
          state.twoFactorMessage = null;
          state.pendingRememberMe = false;
        }

        state.isHydrated = true;
      },
    },
  ),
);

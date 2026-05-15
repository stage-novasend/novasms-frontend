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
  requiresTwoFactor: boolean;
  twoFactorToken: string | null;
  twoFactorMessage: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
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
      requiresTwoFactor: false,
      twoFactorToken: null,
      twoFactorMessage: null,
      isHydrated: false,

      login: async (email: string, password: string) => {
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
            });
            return false;
          }

          // ✅ Calculer isFirstLogin depuis le backend
          const onboardingCompleted = data.account?.onboardingCompleted ?? false;

          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user: data.account,
            isAuthenticated: true,
            isLoading: false,
            isFirstLogin: !onboardingCompleted, // ✅ Vrai si onboarding NON complété
            requiresTwoFactor: false,
            twoFactorToken: null,
            twoFactorMessage: null,
          });
          return true;
        } catch {
          set({
            error: 'Erreur de connexion au serveur',
            isLoading: false,
            requiresTwoFactor: false,
            twoFactorToken: null,
            twoFactorMessage: null,
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
          });
          return true;
        } catch {
          set({
            error: 'Erreur de connexion au serveur',
            isLoading: false,
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
          requiresTwoFactor: false,
          twoFactorToken: null,
          twoFactorMessage: null,
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
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.isHydrated = true;
      },
    },
  ),
);

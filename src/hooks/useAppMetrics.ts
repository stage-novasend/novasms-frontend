import { useCallback, useEffect, useState } from 'react';
import api from '@/api/axios';
import { contactsApi } from '@/api/contacts';
import { useAuthStore } from '@/stores/authStore';

type AppMetrics = {
  credits: number | null;
  contactsTotal: number;
  loading: boolean;
  refresh: () => Promise<void>;
};

export function useAppMetrics(): AppMetrics {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [credits, setCredits] = useState<number | null>(null);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setCredits(null);
      setContactsTotal(0);
      return;
    }

    setLoading(true);
    try {
      const [accountResult, contactsResult] = await Promise.allSettled([
        api.get<{ account?: { creditBalance?: string | number } }>('/auth/me'),
        contactsApi.list({ limit: 1 }),
      ]);

      if (accountResult.status === 'fulfilled') {
        const rawCredits = accountResult.value.data?.account?.creditBalance;
        const parsed = rawCredits == null ? null : Number(rawCredits);
        setCredits(Number.isFinite(parsed as number) ? (parsed as number) : null);
      }

      if (contactsResult.status === 'fulfilled') {
        setContactsTotal(contactsResult.value.total ?? 0);
      }
    } catch {
      // Les composants affichent un fallback si métriques indisponibles.
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { credits, contactsTotal, loading, refresh };
}

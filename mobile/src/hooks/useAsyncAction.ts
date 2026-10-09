import { useCallback, useState } from 'react';

/**
 * Enveloppe une action asynchrone avec état `loading` + `error`.
 * Évite de répéter try/catch/finally dans chaque écran.
 */
export function useAsyncAction<Args extends any[], R>(action: (...args: Args) => Promise<R>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (...args: Args): Promise<R | undefined> => {
      setLoading(true);
      setError(null);
      try {
        return await action(...args);
      } catch (e: any) {
        setError(e?.message ?? 'Une erreur est survenue.');
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [action],
  );

  return { run, loading, error, clearError: () => setError(null) };
}

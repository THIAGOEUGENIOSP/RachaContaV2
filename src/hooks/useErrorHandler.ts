import { useState, useCallback } from 'react';
import { handleError } from '../lib/supabase';

export function useErrorHandler() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    context: string = 'Operação'
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      return await operation();
    } catch (err) {
      const message = handleError(err);
      setError(`${context}: ${message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    loading,
    handleOperation,
    clearError,
    setError
  };
}
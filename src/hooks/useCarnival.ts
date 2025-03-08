import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface CarnivalData {
  id: string;
  name: string;
  year: number;
  status: 'planning' | 'active' | 'completed';
}

export function useCarnival() {
  const [activeCarnival, setActiveCarnival] = useState<CarnivalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveCarnival();
  }, []);

  const fetchActiveCarnival = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('carnivals')
        .select('*')
        .eq('status', 'active')
        .single();

      if (error) throw error;
      setActiveCarnival(data);
    } catch (error) {
      console.error('Error fetching active carnival:', error);
      setError('Não foi possível carregar o carnaval ativo');
    } finally {
      setLoading(false);
    }
  };

  const setActive = async (carnivalId: string) => {
    try {
      setLoading(true);
      setError(null);

      // First, set all carnivals to completed
      const { error: updateError } = await supabase
        .from('carnivals')
        .update({ status: 'completed' })
        .eq('status', 'active');

      if (updateError) throw updateError;

      // Then, set the selected carnival to active
      const { error: activateError } = await supabase
        .from('carnivals')
        .update({ status: 'active' })
        .eq('id', carnivalId);

      if (activateError) throw activateError;

      await fetchActiveCarnival();
    } catch (error) {
      console.error('Error setting active carnival:', error);
      setError('Não foi possível ativar o carnaval');
    } finally {
      setLoading(false);
    }
  };

  return {
    activeCarnival,
    loading,
    error,
    setActive,
    refresh: fetchActiveCarnival
  };
}
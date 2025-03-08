import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ActiveCarnival {
  id: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
}

export function useActiveCarnival() {
  const [carnival, setCarnival] = useState<ActiveCarnival | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveCarnival();
  }, []);

  const fetchActiveCarnival = async () => {
    try {
      setLoading(true);
      setError(null);

      // First check if there's an active carnival
      const { data, error: countError } = await supabase
        .from('carnivals')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      if (countError) throw countError;

      // If no active carnival, clear state
      if (!data || data.length === 0) {
        setCarnival(null);
        return;
      }

      // If multiple active carnivals, use the most recent one and fix the others
      if (data.length > 1) {
        // Sort by created_at to get the most recent
        const sortedCarnivals = data.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // Set all but the most recent to completed
        const { error: updateError } = await supabase
          .from('carnivals')
          .update({ status: 'completed' })
          .in('id', sortedCarnivals.slice(1).map(c => c.id));

        if (updateError) throw updateError;

        // Use the most recent carnival
        setCarnival(sortedCarnivals[0]);
      } else {
        // Just one active carnival, use it
        setCarnival(data[0]);
      }
    } catch (error) {
      console.error('Error fetching active carnival:', error);
      setError('Não foi possível carregar o carnaval ativo');
    } finally {
      setLoading(false);
    }
  };

  return {
    carnival,
    loading,
    error,
    refresh: fetchActiveCarnival
  };
}
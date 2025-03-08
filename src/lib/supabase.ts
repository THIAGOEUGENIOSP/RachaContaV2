import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'racha-conta'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Add error handling for database operations
export const handleError = (error: any): string => {
  console.error('Database error:', error);
  
  if (error?.message?.includes('JWT')) {
    return 'Sessão expirada. Por favor, faça login novamente.';
  }
  
  if (error?.message?.includes('network')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }
  
  if (error?.code === '23505') {
    return 'Este registro já existe.';
  }
  
  if (error?.code === '23503') {
    return 'Não foi possível realizar esta operação pois existem registros relacionados.';
  }
  
  if (error?.code === 'PGRST116') {
    return 'Você não tem permissão para realizar esta operação.';
  }
  
  if (error?.code === '23514') {
    return 'Os dados fornecidos são inválidos.';
  }
  
  if (error?.code === '23502') {
    return 'Todos os campos obrigatórios devem ser preenchidos.';
  }
  
  return 'Ocorreu um erro. Por favor, tente novamente.';
};

// Helper to check if a carnival exists and is active
export const validateCarnival = async (carnivalId: string | null): Promise<boolean> => {
  if (!carnivalId) return false;
  
  try {
    const { data, error } = await supabase
      .from('carnivals')
      .select('status')
      .eq('id', carnivalId)
      .single();
    
    if (error) throw error;
    return data?.status === 'active';
  } catch (error) {
    console.error('Error validating carnival:', error);
    return false;
  }
};

// Helper to get active carnival
export const getActiveCarnival = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('carnivals')
      .select('id')
      .eq('status', 'active')
      .single();
    
    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    console.error('Error getting active carnival:', error);
    return null;
  }
};

// Helper to check if user has access to a carnival
export const hasAccessToCarnival = async (carnivalId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('carnival_participants')
      .select('id')
      .eq('carnival_id', carnivalId)
      .eq('participant_id', user.id)
      .single();
    
    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking carnival access:', error);
    return false;
  }
};

// Helper to format error messages
export const formatErrorMessage = (error: any, context: string): string => {
  const baseMessage = handleError(error);
  return `${context}: ${baseMessage}`;
};
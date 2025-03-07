import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SideMenu } from './components/SideMenu';
import { Overview } from './components/Overview';
import { Participants } from './components/Participants';
import { Expenses } from './components/Expenses';
import { Balances } from './components/Balances';
import { Payments } from './components/Payments';
import { Contributions } from './components/Contributions';
import { ShoppingList } from './components/ShoppingList';
import { Reports } from './components/Reports';
import { Database } from './types/supabase';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with additional options
const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'carnaval-2025'
    }
  },
  db: {
    schema: 'public'
  }
});

function App() {
  const [activeSection, setActiveSection] = useState('overview');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const checkConnection = async () => {
    try {
      setIsCheckingConnection(true);
      setConnectionError(null);

      // Test the connection by making a simple query
      const { data, error } = await supabase
        .from('participants')
        .select('count');

      if (error) {
        console.error('Supabase connection error:', error);
        setIsSupabaseConnected(false);
        setConnectionError(error.message);
        return;
      }

      setIsSupabaseConnected(true);
    } catch (error) {
      console.error('Supabase connection error:', error);
      setIsSupabaseConnected(false);
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect to database');
    } finally {
      setIsCheckingConnection(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const renderActiveSection = () => {
    if (!isSupabaseConnected) {
      return null;
    }

    switch (activeSection) {
      case 'overview':
        return <Overview supabase={supabase} />;
      case 'participants':
        return <Participants supabase={supabase} />;
      case 'expenses':
        return <Expenses supabase={supabase} />;
      case 'balances':
        return <Balances supabase={supabase} />;
      case 'payments':
        return <Payments supabase={supabase} />;
      case 'contributions':
        return <Contributions supabase={supabase} />;
      case 'shopping-list':
        return <ShoppingList supabase={supabase} />;
      case 'reports':
        return <Reports supabase={supabase} />;
      default:
        return <Overview supabase={supabase} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <SideMenu activeSection={activeSection} setActiveSection={setActiveSection} />
      
      <div className="flex-1 overflow-auto pt-16 md:pt-0">
        {!isSupabaseConnected && (
          <div className="bg-yellow-100 p-4 flex items-center text-yellow-800 mb-4">
            <AlertCircle className="mr-2 flex-shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {connectionError || 'Conecte-se ao Supabase para usar todas as funcionalidades.'}
              </p>
              <p className="text-xs mt-1">
                Clique no botão "Connect to Supabase" no canto superior direito.
              </p>
            </div>
            <button
              onClick={checkConnection}
              className="ml-4 p-2 rounded-full hover:bg-yellow-200 transition-colors"
              disabled={isCheckingConnection}
            >
              <RefreshCw size={16} className={`${isCheckingConnection ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
        
        <main className="container mx-auto px-3 md:px-4 py-4 md:py-6">
          {isCheckingConnection ? (
            <div className="text-center py-8">
              <RefreshCw size={24} className="animate-spin mx-auto text-emerald-500 mb-2" />
              <p className="text-gray-600">Verificando conexão...</p>
            </div>
          ) : (
            renderActiveSection()
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
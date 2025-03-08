import React, { useState } from 'react';
import { AlertCircle, LogIn, UserPlus, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (mode === 'signin') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            throw new Error('Email ou senha incorretos');
          }
          throw signInError;
        }

        if (!data?.user) {
          throw new Error('Erro ao fazer login. Por favor, tente novamente.');
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            emailRedirectTo: window.location.origin
          }
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            throw new Error('Este email já está cadastrado');
          }
          throw signUpError;
        }

        if (!data?.user) {
          throw new Error('Erro ao criar conta. Por favor, tente novamente.');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error instanceof Error ? error.message : 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-600">🎭 Carnaval 2025</h1>
          <h2 className="text-xl font-medium text-emerald-500">RachaConta</h2>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
              <AlertCircle size={18} className="mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              disabled={loading}
            >
              {loading ? (
                'Processando...'
              ) : mode === 'signin' ? (
                <>
                  <LogIn size={18} className="mr-2" />
                  Entrar
                </>
              ) : (
                <>
                  <UserPlus size={18} className="mr-2" />
                  Cadastrar
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            {mode === 'signin' ? (
              <button
                onClick={() => setMode('signup')}
                className="text-sm text-emerald-600 hover:text-emerald-500 flex items-center justify-center mx-auto"
              >
                <UserPlus size={16} className="mr-1" />
                Criar uma nova conta
              </button>
            ) : (
              <button
                onClick={() => setMode('signin')}
                className="text-sm text-emerald-600 hover:text-emerald-500 flex items-center justify-center mx-auto"
              >
                <ArrowLeft size={16} className="mr-1" />
                Voltar para o login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
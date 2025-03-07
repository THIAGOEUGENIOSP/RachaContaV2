import React, { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { User, Settings, Save, AlertCircle, Trash2, AlertTriangle } from 'lucide-react';

interface ProfileProps {
  supabase: SupabaseClient<Database>;
  session: any;
}

interface UserProfile {
  id: string;
  name: string;
  type: 'individual' | 'casal';
  children: number;
}

export const Profile: React.FC<ProfileProps> = ({ supabase, session }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'individual' | 'casal'>('individual');
  const [children, setChildren] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [session]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setName(data.name);
        setType(data.type);
        setChildren(data.children);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const updates = {
        name,
        type,
        children,
        user_id: session.user.id,
      };

      let result;
      
      if (profile) {
        // Update existing profile
        result = await supabase
          .from('participants')
          .update(updates)
          .eq('id', profile.id);
      } else {
        // Create new profile
        result = await supabase
          .from('participants')
          .insert([updates]);
      }

      if (result.error) throw result.error;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Refresh profile data
      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsDeleting(true);
      setDeleteError(null);

      // First verify the password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: deletePassword,
      });

      if (signInError) {
        setDeleteError('Senha incorreta');
        return;
      }

      // Delete all user data
      if (profile) {
        await supabase
          .from('participants')
          .delete()
          .eq('id', profile.id);
      }

      // Delete the user account
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        session.user.id
      );

      if (deleteError) throw deleteError;

      // Sign out
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error deleting account:', error);
      setDeleteError('Erro ao excluir conta. Por favor, tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Settings size={24} className="mr-2" />
          Configurações do Perfil
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
            <AlertCircle size={18} className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            Perfil atualizado com sucesso!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={session.user.email}
              disabled
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as 'individual' | 'casal')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            >
              <option value="individual">Individual</option>
              <option value="casal">Casal</option>
            </select>
          </div>

          <div>
            <label htmlFor="children" className="block text-sm font-medium text-gray-700 mb-1">
              Número de Crianças
            </label>
            <input
              type="number"
              id="children"
              min="0"
              value={children}
              onChange={(e) => setChildren(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            disabled={loading}
          >
            {loading ? (
              'Salvando...'
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Salvar Alterações
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-red-600 mb-4">Zona Perigosa</h3>
          
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 size={18} className="mr-2" />
              Excluir Minha Conta
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start mb-4">
                <AlertTriangle className="text-red-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Tem certeza que deseja excluir sua conta?</h4>
                  <p className="mt-1 text-sm text-red-700">
                    Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente excluídos.
                  </p>
                </div>
              </div>

              {deleteError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                  {deleteError}
                </div>
              )}

              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-red-700 mb-1">
                    Digite sua senha para confirmar
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword('');
                      setDeleteError(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    disabled={isDeleting || !deletePassword}
                  >
                    {isDeleting ? (
                      'Excluindo...'
                    ) : (
                      <>
                        <Trash2 size={16} className="mr-2" />
                        Excluir Minha Conta
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
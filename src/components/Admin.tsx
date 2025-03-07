import React, { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { Users, Shield, Trash2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface AdminProps {
  supabase: SupabaseClient<Database>;
  session: any;
}

interface UserWithProfile {
  id: string;
  email: string;
  created_at: string;
  profile?: {
    id: string;
    name: string;
    type: string;
  };
  role?: string;
}

interface SystemStats {
  totalUsers: number;
  totalExpenses: number;
  totalAmount: number;
  totalParticipants: number;
}

export const Admin: React.FC<AdminProps> = ({ supabase, session }) => {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalExpenses: 0,
    totalAmount: 0,
    totalParticipants: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [session]);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Usuário não encontrado');
        return;
      }

      // Check if user has admin role in auth.users
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (adminError) {
        console.error('Error checking admin status:', adminError);
        setError('Erro ao verificar status de administrador');
        return;
      }

      const hasAdminAccess = !!adminData;
      setIsAdmin(hasAdminAccess);

      if (hasAdminAccess) {
        fetchData();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setError('Erro ao verificar status de administrador');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users with their profiles
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

      if (userError) throw userError;

      // Fetch participant profiles
      const { data: profiles, error: profileError } = await supabase
        .from('participants')
        .select('id, name, type, user_id');

      if (profileError) throw profileError;

      // Match users with their profiles
      const usersWithProfiles = userData.users.map(user => ({
        ...user,
        profile: profiles?.find(p => p.user_id === user.id)
      }));

      setUsers(usersWithProfiles);

      // Fetch system statistics
      const [
        { count: totalUsers },
        { count: totalParticipants },
        { data: expenses }
      ] = await Promise.all([
        supabase.from('auth.users').select('id', { count: 'exact', head: true }),
        supabase.from('participants').select('id', { count: 'exact', head: true }),
        supabase.from('expenses').select('amount')
      ]);

      const totalAmount = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;

      setStats({
        totalUsers: totalUsers || 0,
        totalExpenses: expenses?.length || 0,
        totalAmount,
        totalParticipants: totalParticipants || 0
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setError('Erro ao carregar dados administrativos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Delete user's participant profile
      const { error: profileError } = await supabase
        .from('participants')
        .delete()
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Delete user account
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

      if (deleteError) throw deleteError;

      setSuccess('Usuário excluído com sucesso');
      setTimeout(() => setSuccess(null), 3000);

      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Erro ao excluir usuário');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <Shield size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-600">
            Esta área é restrita a administradores do sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Shield size={24} className="mr-2" />
          Painel Administrativo
        </h2>
        <button 
          onClick={fetchData}
          className="flex items-center text-emerald-600 hover:text-emerald-700"
          disabled={loading}
        >
          <RefreshCw size={16} className="mr-1" />
          Atualizar Dados
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
          <AlertCircle size={20} className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
          <CheckCircle size={20} className="mr-2 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalUsers}</h3>
            </div>
            <Users className="h-8 w-8 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Participantes</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalParticipants}</h3>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Despesas</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalExpenses}</h3>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <h3 className="text-2xl font-bold text-emerald-600">
                {formatCurrency(stats.totalAmount)}
              </h3>
            </div>
            <Users className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Usuários do Sistema</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Cadastro
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.profile?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.profile?.type ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {user.profile.type === 'casal' ? 'Casal' : 'Individual'}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Excluir usuário"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
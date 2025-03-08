import React, { useState, useEffect } from 'react';
import { Calendar, Users, DollarSign, Plus, Trash2, Edit2, AlertCircle, CheckCircle, RefreshCw, Baby } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/formatters';

interface CarnivalManagerProps {
  onCarnivalSelect: (carnivalId: string | null) => void;
}

interface Carnival {
  id: string;
  year: number;
  name: string;
  start_date: string;
  end_date: string;
  status: 'planning' | 'active' | 'completed';
  created_at: string;
  _count?: {
    adults: number;
    children: number;
    expenses: number;
  };
  _sum?: {
    expenses: number;
  };
}

export const CarnivalManager: React.FC<CarnivalManagerProps> = ({ onCarnivalSelect }) => {
  const [carnivals, setCarnivals] = useState<Carnival[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    name: '',
    start_date: '',
    end_date: '',
    status: 'planning' as const
  });

  useEffect(() => {
    fetchCarnivals();
  }, []);

  const fetchCarnivals = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch carnivals
      const { data: carnivalData, error: carnivalError } = await supabase
        .from('carnivals')
        .select('*')
        .order('year', { ascending: false });

      if (carnivalError) throw carnivalError;

      // For each carnival, fetch additional data
      const enrichedCarnivals = await Promise.all(
        carnivalData.map(async (carnival) => {
          // Get participants data
          const { data: participantsData } = await supabase
            .from('carnival_participants')
            .select(`
              participant:participant_id (
                id,
                type,
                children
              )
            `)
            .eq('carnival_id', carnival.id);

          // Calculate total adults and children
          let totalAdults = 0;
          let totalChildren = 0;

          participantsData?.forEach(item => {
            if (item.participant) {
              // Count adults based on type (casal = 2, individual = 1)
              totalAdults += item.participant.type === 'casal' ? 2 : 1;
              // Add children count
              totalChildren += item.participant.children || 0;
            }
          });

          // Get expenses data
          const { data: expenses } = await supabase
            .from('expenses')
            .select('amount')
            .eq('carnival_id', carnival.id);

          const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

          return {
            ...carnival,
            _count: {
              adults: totalAdults,
              children: totalChildren,
              expenses: expenses?.length || 0
            },
            _sum: {
              expenses: totalExpenses
            }
          };
        })
      );

      setCarnivals(enrichedCarnivals);
    } catch (error) {
      console.error('Error fetching carnivals:', error);
      setError('Erro ao carregar os carnavais');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('carnivals')
        .insert([formData]);

      if (error) throw error;

      setShowForm(false);
      setFormData({
        year: new Date().getFullYear(),
        name: '',
        start_date: '',
        end_date: '',
        status: 'planning'
      });

      fetchCarnivals();
    } catch (error) {
      console.error('Error creating carnival:', error);
      setError('Erro ao criar carnaval');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este carnaval? Todos os dados relacionados serão perdidos.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('carnivals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      onCarnivalSelect(null);
      fetchCarnivals();
    } catch (error) {
      console.error('Error deleting carnival:', error);
      setError('Erro ao excluir carnaval');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (carnivalId: string, newStatus: 'planning' | 'active' | 'completed') => {
    try {
      setIsLoading(true);
      setError(null);

      // If setting to active, first deactivate all other carnivals
      if (newStatus === 'active') {
        const { error: deactivateError } = await supabase
          .from('carnivals')
          .update({ status: 'completed' })
          .eq('status', 'active');

        if (deactivateError) throw deactivateError;
      }

      // Update the selected carnival
      const { error: updateError } = await supabase
        .from('carnivals')
        .update({ status: newStatus })
        .eq('id', carnivalId);

      if (updateError) throw updateError;

      // If activating, select this carnival
      if (newStatus === 'active') {
        onCarnivalSelect(carnivalId);
      } else if (newStatus !== 'active' && carnivals.find(c => c.id === carnivalId)?.status === 'active') {
        // If deactivating the current carnival, clear selection
        onCarnivalSelect(null);
      }

      fetchCarnivals();
    } catch (error) {
      console.error('Error updating carnival status:', error);
      setError('Erro ao atualizar status do carnaval');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewCarnival = (carnivalId: string) => {
    onCarnivalSelect(carnivalId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning':
        return <Edit2 size={16} className="mr-2" />;
      case 'active':
        return <AlertCircle size={16} className="mr-2" />;
      case 'completed':
        return <CheckCircle size={16} className="mr-2" />;
      default:
        return null;
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'planning':
        return 'Em Planejamento';
      case 'active':
        return 'Ativo';
      case 'completed':
        return 'Concluído';
      default:
        return status;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gerenciar Carnavais</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Novo Carnaval
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
          <AlertCircle size={18} className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Novo Carnaval</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                  Ano
                </label>
                <input
                  type="number"
                  id="year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                  Data de Início
                </label>
                <input
                  type="date"
                  id="start_date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                  Data de Término
                </label>
                <input
                  type="date"
                  id="end_date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'planning' | 'active' | 'completed' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                required
              >
                <option value="planning">Em Planejamento</option>
                <option value="active">Ativo</option>
                <option value="completed">Concluído</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Criando...' : 'Criar Carnaval'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {carnivals.map((carnival) => (
          <div key={carnival.id} className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{carnival.name}</h3>
                <p className="text-sm text-gray-500">Carnaval {carnival.year}</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(carnival.status)}`}>
                {getStatusIcon(carnival.status)}
                {formatStatus(carnival.status)}
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar size={16} className="mr-2 text-gray-400" />
                <span>
                  {new Date(carnival.start_date).toLocaleDateString('pt-BR')} até{' '}
                  {new Date(carnival.end_date).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <div className="flex items-center">
                <Users size={16} className="mr-2 text-gray-400" />
                <span>{carnival._count?.adults || 0} Adultos</span>
              </div>

              <div className="flex items-center">
                <Baby size={16} className="mr-2 text-gray-400" />
                <span>{carnival._count?.children || 0} Crianças</span>
              </div>

              <div className="flex items-center">
                <DollarSign size={16} className="mr-2 text-gray-400" />
                <span>
                  Despesas ({formatCurrency(carnival._sum?.expenses || 0)})
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
              <div className="space-x-2">
                <button
                  onClick={() => handleViewCarnival(carnival.id)}
                  className="px-3 py-1 bg-emerald-500 text-white rounded-md text-sm hover:bg-emerald-600"
                >
                  Visualizar
                </button>
                {carnival.status !== 'active' && (
                  <button
                    onClick={() => handleStatusChange(carnival.id, 'active')}
                    className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
                  >
                    Ativar
                  </button>
                )}
                {carnival.status === 'active' && (
                  <button
                    onClick={() => handleStatusChange(carnival.id, 'completed')}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                  >
                    Concluir
                  </button>
                )}
              </div>
              <button
                onClick={() => handleDelete(carnival.id)}
                className="text-red-500 hover:text-red-700"
                title="Excluir carnaval"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
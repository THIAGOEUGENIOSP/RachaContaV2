import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Participant {
  id: string;
  name: string;
  type: 'individual' | 'casal';
  children: number;
  created_at: string;
}

export const RegisteredParticipants: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState<'individual' | 'casal'>('individual');
  const [children, setChildren] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('name');

      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
      setError('Não foi possível carregar os participantes. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Por favor, insira um nome para o participante.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { error: insertError } = await supabase
        .from('participants')
        .insert([{ name: name.trim(), type, children }]);

      if (insertError) throw insertError;
      
      setName('');
      setType('individual');
      setChildren(0);
      
      await fetchParticipants();
    } catch (error) {
      console.error('Error adding participant:', error);
      setError('Erro ao adicionar participante. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este participante? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('participants')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchParticipants();
    } catch (error) {
      console.error('Error deleting participant:', error);
      setError('Erro ao excluir participante. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Participantes Cadastrados</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
          <AlertCircle size={18} className="mr-2 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={fetchParticipants}
            className="ml-2 text-sm text-red-700 hover:text-red-800 underline flex items-center"
          >
            <RefreshCw size={14} className="mr-1" />
            Tentar novamente
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-1">
          <div className="card p-3 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Adicionar Participante</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name" className="text-sm">Nome:</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="text-sm md:text-base"
                  disabled={isLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="type" className="text-sm">Tipo:</label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as 'individual' | 'casal')}
                  required
                  className="text-sm md:text-base"
                  disabled={isLoading}
                >
                  <option value="individual">Individual</option>
                  <option value="casal">Casal</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="children" className="text-sm">Número de Crianças:</label>
                <input
                  type="number"
                  id="children"
                  min="0"
                  value={children}
                  onChange={(e) => setChildren(parseInt(e.target.value))}
                  className="text-sm md:text-base"
                  disabled={isLoading}
                />
              </div>
              
              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center text-sm md:text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  'Adicionando...'
                ) : (
                  <>
                    <Plus size={16} className="mr-2" />
                    Adicionar Participante
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="card p-3 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Lista de Participantes</h3>
            
            {isLoading && participants.length === 0 ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Carregando participantes...</p>
              </div>
            ) : participants.length === 0 ? (
              <p className="text-center py-4 text-sm text-gray-500">Nenhum participante cadastrado.</p>
            ) : (
              <div className="overflow-x-auto -mx-3 md:-mx-6">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Nome</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Tipo</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Crianças</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Data de Cadastro</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((participant) => (
                      <tr key={participant.id}>
                        <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm font-medium">
                          {participant.name}
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            participant.type === 'casal' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {participant.type === 'casal' ? 'Casal' : 'Individual'}
                          </span>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">
                          {participant.children}
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">
                          {new Date(participant.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">
                          <button
                            onClick={() => handleDelete(participant.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Excluir"
                            disabled={isLoading}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
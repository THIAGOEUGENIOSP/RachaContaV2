import React, { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { Trash2 } from 'lucide-react';

interface ParticipantsProps {
  supabase: SupabaseClient<Database>;
}

interface Participant {
  id: string;
  name: string;
  type: 'individual' | 'casal';
  children: number;
  created_at?: string;
}

export const Participants: React.FC<ParticipantsProps> = ({ supabase }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState<'individual' | 'casal'>('individual');
  const [children, setChildren] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Por favor, insira um nome para o participante.');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('participants')
        .insert([{ name, type, children }]);

      if (error) throw error;
      
      // Reset form
      setName('');
      setType('individual');
      setChildren(0);
      
      // Refresh participants list
      fetchParticipants();
    } catch (error) {
      console.error('Error adding participant:', error);
      alert('Erro ao adicionar participante. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este participante?')) return;
    
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh participants list
      fetchParticipants();
    } catch (error) {
      console.error('Error deleting participant:', error);
      alert('Erro ao excluir participante. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Participantes</h2>
      
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
                />
              </div>
              
              <button
                type="submit"
                className="btn-primary w-full text-sm md:text-base"
                disabled={isLoading}
              >
                {isLoading ? 'Adicionando...' : 'Adicionar Participante'}
              </button>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="card p-3 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Participantes Cadastrados</h3>
            
            {isLoading && participants.length === 0 ? (
              <p className="text-center py-4 text-sm">Carregando participantes...</p>
            ) : participants.length === 0 ? (
              <p className="text-center py-4 text-sm">Nenhum participante cadastrado.</p>
            ) : (
              <div className="overflow-x-auto -mx-3 md:-mx-6">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Nome</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Tipo</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Crianças</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((participant) => (
                      <tr key={participant.id}>
                        <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm font-medium">{participant.name}</td>
                        <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">{participant.type === 'casal' ? 'Casal' : 'Individual'}</td>
                        <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">{participant.children}</td>
                        <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">
                          <button
                            onClick={() => handleDelete(participant.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Excluir"
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
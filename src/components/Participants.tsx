import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, RefreshCw, UserCheck, UserX } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Participant {
  id: string;
  name: string;
  type: 'individual' | 'casal';
  children: number;
}

interface EventParticipant {
  id: string;
  carnival_id: string;
  participant_id: string;
  participant?: Participant;
}

interface ParticipantsProps {
  carnivalId?: string | null;
}

export const Participants: React.FC<ParticipantsProps> = ({ carnivalId }) => {
  const [registeredParticipants, setRegisteredParticipants] = useState<Participant[]>([]);
  const [eventParticipants, setEventParticipants] = useState<EventParticipant[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (carnivalId) {
      fetchParticipants();
    }
  }, [carnivalId]);

  const fetchParticipants = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!carnivalId) {
        setRegisteredParticipants([]);
        setEventParticipants([]);
        return;
      }

      // Fetch all registered participants
      const { data: registeredData, error: registeredError } = await supabase
        .from('participants')
        .select('*')
        .order('name');

      if (registeredError) throw registeredError;

      // Fetch participants for this carnival
      const { data: eventData, error: eventError } = await supabase
        .from('carnival_participants')
        .select(`
          *,
          participant:participant_id (
            id,
            name,
            type,
            children
          )
        `)
        .eq('carnival_id', carnivalId);

      if (eventError) throw eventError;

      setRegisteredParticipants(registeredData || []);
      setEventParticipants(eventData || []);
      setSelectedParticipants((eventData || []).map(ep => ep.participant_id));
    } catch (error) {
      console.error('Error fetching participants:', error);
      setError('Não foi possível carregar os participantes. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleParticipantToggle = async (participantId: string) => {
    if (!carnivalId) return;

    try {
      setIsLoading(true);
      setError(null);

      if (selectedParticipants.includes(participantId)) {
        // Remove participant from event
        const { error: deleteError } = await supabase
          .from('carnival_participants')
          .delete()
          .eq('carnival_id', carnivalId)
          .eq('participant_id', participantId);

        if (deleteError) throw deleteError;

        setSelectedParticipants(prev => prev.filter(id => id !== participantId));
      } else {
        // Add participant to event
        const { error: insertError } = await supabase
          .from('carnival_participants')
          .insert([{
            carnival_id: carnivalId,
            participant_id: participantId
          }]);

        if (insertError) throw insertError;

        setSelectedParticipants(prev => [...prev, participantId]);
      }

      await fetchParticipants();
    } catch (error) {
      console.error('Error toggling participant:', error);
      setError('Erro ao atualizar participante. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = async () => {
    if (!carnivalId || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      const participantsToAdd = registeredParticipants
        .filter(p => !selectedParticipants.includes(p.id))
        .map(p => ({
          carnival_id: carnivalId,
          participant_id: p.id
        }));

      if (participantsToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('carnival_participants')
          .insert(participantsToAdd);

        if (insertError) throw insertError;
      }

      await fetchParticipants();
    } catch (error) {
      console.error('Error selecting all participants:', error);
      setError('Erro ao adicionar todos os participantes. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeselectAll = async () => {
    if (!carnivalId || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('carnival_participants')
        .delete()
        .eq('carnival_id', carnivalId);

      if (deleteError) throw deleteError;

      await fetchParticipants();
    } catch (error) {
      console.error('Error removing all participants:', error);
      setError('Erro ao remover todos os participantes. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!carnivalId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Selecione um carnaval para gerenciar participantes</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Participantes do Carnaval</h2>

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

      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Selecionar Participantes</h3>
          <div className="space-x-2">
            <button
              onClick={handleSelectAll}
              className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center"
              disabled={isLoading}
            >
              <UserCheck size={16} className="mr-1" />
              Selecionar Todos
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleDeselectAll}
              className="text-red-600 hover:text-red-700 text-sm flex items-center"
              disabled={isLoading}
            >
              <UserX size={16} className="mr-1" />
              Remover Todos
            </button>
          </div>
        </div>

        {isLoading && registeredParticipants.length === 0 ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Carregando participantes...</p>
          </div>
        ) : registeredParticipants.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum participante cadastrado.</p>
            <p className="text-sm text-gray-400 mt-2">
              Cadastre participantes na seção "Participantes Cadastrados" no menu lateral.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {registeredParticipants.map((participant) => (
              <div
                key={participant.id}
                className={`
                  p-4 rounded-lg border-2 transition-all cursor-pointer
                  ${selectedParticipants.includes(participant.id)
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-200'
                  }
                `}
                onClick={() => handleParticipantToggle(participant.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{participant.name}</h4>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        participant.type === 'casal'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {participant.type === 'casal' ? 'Casal' : 'Individual'}
                      </span>
                      {participant.children > 0 && (
                        <span className="bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full text-xs">
                          {participant.children} criança{participant.children > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center
                    ${selectedParticipants.includes(participant.id)
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-gray-300'
                    }
                  `}>
                    {selectedParticipants.includes(participant.id) && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
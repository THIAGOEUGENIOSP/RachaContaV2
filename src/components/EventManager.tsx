import React, { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { Plus, Calendar, FileText, Trash2, Users, AlertCircle } from 'lucide-react';

interface EventManagerProps {
  supabase: SupabaseClient<Database>;
}

interface Event {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
  participant_count?: number;
}

export const EventManager: React.FC<EventManagerProps> = ({ supabase }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: false });

      if (eventsError) throw eventsError;

      // Fetch participant count for each event
      const eventsWithCounts = await Promise.all(
        (eventsData || []).map(async (event) => {
          const { count } = await supabase
            .from('event_participants')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);

          return {
            ...event,
            participant_count: count || 0
          };
        })
      );

      setEvents(eventsWithCounts);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);

      if (!name.trim() || !startDate || !endDate) {
        setError('Por favor, preencha todos os campos obrigatórios.');
        return;
      }

      const { error: insertError } = await supabase
        .from('events')
        .insert([{
          name: name.trim(),
          description: description.trim() || null,
          start_date: startDate,
          end_date: endDate
        }]);

      if (insertError) throw insertError;

      // Reset form
      setName('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setShowForm(false);

      // Refresh events list
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      setError('Erro ao criar evento. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento? Todos os dados relacionados serão perdidos.')) {
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Erro ao excluir evento. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gerenciar Eventos</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Novo Evento
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Novo Evento</h3>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
              <AlertCircle size={18} className="mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome do Evento *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descrição
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Data de Início *
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  Data de Término *
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>
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
                {isLoading ? 'Criando...' : 'Criar Evento'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className="card">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
              <button
                onClick={() => handleDelete(event.id)}
                className="text-red-500 hover:text-red-700"
                title="Excluir evento"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {event.description && (
              <p className="text-gray-600 text-sm mb-4">{event.description}</p>
            )}

            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar size={16} className="mr-2" />
                <span>
                  {new Date(event.start_date).toLocaleDateString('pt-BR')} até{' '}
                  {new Date(event.end_date).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <div className="flex items-center">
                <Users size={16} className="mr-2" />
                <span>{event.participant_count} participantes</span>
              </div>

              <div className="flex items-center">
                <FileText size={16} className="mr-2" />
                <span>Criado em {new Date(event.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
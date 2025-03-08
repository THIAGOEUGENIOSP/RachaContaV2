import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Event {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
}

interface EventSelectorProps {
  selectedEventId: string | null;
  onEventChange: (eventId: string) => void;
}

export const EventSelector: React.FC<EventSelectorProps> = ({
  selectedEventId,
  onEventChange
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching events:', error);
        setError('Erro ao carregar eventos. Por favor, tente novamente.');
        return;
      }

      const eventList = data || [];
      setEvents(eventList);

      // If no event is selected and we have events, select the first one
      if (!selectedEventId && eventList.length > 0) {
        onEventChange(eventList[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="relative">
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
          <AlertCircle size={18} className="mr-2 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={fetchEvents}
            className="ml-2 text-sm text-red-700 hover:text-red-800 underline flex items-center"
          >
            <RefreshCw size={14} className="mr-1" />
            Tentar novamente
          </button>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2 bg-white border ${
          error ? 'border-red-300' : 'border-gray-300'
        } rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
        disabled={isLoading}
      >
        <div className="flex items-center">
          <Calendar size={20} className={error ? 'text-red-500' : 'text-emerald-500'} />
          <span className="ml-2 font-medium text-gray-900">
            {isLoading ? 'Carregando...' : selectedEvent?.name || 'Selecione um evento'}
          </span>
        </div>
        <ChevronDown size={20} className="text-gray-500" />
      </button>

      {isOpen && events.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="py-1">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => {
                  onEventChange(event.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                  selectedEventId === event.id ? 'bg-emerald-50 text-emerald-700' : 'text-gray-900'
                }`}
              >
                <div className="font-medium">{event.name}</div>
                {event.description && (
                  <div className="text-sm text-gray-500">{event.description}</div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(event.start_date).toLocaleDateString('pt-BR')} até{' '}
                  {new Date(event.end_date).toLocaleDateString('pt-BR')}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && events.length === 0 && !isLoading && !error && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
          Nenhum evento encontrado. Crie um novo evento para começar.
        </div>
      )}
    </div>
  );
};
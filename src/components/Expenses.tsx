import React, { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { Trash2, Plus, Users, DollarSign, RefreshCw, UserCheck, UserX, AlertCircle } from 'lucide-react';
import { formatCurrency, parseInputValue } from '../utils/formatters';

interface ExpensesProps {
  supabase: SupabaseClient<Database>;
  carnivalId?: string | null;
}

interface Participant {
  id: string;
  name: string;
  type: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  created_at?: string;
  payer_id?: string;
  payer?: Participant;
}

interface ExpenseParticipant {
  id: string;
  expense_id: string;
  participant_id: string;
  amount: number;
  participant?: Participant;
}

export const Expenses: React.FC<ExpensesProps> = ({ supabase, carnivalId }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Aluguel');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payerId, setPayerId] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [divisionType, setDivisionType] = useState('equal');
  const [isLoading, setIsLoading] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [currentExpenseId, setCurrentExpenseId] = useState<string | null>(null);
  const [expenseParticipants, setExpenseParticipants] = useState<ExpenseParticipant[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExpenses();
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching participants:', error);
        return;
      }
      
      setParticipants(data || []);
      if (data && data.length > 0 && !payerId) {
        setPayerId(data[0].id);
        setSelectedParticipants(data.map(p => p.id));
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      
      if (!carnivalId) {
        setExpenses([]);
        return;
      }

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          payer:payer_id(id, name)
        `)
        .eq('carnival_id', carnivalId)
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Não foi possível carregar as despesas. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExpenseParticipants = async (expenseId: string) => {
    try {
      const { data, error } = await supabase
        .from('expense_participants')
        .select(`
          *,
          participant:participant_id(id, name)
        `)
        .eq('expense_id', expenseId);

      if (error) {
        console.error('Error fetching expense participants:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching expense participants:', error);
      return [];
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(parseInputValue(e.target.value));
  };

  const handleParticipantToggle = (participantId: string) => {
    setSelectedParticipants(prev => {
      if (prev.includes(participantId)) {
        return prev.filter(id => id !== participantId);
      } else {
        return [...prev, participantId];
      }
    });
  };

  const handleSelectAllParticipants = () => {
    setSelectedParticipants(participants.map(p => p.id));
  };

  const handleDeselectAllParticipants = () => {
    setSelectedParticipants([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      alert('Por favor, insira uma descrição para a despesa.');
      return;
    }

    if (!payerId) {
      alert('Por favor, selecione quem pagou a despesa.');
      return;
    }

    if (selectedParticipants.length === 0) {
      alert('Por favor, selecione pelo menos um participante.');
      return;
    }

    const numericAmount = parseFloat(
      amount.replace(/\./g, '').replace(',', '.')
    );

    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Por favor, insira um valor válido para a despesa.');
      return;
    }

    try {
      setIsLoading(true);
      
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .insert([{
          description,
          amount: numericAmount,
          category,
          date,
          payer_id: payerId,
          carnival_id: carnivalId
        }])
        .select();

      if (expenseError) {
        console.error('Error adding expense:', expenseError);
        alert('Erro ao adicionar despesa. Por favor, tente novamente.');
        return;
      }
      
      if (!expenseData || expenseData.length === 0) {
        alert('Erro ao adicionar despesa. Nenhum dado retornado.');
        return;
      }
      
      const expenseId = expenseData[0].id;
      
      let amountsPerParticipant: Record<string, number> = {};
      
      if (divisionType === 'equal') {
        let totalAdults = 0;
        
        selectedParticipants.forEach(participantId => {
          const participant = participants.find(p => p.id === participantId);
          if (participant) {
            totalAdults += participant.type === 'casal' ? 2 : 1;
          }
        });
        
        const amountPerAdult = numericAmount / totalAdults;
        
        selectedParticipants.forEach(participantId => {
          const participant = participants.find(p => p.id === participantId);
          if (participant) {
            amountsPerParticipant[participantId] = 
              participant.type === 'casal' ? amountPerAdult * 2 : amountPerAdult;
          }
        });
      } else {
        const amountPerPerson = numericAmount / selectedParticipants.length;
        selectedParticipants.forEach(participantId => {
          amountsPerParticipant[participantId] = amountPerPerson;
        });
      }
      
      const expenseParticipantsData = selectedParticipants.map(participantId => ({
        expense_id: expenseId,
        participant_id: participantId,
        amount: amountsPerParticipant[participantId]
      }));
      
      const { error: participantsError } = await supabase
        .from('expense_participants')
        .insert(expenseParticipantsData);
      
      if (participantsError) {
        console.error('Error adding expense participants:', participantsError);
        alert('Erro ao adicionar participantes da despesa. Por favor, tente novamente.');
        return;
      }
      
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
      setDescription('');
      setAmount('');
      setCategory('Aluguel');
      setDate(new Date().toISOString().split('T')[0]);
      
      fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Erro ao adicionar despesa. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
    
    try {
      setIsLoading(true);
      
      const { error: participantsError } = await supabase
        .from('expense_participants')
        .delete()
        .eq('expense_id', id);
        
      if (participantsError) {
        console.error('Error deleting expense participants:', participantsError);
        alert('Erro ao excluir participantes da despesa. Por favor, tente novamente.');
        return;
      }
      
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting expense:', error);
        alert('Erro ao excluir despesa. Por favor, tente novamente.');
        return;
      }
      
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Erro ao excluir despesa. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const showParticipants = async (expenseId: string) => {
    setCurrentExpenseId(expenseId);
    const participants = await fetchExpenseParticipants(expenseId);
    setExpenseParticipants(participants);
    setShowParticipantModal(true);
  };

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Despesas</h2>
      
      <div className="mb-4 flex justify-end">
        <button 
          onClick={fetchExpenses} 
          className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm"
          disabled={isLoading}
        >
          <RefreshCw size={16} className="mr-1 flex-shrink-0" />
          Atualizar Despesas
        </button>
      </div>
      
      {showSuccessMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 md:px-4 md:py-3 rounded relative mb-4 flex items-center text-sm">
          <DollarSign className="mr-2 flex-shrink-0" size={18} />
          <span>Despesa registrada com sucesso!</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-1">
          <div className="card p-3 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Adicionar Despesa</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="description" className="text-sm">Descrição:</label>
                <input
                  type="text"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="text-sm md:text-base"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="amount" className="text-sm">Valor:</label>
                <input
                  type="text"
                  id="amount"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0,00"
                  required
                  className="text-sm md:text-base"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category" className="text-sm">Categoria:</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="text-sm md:text-base"
                >
                  <option value="Aluguel">Aluguel</option>
                  <option value="Compras">Compras</option>
                  <option value="Adicional">Adicional</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Alimentação">Alimentação</option>
                  <option value="Lazer">Lazer</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="date" className="text-sm">Data:</label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="text-sm md:text-base"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="payer" className="text-sm">Quem Pagou:</label>
                <select
                  id="payer"
                  value={payerId}
                  onChange={(e) => setPayerId(e.target.value)}
                  required
                  className="text-sm md:text-base"
                >
                  <option value="">Selecione quem pagou</option>
                  {participants.map(participant => (
                    <option key={participant.id} value={participant.id}>
                      {participant.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Participantes:</label>
                  <div className="space-x-2">
                    <button 
                      type="button" 
                      onClick={handleSelectAllParticipants}
                      className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center"
                    >
                      <UserCheck size={14} className="mr-1" />
                      Todos
                    </button>
                    <span className="text-gray-300">|</span>
                    <button 
                      type="button" 
                      onClick={handleDeselectAllParticipants}
                      className="text-xs text-red-600 hover:text-red-700 flex items-center"
                    >
                      <UserX size={14} className="mr-1" />
                      Nenhum
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 bg-gray-50 rounded-lg p-3">
                  {participants.map(participant => (
                    <label
                      key={participant.id}
                      className={`
                        flex items-center p-2 rounded-md cursor-pointer transition-colors
                        ${selectedParticipants.includes(participant.id)
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-white hover:bg-gray-100'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(participant.id)}
                        onChange={() => handleParticipantToggle(participant.id)}
                        className="sr-only"
                      />
                      <div className={`
                        w-4 h-4 rounded border flex items-center justify-center mr-3
                        ${selectedParticipants.includes(participant.id)
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-gray-300'
                        }
                      `}>
                        {selectedParticipants.includes(participant.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm">{participant.name}</span>
                      {participant.type === 'casal' && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Casal
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="divisionType" className="text-sm">Tipo de Divisão:</label>
                <select
                  id="divisionType"
                  value={divisionType}
                  onChange={(e) => setDivisionType(e.target.value)}
                  required
                  className="text-sm md:text-base"
                >
                  <option value="equal">Igual (por adulto)</option>
                </select>
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
                    <Plus size={16} className="mr-2 flex-shrink-0" />
                    Registrar Despesa
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="card p-3 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Despesas Registradas</h3>
            
            {isLoading && expenses.length === 0 ? (
              <p className="text-center py-4 text-sm">Carregando despesas...</p>
            ) : expenses.length === 0 ? (
              <p className="text-center py-4 text-sm">Nenhuma despesa registrada.</p>
            ) : (
              <div className="overflow-x-auto -mx-3 md:-mx-6">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Descrição</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Valor</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Categoria</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Data</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Pagador</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id}>
                        <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm font-medium">{expense.description}</td>
                        <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm text-emerald-600 font-medium">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">{expense.category}</td>
                        <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">{new Date(expense.date).toLocaleDateString('pt-BR')}</td>
                        <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">{expense.payer?.name || 'Não especificado'}</td>
                        <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => showParticipants(expense.id)}
                              className="text-blue-500 hover:text-blue-700"
                              title="Ver participantes"
                            >
                              <Users size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(expense.id)}
                              className="text-red-500 hover:text-red-700"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
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
      
      {showParticipantModal && currentExpenseId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Participantes da Despesa</h3>
            
            {expenseParticipants.length === 0 ? (
              <p className="text-center py-4 text-sm">Nenhum participante encontrado.</p>
            ) : (
              <div className="overflow-y-auto max-h-80">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-3 md:px-6 py-2 text-xs">Participante</th>
                      <th className="px-3 md:px-6 py-2 text-xs">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseParticipants.map((ep) => (
                      <tr key={ep.id}>
                        <td className="px-3 md:px-6 py-2 text-xs md:text-sm font-medium">{ep.participant?.name}</td>
                        <td className="px-3 md:px-6 py-2 text-xs md:text-sm text-emerald-600">{formatCurrency(ep.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowParticipantModal(false)}
                className="btn-secondary text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
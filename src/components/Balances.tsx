import React, { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { ArrowRight, RefreshCw, CheckCircle, HelpCircle, DollarSign, CreditCard, Calendar, Tag, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface BalancesProps {
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
  payer_id: string;
  date: string;
  category: string;
}

interface ExpenseParticipant {
  expense_id: string;
  participant_id: string;
  amount: number;
}

interface Payment {
  id: string;
  payer_id: string;
  receiver_id: string;
  amount: number;
}

interface Balance {
  participant: Participant;
  paid: number;      // Total amount paid by this participant
  owes: number;      // Total amount this participant owes
  owed: number;      // Total amount owed to this participant
  balance: number;   // Net balance (positive means they're owed money, negative means they owe money)
}

interface DetailedPayment {
  from_id: string;
  from_name: string;
  to_id: string;
  to_name: string;
  amount: number;
  expense_id: string;
  expense_description: string;
}

interface PaymentsByPayer {
  payer: Participant;
  payments: {
    receiver: Participant;
    amount: number;
    isPaid: boolean;
  }[];
}

export const Balances: React.FC<BalancesProps> = ({ supabase, carnivalId }) => {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [detailedPayments, setDetailedPayments] = useState<DetailedPayment[]>([]);
  const [paymentsByPayer, setPaymentsByPayer] = useState<PaymentsByPayer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed'>('detailed');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (carnivalId) {
      fetchData();
    }
  }, [carnivalId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!carnivalId) {
        setParticipants([]);
        setExpenses([]);
        setBalances([]);
        setDetailedPayments([]);
        setPaymentsByPayer([]);
        return;
      }
      
      // Fetch participants for this carnival
      const { data: participantsData, error: participantsError } = await supabase
        .from('carnival_participants')
        .select(`
          participant:participant_id (
            id,
            name,
            type
          )
        `)
        .eq('carnival_id', carnivalId);

      if (participantsError) throw participantsError;
      
      const transformedParticipants = participantsData
        .map(item => item.participant)
        .filter((item): item is Participant => item !== null);

      setParticipants(transformedParticipants);
      
      // Fetch expenses for this carnival
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('carnival_id', carnivalId);

      if (expensesError) throw expensesError;
      
      setExpenses(expensesData || []);
      
      // Fetch expense participants
      const { data: expenseParticipantsData, error: expenseParticipantsError } = await supabase
        .from('expense_participants')
        .select('*');

      if (expenseParticipantsError) throw expenseParticipantsError;
      
      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*');

      if (paymentsError) throw paymentsError;
      
      // Calculate balances
      calculateBalances(
        transformedParticipants, 
        expensesData || [], 
        expenseParticipantsData || [],
        paymentsData || []
      );
      
      // Calculate detailed payments
      calculateDetailedPayments(
        transformedParticipants,
        expensesData || [],
        expenseParticipantsData || [],
        paymentsData || []
      );
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Não foi possível carregar os dados. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBalances = (
    participants: Participant[],
    expenses: Expense[],
    expenseParticipants: ExpenseParticipant[],
    payments: Payment[]
  ) => {
    // Initialize balance map with all participants
    const balanceMap = new Map<string, { 
      participant: Participant;
      paid: number;    // Total amount paid
      owes: number;    // Total amount owed to others
      owed: number;    // Total amount others owe to this participant
      balance: number; // Net balance
    }>();
    
    // Initialize balances for all participants
    participants.forEach(participant => {
      balanceMap.set(participant.id, {
        participant,
        paid: 0,
        owes: 0,
        owed: 0,
        balance: 0
      });
    });
    
    // Process what each participant actually paid
    expenses.forEach(expense => {
      const payerId = expense.payer_id;
      if (!payerId) return;
      
      const payerBalance = balanceMap.get(payerId);
      if (payerBalance) {
        payerBalance.paid += expense.amount;
      }
    });
    
    // Process what each participant owes
    expenseParticipants.forEach(ep => {
      const participantId = ep.participant_id;
      const participantBalance = balanceMap.get(participantId);
      
      if (participantBalance) {
        participantBalance.owes += ep.amount;
      }
    });
    
    // Process payments
    payments.forEach(payment => {
      const payerBalance = balanceMap.get(payment.payer_id);
      const receiverBalance = balanceMap.get(payment.receiver_id);
      
      if (payerBalance && receiverBalance) {
        // When someone makes a payment, it reduces what they owe
        payerBalance.owes -= payment.amount;
        // And reduces what the receiver is owed
        receiverBalance.owed -= payment.amount;
      }
    });
    
    // Calculate final balances
    const balancesArray: Balance[] = [];
    
    balanceMap.forEach((balance, id) => {
      // Calculate how much they're owed (if they paid more than their share)
      const paid = balance.paid;
      const owes = balance.owes;
      
      // If they paid more than they owe, they're owed the difference
      const owed = Math.max(0, paid - owes);
      
      // If they paid less than they owe, they still owe the difference
      const stillOwes = Math.max(0, owes - paid);
      
      // Final balance is what they're owed minus what they still owe
      const finalBalance = owed - stillOwes;
      
      balancesArray.push({
        participant: balance.participant,
        paid: paid,
        owes: stillOwes,
        owed: owed,
        balance: finalBalance
      });
    });
    
    // Sort by name
    balancesArray.sort((a, b) => a.participant.name.localeCompare(b.participant.name));
    
    setBalances(balancesArray);
  };

  const calculateDetailedPayments = (
    participants: Participant[],
    expenses: Expense[],
    expenseParticipants: ExpenseParticipant[],
    payments: Payment[]
  ) => {
    // Create a map of participants by ID for easy lookup
    const participantsMap = new Map<string, Participant>();
    participants.forEach(p => participantsMap.set(p.id, p));
    
    // Create a map of expenses by ID for easy lookup
    const expensesMap = new Map<string, Expense>();
    expenses.forEach(e => expensesMap.set(e.id, e));
    
    // Create a map to track payments already made
    const paymentsMap = new Map<string, Set<string>>();
    payments.forEach(payment => {
      const key = `${payment.payer_id}-${payment.receiver_id}`;
      if (!paymentsMap.has(key)) {
        paymentsMap.set(key, new Set());
      }
      paymentsMap.get(key)?.add(payment.id);
    });
    
    // Group expense participants by expense
    const expenseParticipantsByExpense = new Map<string, ExpenseParticipant[]>();
    expenseParticipants.forEach(ep => {
      if (!expenseParticipantsByExpense.has(ep.expense_id)) {
        expenseParticipantsByExpense.set(ep.expense_id, []);
      }
      expenseParticipantsByExpense.get(ep.expense_id)?.push(ep);
    });
    
    // Calculate detailed payments
    const detailedPaymentsArray: DetailedPayment[] = [];
    
    // For each expense
    expenses.forEach(expense => {
      const payerId = expense.payer_id;
      if (!payerId) return;
      
      const payer = participantsMap.get(payerId);
      if (!payer) return;
      
      // Get participants for this expense
      const participants = expenseParticipantsByExpense.get(expense.id) || [];
      
      // For each participant who is not the payer
      participants.forEach(participant => {
        if (participant.participant_id === payerId) return;
        
        const receiver = participantsMap.get(participant.participant_id);
        if (!receiver) return;
        
        // Add a detailed payment
        detailedPaymentsArray.push({
          from_id: participant.participant_id,
          from_name: receiver.name,
          to_id: payerId,
          to_name: payer.name,
          amount: participant.amount,
          expense_id: expense.id,
          expense_description: expense.description
        });
      });
    });
    
    setDetailedPayments(detailedPaymentsArray);
    
    // Group payments by payer
    const paymentsByPayerMap = new Map<string, PaymentsByPayer>();
    
    // Initialize with all participants
    participants.forEach(participant => {
      paymentsByPayerMap.set(participant.id, {
        payer: participant,
        payments: []
      });
    });
    
    // For each expense
    expenses.forEach(expense => {
      const payerId = expense.payer_id;
      if (!payerId) return;
      
      const payer = participantsMap.get(payerId);
      if (!payer) return;
      
      // Get participants for this expense
      const participants = expenseParticipantsByExpense.get(expense.id) || [];
      
      // For each participant
      participants.forEach(participant => {
        const participantId = participant.participant_id;
        if (participantId === payerId) return; // Skip the payer
        
        const participantObj = participantsMap.get(participantId);
        if (!participantObj) return;
        
        // Check if this participant has already paid
        const paymentKey = `${participantId}-${payerId}`;
        const isPaid = paymentsMap.has(paymentKey) && paymentsMap.get(paymentKey)!.size > 0;
        
        // Get or create the payments array for this participant
        const payerPayments = paymentsByPayerMap.get(participantId);
        if (!payerPayments) return;
        
        // Find if there's already a payment to this receiver
        const existingPaymentIndex = payerPayments.payments.findIndex(p => p.receiver.id === payerId);
        
        if (existingPaymentIndex >= 0) {
          // Update existing payment
          payerPayments.payments[existingPaymentIndex].amount += participant.amount;
        } else {
          // Add new payment
          payerPayments.payments.push({
            receiver: payer,
            amount: participant.amount,
            isPaid
          });
        }
      });
    });
    
    // Convert to array and filter out participants with no payments
    const paymentsByPayerArray = Array.from(paymentsByPayerMap.values())
      .filter(p => p.payments.length > 0)
      .sort((a, b) => a.payer.name.localeCompare(b.payer.name));
    
    setPaymentsByPayer(paymentsByPayerArray);
  };

  const handleRegisterPayment = async (fromId: string, toId: string, amount: number) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('payments')
        .insert([{
          payer_id: fromId,
          receiver_id: toId,
          amount: amount,
          notes: `Pagamento de ${participants.find(p => p.id === fromId)?.name || ''} para ${participants.find(p => p.id === toId)?.name || ''}`
        }]);

      if (error) {
        console.error('Error registering payment:', error);
        alert('Erro ao registrar pagamento. Por favor, tente novamente.');
        return;
      }
      
      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error registering payment:', error);
      alert('Erro ao registrar pagamento. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Aluguel': return 'bg-blue-100 text-blue-800';
      case 'Compras': return 'bg-green-100 text-green-800';
      case 'Adicional': return 'bg-purple-100 text-purple-800';
      case 'Transporte': return 'bg-orange-100 text-orange-800';
      case 'Alimentação': return 'bg-red-100 text-red-800';
      case 'Lazer': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!carnivalId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Selecione um carnaval para ver os saldos</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <p className="text-gray-700 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="btn-primary flex items-center"
        >
          <RefreshCw size={16} className="mr-2" />
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Saldos entre Participantes</h2>
      
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setActiveTab('detailed')}
            className={`px-3 py-1 md:px-4 md:py-2 text-sm rounded-md ${
              activeTab === 'detailed' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pagamentos por Casal
          </button>
          <button 
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1 md:px-4 md:py-2 text-sm rounded-md ${
              activeTab === 'summary' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Detalhes por Despesa
          </button>
        </div>
        
        <button 
          onClick={fetchData} 
          className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm"
          disabled={isLoading}
        >
          <RefreshCw size={16} className="mr-1" />
          Atualizar Saldos
        </button>
      </div>
      
      {showSuccessMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 md:px-4 md:py-3 rounded relative mb-4 flex items-center text-sm">
          <CheckCircle className="mr-2 flex-shrink-0" size={18} />
          <span>Pagamento registrado com sucesso!</span>
        </div>
      )}
      
      {isLoading ? (
        <p className="text-center py-4">Carregando saldos...</p>
      ) : activeTab === 'detailed' ? (
        <div className="space-y-4 md:space-y-6">
          {paymentsByPayer.length === 0 ? (
            <div className="card">
              <p className="text-center py-4">Nenhum pagamento pendente.</p>
            </div>
          ) : (
            paymentsByPayer.map((payerData) => (
              <div key={payerData.payer.id} className="card p-3 md:p-6">
                <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">
                  Pagamentos de {payerData.payer.name}
                </h3>
                
                <div className="overflow-x-auto -mx-3 md:-mx-6">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="w-1/3 px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm">De</th>
                        <th className="w-1/3 px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm">Para</th>
                        <th className="w-1/6 px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm">Valor</th>
                        <th className="w-1/6 px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payerData.payments.map((payment, index) => (
                        <tr key={index} className={payment.isPaid ? "bg-gray-50" : ""}>
                          <td className="font-medium px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">{payerData.payer.name}</td>
                          <td className="font-medium px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">{payment.receiver.name}</td>
                          <td className="text-emerald-600 font-medium px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">{formatCurrency(payment.amount)}</td>
                          <td className="px-3 md:px-6 py-2 md:py-4">
                            {payment.isPaid ? (
                              <span className="inline-flex items-center text-emerald-600 text-xs md:text-sm">
                                <CheckCircle size={14} className="mr-1 flex-shrink-0" />
                                <span>Pago</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleRegisterPayment(
                                  payerData.payer.id, 
                                  payment.receiver.id, 
                                  payment.amount
                                )}
                                className="inline-flex items-center px-2 py-1 md:px-3 md:py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs md:text-sm rounded-md"
                                disabled={isLoading}
                              >
                                <CreditCard size={12} className="mr-1 flex-shrink-0" />
                                <span>Pagar</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
          
          {/* Explicação sobre os pagamentos */}
          <div className="bg-blue-50 p-3 md:p-4 rounded-lg text-blue-800 text-xs md:text-sm">
            <h4 className="font-semibold mb-2 flex items-center">
              <HelpCircle size={14} className="mr-1 flex-shrink-0" />
              Como funcionam os pagamentos?
            </h4>
            <p>
              Cada casal deve pagar diretamente para quem pagou a despesa. Por exemplo, se MARCOS/MARIA pagaram uma despesa de R$ 400,00 que deve ser dividida entre 4 casais, cada casal deve pagar R$ 100,00 para MARCOS/MARIA.
            </p>
          </div>
        </div>
      ) : (
        <div className="card p-3 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg md:text-xl font-semibold">Detalhes por Despesa</h3>
          </div>
          
          {expenses.length === 0 ? (
            <p className="text-center py-4">Nenhuma despesa registrada.</p>
          ) : (
            <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {expenses.map((expense) => {
                  const payer = participants.find(p => p.id === expense.payer_id);
                  if (!payer) return null;
                  
                  const expensePayments = detailedPayments.filter(dp => dp.expense_id === expense.id);
                  
                  return (
                    <div key={expense.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-3 md:p-4 border-b border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                          <div>
                            <h4 className="font-bold text-base md:text-lg text-gray-800">{expense.description}</h4>
                            <div className="flex flex-wrap items-center mt-1 text-xs md:text-sm text-gray-500 gap-1">
                              <Calendar size={12} className="mr-1 flex-shrink-0" />
                              <span>{new Date(expense.date).toLocaleDateString('pt-BR')}</span>
                              <span className="mx-1 hidden md:inline">•</span>
                              <div className="flex items-center mt-1 sm:mt-0">
                                <Tag size={12} className="mr-1 flex-shrink-0" />
                                <span className={`px-1 md:px-2 py-0.5 rounded-full text-xs ${getCategoryColor(expense.category)}`}>
                                  {expense.category}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-left sm:text-right mt-2 sm:mt-0">
                            <div className="text-base md:text-xl font-bold text-emerald-600">
                              {formatCurrency(expense.amount)}
                            </div>
                            <div className="text-xs md:text-sm text-gray-500 mt-1">
                              Pago por <span className="font-medium">{payer.name}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 md:p-4 bg-gray-50">
                        <h5 className="text-xs md:text-sm font-medium text-gray-700 mb-2">Divisão da Despesa</h5>
                        <div className="space-y-1 md:space-y-2">
                          {expensePayments.map((payment, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 px-2 rounded-md bg-white border border-gray-100">
                              <div className="flex items-center mb-1 sm:mb-0">
                                <span className="font-medium text-gray-700 text-xs md:text-sm">{payment.from_name}</span>
                                <ArrowRight className="mx-2 text-gray-400" size={14} />
                                <span className="font-medium text-gray-700 text-xs md:text-sm">{payment.to_name}</span>
                              </div>
                              <span className="font-medium text-emerald-600 text-xs md:text-sm">
                                {formatCurrency(payment.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
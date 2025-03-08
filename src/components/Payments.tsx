import React, { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface PaymentsProps {
  supabase: SupabaseClient<Database>;
  carnivalId?: string | null;
}

interface Participant {
  id: string;
  name: string;
}

interface Payment {
  id: string;
  payer_id: string;
  receiver_id: string;
  amount: number;
  notes: string;
  created_at: string;
  payer?: Participant;
  receiver?: Participant;
}

export const Payments: React.FC<PaymentsProps> = ({ supabase, carnivalId }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (carnivalId) {
      fetchPayments();
    }
  }, [carnivalId]);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!carnivalId) {
        setPayments([]);
        return;
      }

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          payer:payer_id(id, name),
          receiver:receiver_id(id, name)
        `)
        .eq('carnival_id', carnivalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Não foi possível carregar os pagamentos. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este pagamento?')) return;
    
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting payment:', error);
        alert('Erro ao excluir pagamento. Por favor, tente novamente.');
        return;
      }
      
      // Refresh payments list
      await fetchPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Erro ao excluir pagamento. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!carnivalId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Selecione um carnaval para ver os pagamentos</p>
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
          onClick={fetchPayments}
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
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Histórico de Pagamentos</h2>
      
      <div className="mb-4 flex justify-end">
        <button 
          onClick={fetchPayments} 
          className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm"
          disabled={isLoading}
        >
          <RefreshCw size={16} className="mr-1 flex-shrink-0" />
          Atualizar Pagamentos
        </button>
      </div>
      
      <div className="card p-3 md:p-6">
        <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Histórico de Pagamentos</h3>
        
        {isLoading ? (
          <p className="text-center py-4 text-sm">Carregando pagamentos...</p>
        ) : payments.length === 0 ? (
          <p className="text-center py-4 text-sm">Nenhum pagamento registrado.</p>
        ) : (
          <div className="overflow-x-auto -mx-3 md:-mx-6">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Data</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Pagou</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Recebeu</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Valor</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Observações</th>
                  <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Ações</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">{new Date(payment.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm font-medium">{payment.payer?.name}</td>
                    <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm font-medium">{payment.receiver?.name}</td>
                    <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm text-emerald-600 font-medium">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">{payment.notes}</td>
                    <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">
                      <button
                        onClick={() => handleDelete(payment.id)}
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
  );
};
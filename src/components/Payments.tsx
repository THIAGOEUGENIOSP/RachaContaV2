import React, { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { Trash2, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface PaymentsProps {
  supabase: SupabaseClient<Database>;
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

export const Payments: React.FC<PaymentsProps> = ({ supabase }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          payer:payer_id(id, name),
          receiver:receiver_id(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        return;
      }
      
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
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
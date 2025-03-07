import React, { useState, useEffect, useRef } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { Upload, Calendar, DollarSign, FileText, Trash2, Eye, RefreshCw, BarChart2, ChevronDown, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import Chart from 'chart.js/auto';

interface ContributionsProps {
  supabase: SupabaseClient<Database>;
}

interface Contribution {
  id: string;
  participant_id: string;
  amount: number;
  month: string;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  participant: {
    name: string;
  } | null;
}

interface ContributionTotal {
  participant_name: string;
  total_amount: number;
}

interface GroupedContributions {
  [key: string]: Contribution[];
}

export const Contributions: React.FC<ContributionsProps> = ({ supabase }) => {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [groupedContributions, setGroupedContributions] = useState<GroupedContributions>({});
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [amount, setAmount] = useState('');
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.toISOString().slice(0, 7));
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [participants, setParticipants] = useState<{ id: string; name: string; }[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [contributionTotals, setContributionTotals] = useState<ContributionTotal[]>([]);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    fetchContributions();
    fetchParticipants();

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (contributions.length > 0) {
      calculateContributionTotals();
      groupContributionsByMonth();
    }
  }, [contributions]);

  const groupContributionsByMonth = () => {
    const grouped = contributions.reduce((acc: GroupedContributions, curr) => {
      const monthKey = curr.month.substring(0, 7); // Get YYYY-MM
      if (!acc[monthKey]) {
        acc[monthKey] = [];
        // Automatically expand the most recent month
        setExpandedMonths(prev => ({
          ...prev,
          [monthKey]: true
        }));
      }
      acc[monthKey].push(curr);
      return acc;
    }, {});

    // Sort months in descending order
    const sortedGrouped: GroupedContributions = {};
    Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .forEach(key => {
        sortedGrouped[key] = grouped[key];
      });

    setGroupedContributions(sortedGrouped);
  };

  const calculateContributionTotals = () => {
    const totals = contributions.reduce((acc: Record<string, ContributionTotal>, curr) => {
      const participantName = curr.participant?.name || 'Desconhecido';
      
      if (!acc[participantName]) {
        acc[participantName] = {
          participant_name: participantName,
          total_amount: 0
        };
      }
      
      acc[participantName].total_amount += curr.amount;
      return acc;
    }, {});

    const totalsArray = Object.values(totals).sort((a, b) => b.total_amount - a.total_amount);
    setContributionTotals(totalsArray);
    updateChart(totalsArray);
  };

  const updateChart = (totals: ContributionTotal[]) => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: totals.map(t => t.participant_name),
        datasets: [{
          label: 'Total de Aportes',
          data: totals.map(t => t.total_amount),
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                return `Total: ${formatCurrency(value)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => formatCurrency(value as number)
            }
          }
        }
      }
    });
  };

  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setParticipants(data || []);
      if (data && data.length > 0 && !selectedParticipant) {
        setSelectedParticipant(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const fetchContributions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('contributions')
        .select(`
          *,
          participant:participant_id (
            name
          )
        `)
        .order('month', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContributions(data || []);
    } catch (error) {
      console.error('Error fetching contributions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedParticipant) {
      alert('Por favor, selecione um participante.');
      return;
    }

    try {
      setIsLoading(true);

      const [year, monthStr] = month.split('-');
      const formattedMonth = new Date(parseInt(year), parseInt(monthStr) - 1, 1)
        .toISOString()
        .split('T')[0];

      const { data: contribution, error: contributionError } = await supabase
        .from('contributions')
        .insert([{
          participant_id: selectedParticipant,
          amount: parseFloat(amount.replace(/\./g, '').replace(',', '.')),
          month: formattedMonth,
          notes: notes.trim() || null
        }])
        .select()
        .single();

      if (contributionError) throw contributionError;

      if (file && contribution) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${contribution.id}.${fileExt}`;
        const filePath = `contributions/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(filePath);

        const { error: updateError } = await supabase
          .from('contributions')
          .update({ receipt_url: publicUrl })
          .eq('id', contribution.id);

        if (updateError) throw updateError;
      }

      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

      setAmount('');
      setNotes('');
      setFile(null);

      fetchContributions();
    } catch (error) {
      console.error('Error adding contribution:', error);
      alert('Erro ao adicionar aporte. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este aporte?')) return;

    try {
      setIsLoading(true);

      const { data: contribution } = await supabase
        .from('contributions')
        .select('receipt_url')
        .eq('id', id)
        .single();

      if (contribution?.receipt_url) {
        const fileName = contribution.receipt_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('receipts')
            .remove([`contributions/${fileName}`]);
        }
      }

      const { error } = await supabase
        .from('contributions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchContributions();
    } catch (error) {
      console.error('Error deleting contribution:', error);
      alert('Erro ao excluir aporte. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const viewReceipt = (url: string) => {
    window.open(url, '_blank');
  };

  const formatMonthYear = (dateString: string) => {
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [month]: !prev[month]
    }));
  };

  const calculateMonthTotal = (contributions: Contribution[]): number => {
    return contributions.reduce((total, curr) => total + curr.amount, 0);
  };

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Aportes Mensais</h2>

      <div className="card p-4 md:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg md:text-xl font-semibold flex items-center">
            <BarChart2 className="mr-2" size={24} />
            Total de Aportes por Participante
          </h3>
        </div>
        <div className="h-[300px] md:h-[400px]">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-1">
          <div className="card p-3 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Registrar Aporte</h3>

            {showSuccessMessage && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                <span className="block sm:inline">Aporte registrado com sucesso!</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="participant" className="text-sm">Participante:</label>
                <select
                  id="participant"
                  value={selectedParticipant}
                  onChange={(e) => setSelectedParticipant(e.target.value)}
                  required
                  className="text-sm md:text-base"
                >
                  <option value="">Selecione um participante</option>
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="amount" className="text-sm">Valor:</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    required
                    className="pl-9 text-sm md:text-base"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="month" className="text-sm">Mês de Referência:</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="month"
                    id="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    required
                    className="pl-9 text-sm md:text-base"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="receipt" className="text-sm">Comprovante:</label>
                <div className="relative">
                  <input
                    type="file"
                    id="receipt"
                    accept="image/*,.pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="text-sm md:text-base"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes" className="text-sm">Observações:</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-sm md:text-base"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center text-sm md:text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  'Registrando...'
                ) : (
                  <>
                    <Upload size={16} className="mr-2" />
                    Registrar Aporte
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card p-3 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg md:text-xl font-semibold">Histórico de Aportes</h3>
              <button 
                onClick={fetchContributions}
                className="text-emerald-600 hover:text-emerald-700 flex items-center text-sm"
              >
                <RefreshCw size={16} className="mr-1" />
                Atualizar
              </button>
            </div>

            {isLoading && contributions.length === 0 ? (
              <p className="text-center py-4">Carregando aportes...</p>
            ) : contributions.length === 0 ? (
              <div className="text-center py-8">
                <FileText size={48} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">Nenhum aporte registrado.</p>
                <p className="text-sm text-gray-400">Registre seu primeiro aporte usando o formulário ao lado.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedContributions).map(([monthKey, monthContributions]) => {
                  const monthTotal = calculateMonthTotal(monthContributions);
                  return (
                    <div key={monthKey} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleMonth(monthKey)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          {expandedMonths[monthKey] ? (
                            <ChevronDown size={20} className="mr-2 text-gray-500" />
                          ) : (
                            <ChevronRight size={20} className="mr-2 text-gray-500" />
                          )}
                          <span className="font-medium text-gray-700">
                            {formatMonthYear(monthKey + '-01')}
                          </span>
                        </div>
                        <span className="font-medium text-emerald-600">
                          {formatCurrency(monthTotal)}
                        </span>
                      </button>

                      {expandedMonths[monthKey] && (
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead>
                              <tr>
                                <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Data</th>
                                <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Participante</th>
                                <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Valor</th>
                                <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Comprovante</th>
                                <th className="px-3 md:px-6 py-2 md:py-3 text-xs">Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {monthContributions.map((contribution) => (
                                <tr key={contribution.id}>
                                  <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">
                                    {new Date(contribution.created_at).toLocaleDateString('pt-BR')}
                                  </td>
                                  <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm font-medium">
                                    {contribution.participant?.name}
                                  </td>
                                  <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm text-emerald-600 font-medium">
                                    {formatCurrency(contribution.amount)}
                                  </td>
                                  <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">
                                    {contribution.receipt_url ? (
                                      <button
                                        onClick={() => viewReceipt(contribution.receipt_url!)}
                                        className="text-blue-500 hover:text-blue-700"
                                        title="Ver comprovante"
                                      >
                                        <Eye size={16} />
                                      </button>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">
                                    <button
                                      onClick={() => handleDelete(contribution.id)}
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
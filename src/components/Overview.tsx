import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, Users, AlertCircle, RefreshCw, Baby } from 'lucide-react';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { formatCurrency } from '../utils/formatters';
import { supabase } from '../lib/supabase';

interface OverviewProps {
  carnivalId?: string | null;
}

export const Overview: React.FC<OverviewProps> = ({ carnivalId }) => {
  const [totalAdults, setTotalAdults] = useState(0);
  const [totalChildren, setTotalChildren] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [costPerPerson, setCostPerPerson] = useState(0);
  const [amountPerCouple, setAmountPerCouple] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (carnivalId) {
      fetchDashboardData();
    }
  }, [carnivalId]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!carnivalId) {
        setTotalAdults(0);
        setTotalChildren(0);
        setTotalExpense(0);
        setCostPerPerson(0);
        setAmountPerCouple(0);
        return;
      }

      // Fetch participants for this carnival
      const { data: participantsData, error: participantsError } = await supabase
        .from('carnival_participants')
        .select(`
          participant:participant_id (
            id,
            name,
            type,
            children
          )
        `)
        .eq('carnival_id', carnivalId);

      if (participantsError) throw participantsError;

      // Calculate total adults and children
      let totalAdultsCount = 0;
      let totalChildrenCount = 0;

      participantsData.forEach(item => {
        if (item.participant) {
          // Count adults based on type (casal = 2, individual = 1)
          totalAdultsCount += item.participant.type === 'casal' ? 2 : 1;
          // Add children count
          totalChildrenCount += item.participant.children || 0;
        }
      });

      // Fetch expenses for this carnival
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('carnival_id', carnivalId);

      if (expensesError) throw expensesError;

      // Calculate total expense
      const totalExp = expenses?.reduce((acc, e) => acc + (e.amount || 0), 0) || 0;

      // Calculate cost per person and per couple
      const costPP = totalAdultsCount > 0 ? totalExp / totalAdultsCount : 0;
      const amountPC = costPP * 2;

      // Update state
      setTotalAdults(totalAdultsCount);
      setTotalChildren(totalChildrenCount);
      setTotalExpense(totalExp);
      setCostPerPerson(costPP);
      setAmountPerCouple(amountPC);

      // Update expenses chart
      if (expenses && expenses.length > 0) {
        updateExpensesChart(expenses);
      } else if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Não foi possível carregar os dados do dashboard. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateExpensesChart = (expenses: any[]) => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const expensesByCategory = expenses.reduce((acc: Record<string, number>, expense) => {
      const category = expense.category || 'Outros';
      acc[category] = (acc[category] || 0) + (expense.amount || 0);
      return acc;
    }, {});

    const sortedCategories = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, number>);

    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      const colors = [
        '#2185D0', '#F2711C', '#B5C8D8', '#FBBD08', '#21BA45',
        '#6435C9', '#A333C8', '#E03997', '#00B5AD', '#A5673F'
      ];
      
      const total = Object.values(sortedCategories).reduce((sum, value) => sum + value, 0);
      const percentages = Object.entries(sortedCategories).map(([key, value]) => ({
        category: key,
        value,
        percentage: Math.round((value / total) * 100)
      }));
      
      chartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: percentages.map(item => item.category),
          datasets: [{
            data: percentages.map(item => item.value),
            backgroundColor: colors.slice(0, percentages.length),
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverOffset: 15,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '60%',
          layout: {
            padding: 10
          },
          plugins: {
            legend: {
              position: window.innerWidth < 768 ? 'bottom' : 'right',
              labels: {
                padding: 15,
                font: {
                  size: 12,
                  family: "'Inter', sans-serif"
                },
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              titleColor: '#333',
              bodyColor: '#333',
              bodyFont: {
                size: 14,
                family: "'Inter', sans-serif"
              },
              titleFont: {
                size: 16,
                family: "'Inter', sans-serif",
                weight: '600'
              },
              padding: 12,
              boxPadding: 8,
              cornerRadius: 8,
              borderColor: 'rgba(0, 0, 0, 0.1)',
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw as number;
                  const percentage = Math.round((value / total) * 100);
                  return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                }
              }
            },
            datalabels: {
              color: '#fff',
              font: {
                weight: 'bold',
                size: 12,
                family: "'Inter', sans-serif"
              },
              formatter: (value: number) => {
                const percentage = Math.round((value / total) * 100);
                return percentage >= 5 ? `${percentage}%` : '';
              },
              textShadow: '0px 0px 2px rgba(0, 0, 0, 0.5)',
              textStrokeColor: 'rgba(0, 0, 0, 0.5)',
              textStrokeWidth: 1,
              display: function() {
                return window.innerWidth < 768 ? false : 'auto';
              }
            }
          },
          animation: {
            animateScale: true,
            animateRotate: true,
            duration: 1000,
            easing: 'easeOutQuart'
          }
        }
      });
    }
  };

  if (!carnivalId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Selecione um carnaval para ver o resumo</p>
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
          onClick={fetchDashboardData}
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
      <h2 className="text-2xl font-bold mb-6">Visão Geral</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <div className="card flex flex-col items-center justify-center p-4">
          <div className="flex items-center mb-2">
            <Users size={20} className="text-purple-500 mr-2" />
            <h3 className="text-base md:text-lg font-medium text-gray-600">Total de Adultos</h3>
          </div>
          <p className="text-xl md:text-3xl font-bold">{totalAdults} pessoas</p>
        </div>
        
        <div className="card flex flex-col items-center justify-center p-4">
          <div className="flex items-center mb-2">
            <Baby size={20} className="text-pink-500 mr-2" />
            <h3 className="text-base md:text-lg font-medium text-gray-600">Total de Crianças</h3>
          </div>
          <p className="text-xl md:text-3xl font-bold">{totalChildren} crianças</p>
        </div>
        
        <div className="card flex flex-col items-center justify-center p-4">
          <div className="flex items-center mb-2">
            <DollarSign size={20} className="text-emerald-500 mr-2" />
            <h3 className="text-base md:text-lg font-medium text-gray-600">Despesa Total</h3>
          </div>
          <p className="text-xl md:text-3xl font-bold text-emerald-600">{formatCurrency(totalExpense)}</p>
        </div>
        
        <div className="card flex flex-col items-center justify-center p-4">
          <div className="flex items-center mb-2">
            <Users size={20} className="text-orange-500 mr-2" />
            <h3 className="text-base md:text-lg font-medium text-gray-600">Valor por Casal</h3>
          </div>
          <p className="text-xl md:text-3xl font-bold text-orange-500">{formatCurrency(amountPerCouple)}</p>
        </div>
      </div>
      
      <div className="card">
        <div className="flex flex-col items-center">
          <h3 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">
            Distribuição de Despesas por Categoria
          </h3>
          <div className="chart-container w-full mx-auto" style={{ height: '300px', maxHeight: '400px', position: 'relative' }}>
            <canvas ref={chartRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};
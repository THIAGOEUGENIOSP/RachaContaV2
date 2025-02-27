import React, { useState, useEffect, useRef } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { formatCurrency } from '../utils/formatters';

interface OverviewProps {
  supabase: SupabaseClient<Database>;
}

interface ParticipantSummary {
  id: string;
  name: string;
  paid: number;
  owes: number;
  owed: number;
  balance: number;
}

export const Overview: React.FC<OverviewProps> = ({ supabase }) => {
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [costPerPerson, setCostPerPerson] = useState(0);
  const [amountPerCouple, setAmountPerCouple] = useState(0);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    fetchDashboardData();
    
    // Register the datalabels plugin
    Chart.register(ChartDataLabels);
    
    // Handle window resize for responsive chart
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      // Cleanup chart on unmount
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch participants
      const { data: participants, error: participantsError } = await supabase
        .from('participants')
        .select('*');

      if (participantsError) throw participantsError;

      // Fetch expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*');

      if (expensesError) throw expensesError;
      
      // Fetch expense participants
      const { data: expenseParticipants, error: expParticipantsError } = await supabase
        .from('expense_participants')
        .select('*');

      if (expParticipantsError) throw expParticipantsError;
      
      // Fetch payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*');

      if (paymentsError) throw paymentsError;

      // Calculate dashboard metrics
      if (participants && expenses) {
        // Calculate total adults
        const totalAdults = participants.reduce(
          (acc, p) => acc + (p.type === 'casal' ? 2 : 1),
          0
        );

        // Calculate total expense
        const totalExp = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
        
        // Calculate cost per person
        const costPP = totalAdults > 0 ? totalExp / totalAdults : 0;
        
        // Calculate amount per couple
        const amountPC = costPP * 2;

        // Update state
        setTotalParticipants(totalAdults);
        setTotalExpense(totalExp);
        setCostPerPerson(costPP);
        setAmountPerCouple(amountPC);

        // Update chart
        updateExpensesChart(expenses);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const updateExpensesChart = (expenses: any[]) => {
    if (!chartRef.current) return;

    // Group expenses by category
    const expensesByCategory = expenses.reduce((acc: Record<string, number>, expense) => {
      const category = expense.category || 'Outros';
      acc[category] = (acc[category] || 0) + (expense.amount || 0);
      return acc;
    }, {});

    // Sort categories by amount (descending)
    const sortedCategories = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, number>);

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      // Define colors to match the image
      const colors = [
        '#2185D0', // Blue
        '#F2711C', // Orange
        '#B5C8D8', // Light blue/gray
        '#FBBD08', // Yellow (fallback)
        '#21BA45', // Green (fallback)
        '#6435C9', // Purple (fallback)
        '#A333C8', // Violet (fallback)
        '#E03997', // Pink (fallback)
        '#00B5AD', // Teal (fallback)
        '#A5673F'  // Brown (fallback)
      ];
      
      // Calculate percentages for labels
      const total = Object.values(sortedCategories).reduce((sum, value) => sum + value, 0);
      const percentages = Object.entries(sortedCategories).map(([key, value]) => {
        return {
          category: key,
          value,
          percentage: Math.round((value / total) * 100)
        };
      });
      
      chartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: percentages.map(item => item.category),
          datasets: [
            {
              data: percentages.map(item => item.value),
              backgroundColor: colors.slice(0, percentages.length),
              borderColor: '#ffffff',
              borderWidth: 2,
              hoverOffset: 15,
            },
          ],
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
              formatter: (value: number, context: any) => {
                const percentage = Math.round((value / total) * 100);
                return percentage >= 5 ? `${percentage}%` : '';
              },
              textShadow: '0px 0px 2px rgba(0, 0, 0, 0.5)',
              textStrokeColor: 'rgba(0, 0, 0, 0.5)',
              textStrokeWidth: 1,
              display: function(context) {
                // Hide labels on small screens
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
        },
      });
      
      // Add center text
      const originalDraw = chartInstance.current.draw;
      chartInstance.current.draw = function() {
        originalDraw.apply(this, arguments);
        
        if (!ctx) return;
        
        const width = this.width;
        const height = this.height;
        const centerX = width / 2;
        const centerY = height / 2;
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw total amount
        ctx.font = window.innerWidth < 768 ? 'bold 14px Inter, sans-serif' : 'bold 18px Inter, sans-serif';
        ctx.fillStyle = '#333';
        ctx.fillText('Total', centerX, centerY - 12);
        
        ctx.font = window.innerWidth < 768 ? 'bold 14px Inter, sans-serif' : 'bold 16px Inter, sans-serif';
        ctx.fillStyle = '#1cc29f';
        ctx.fillText(formatCurrency(total), centerX, centerY + 12);
      };
    }
  };

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Visão Geral</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <div className="card flex flex-col items-center justify-center p-4">
          <h3 className="text-base md:text-lg font-medium text-gray-600 mb-2">Total de Participantes</h3>
          <p className="text-xl md:text-3xl font-bold">{totalParticipants} adultos</p>
        </div>
        
        <div className="card flex flex-col items-center justify-center p-4">
          <h3 className="text-base md:text-lg font-medium text-gray-600 mb-2">Despesa Total</h3>
          <p className="text-xl md:text-3xl font-bold text-emerald-600">{formatCurrency(totalExpense)}</p>
        </div>
        
        <div className="card flex flex-col items-center justify-center p-4">
          <h3 className="text-base md:text-lg font-medium text-gray-600 mb-2">Valor por Adulto</h3>
          <p className="text-xl md:text-3xl font-bold text-purple-600">{formatCurrency(costPerPerson)}</p>
        </div>
        
        <div className="card flex flex-col items-center justify-center p-4">
          <h3 className="text-base md:text-lg font-medium text-gray-600 mb-2">Valor por Casal</h3>
          <p className="text-xl md:text-3xl font-bold text-orange-500">{formatCurrency(amountPerCouple)}</p>
        </div>
      </div>
      
      <div className="card">
        <div className="flex flex-col items-center">
          <h3 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Distribuição de Despesas por Categoria</h3>
          <div className="chart-container w-full mx-auto" style={{ height: '300px', maxHeight: '400px', position: 'relative' }}>
            <canvas ref={chartRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};
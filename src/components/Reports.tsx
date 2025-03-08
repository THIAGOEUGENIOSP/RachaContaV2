import React, { useState, useEffect, useRef } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { FileText, Download, PieChart, AlertCircle, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import Chart from 'chart.js/auto';
import { jsPDF } from 'jspdf';

interface ReportsProps {
  supabase: SupabaseClient<Database>;
  carnivalId?: string | null;
}

interface ExpenseSummary {
  category: string;
  total: number;
  percentage: number;
}

export const Reports: React.FC<ReportsProps> = ({ supabase, carnivalId }) => {
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (carnivalId) {
      fetchReportData();
    }
  }, [carnivalId]);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!carnivalId) {
        setExpenseSummary([]);
        setTotalExpense(0);
        return;
      }

      // Fetch expenses for this carnival
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('carnival_id', carnivalId);

      if (error) throw error;
      
      if (expenses && expenses.length > 0) {
        // Calculate total expense
        const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        setTotalExpense(total);
        
        // Group expenses by category
        const expensesByCategory = expenses.reduce((acc, expense) => {
          const category = expense.category || 'Outros';
          acc[category] = (acc[category] || 0) + expense.amount;
          return acc;
        }, {} as Record<string, number>);
        
        // Create summary array
        const summary = Object.entries(expensesByCategory).map(([category, amount]) => ({
          category,
          total: amount,
          percentage: (amount / total) * 100
        }));
        
        // Sort by total amount (descending)
        summary.sort((a, b) => b.total - a.total);
        
        setExpenseSummary(summary);
        
        // Update chart
        updateChart(summary);
      } else {
        setExpenseSummary([]);
        setTotalExpense(0);
        if (chartInstance.current) {
          chartInstance.current.destroy();
          chartInstance.current = null;
        }
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError('Não foi possível carregar os dados do relatório. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateChart = (summary: ExpenseSummary[]) => {
    if (!chartRef.current) return;
    
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: summary.map(item => item.category),
          datasets: [
            {
              data: summary.map(item => item.total),
              backgroundColor: [
                '#1cc29f',
                '#8656cd',
                '#ff652f',
                '#ffb700',
                '#4c6ef5',
                '#fa5252',
                '#40c057',
                '#339af0',
                '#f06595',
                '#845ef7'
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'right',
            },
            title: {
              display: true,
              text: 'Distribuição de Despesas por Categoria',
              font: {
                size: 16,
              },
            },
          },
        },
      });
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Relatório de Despesas', 105, 15, { align: 'center' });
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 25, { align: 'center' });
    
    // Add total
    doc.setFontSize(14);
    doc.text(`Despesa Total: ${formatCurrency(totalExpense)}`, 105, 35, { align: 'center' });
    
    // Add table header
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Categoria', 20, 50);
    doc.text('Valor', 100, 50);
    doc.text('Percentual', 150, 50);
    
    // Add line
    doc.setDrawColor(200);
    doc.line(20, 53, 190, 53);
    
    // Add table data
    doc.setTextColor(0);
    let y = 60;
    
    expenseSummary.forEach((item, index) => {
      doc.text(item.category, 20, y);
      doc.text(formatCurrency(item.total), 100, y);
      doc.text(`${item.percentage.toFixed(2)}%`, 150, y);
      y += 10;
      
      // Add new page if needed
      if (y > 280 && index < expenseSummary.length - 1) {
        doc.addPage();
        y = 20;
        
        // Add table header on new page
        doc.setTextColor(100);
        doc.text('Categoria', 20, y);
        doc.text('Valor', 100, y);
        doc.text('Percentual', 150, y);
        
        // Add line
        doc.line(20, y + 3, 190, y + 3);
        
        doc.setTextColor(0);
        y += 10;
      }
    });
    
    // Save the PDF
    doc.save('relatorio-despesas.pdf');
  };

  const exportToCSV = () => {
    // Create CSV content
    const headers = ['Categoria', 'Valor', 'Percentual'];
    const rows = expenseSummary.map(item => [
      item.category,
      formatCurrency(item.total),
      `${item.percentage.toFixed(2)}%`
    ]);
    
    // Add total row
    rows.push(['Total', formatCurrency(totalExpense), '100.00%']);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'relatorio-despesas.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!carnivalId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Selecione um carnaval para ver os relatórios</p>
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
          onClick={fetchReportData}
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
      <h2 className="text-2xl font-bold mb-6">Relatórios</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Exportar Relatórios</h3>
            
            <div className="space-y-4">
              <button
                onClick={exportToPDF}
                className="btn-primary w-full flex items-center justify-center"
                disabled={isLoading || expenseSummary.length === 0}
              >
                <FileText size={18} className="mr-2" />
                Exportar como PDF
              </button>
              
              <button
                onClick={exportToCSV}
                className="btn-secondary w-full flex items-center justify-center"
                disabled={isLoading || expenseSummary.length === 0}
              >
                <Download size={18} className="mr-2" />
                Exportar como CSV
              </button>
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium text-gray-700 mb-2">Resumo</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Total de Despesas:</span>
                  <span className="font-bold">{formatCurrency(totalExpense)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Categorias:</span>
                  <span className="font-bold">{expenseSummary.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Despesas por Categoria</h3>
            
            {isLoading ? (
              <p className="text-center py-4">Carregando dados...</p>
            ) : expenseSummary.length === 0 ? (
              <div className="text-center py-8">
                <PieChart size={48} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">Nenhuma despesa registrada.</p>
                <p className="text-sm text-gray-400">Adicione despesas para gerar relatórios.</p>
              </div>
            ) : (
              <div>
                <div className="chart-container mb-6" style={{ height: '300px' }}>
                  <canvas ref={chartRef}></canvas>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th>Categoria</th>
                        <th>Valor</th>
                        <th>Percentual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenseSummary.map((item, index) => (
                        <tr key={index}>
                          <td className="font-medium">{item.category}</td>
                          <td className="text-emerald-600">
                            {formatCurrency(item.total)}
                          </td>
                          <td>{item.percentage.toFixed(2)}%</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold">
                        <td>Total</td>
                        <td className="text-emerald-600">
                          {formatCurrency(totalExpense)}
                        </td>
                        <td>100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
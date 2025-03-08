import React from 'react';
import { 
  Home, 
  Users, 
  DollarSign, 
  BarChart2, 
  CreditCard, 
  ShoppingCart, 
  FileText
} from 'lucide-react';

interface CarnivalMenuProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  carnivalName?: string;
}

export const CarnivalMenu: React.FC<CarnivalMenuProps> = ({ 
  activeSection, 
  onSectionChange,
  carnivalName = 'Carnaval 2025'
}) => {
  const menuItems = [
    { id: 'overview', label: 'Visão Geral', icon: <Home size={20} /> },
    { id: 'participants', label: 'Participantes', icon: <Users size={20} /> },
    { id: 'expenses', label: 'Despesas', icon: <DollarSign size={20} /> },
    { id: 'balances', label: 'Saldos', icon: <BarChart2 size={20} /> },
    { id: 'payments', label: 'Histórico de Pagamentos', icon: <CreditCard size={20} /> },
    { id: 'shopping-list', label: 'Lista de Compras', icon: <ShoppingCart size={20} /> },
    { id: 'reports', label: 'Relatórios', icon: <FileText size={20} /> },
  ];

  return (
    <div className="space-y-4 mb-6">
      <div className="bg-white shadow-md rounded-lg p-4">
        <h1 className="text-2xl font-bold text-emerald-600 text-center">{carnivalName}</h1>
      </div>
      
      <div className="bg-white shadow-md rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 p-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors ${
                activeSection === item.id
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="mb-2">{item.icon}</span>
              <span className="text-xs text-center">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  DollarSign, 
  BarChart2, 
  CreditCard, 
  ShoppingCart, 
  FileText,
  Upload,
  Menu,
  X
} from 'lucide-react';

interface SideMenuProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ activeSection, setActiveSection }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const menuItems = [
    { id: 'overview', label: 'Visão Geral', icon: <Home size={20} /> },
    { id: 'participants', label: 'Participantes', icon: <Users size={20} /> },
    { id: 'expenses', label: 'Despesas', icon: <DollarSign size={20} /> },
    { id: 'balances', label: 'Saldos', icon: <BarChart2 size={20} /> },
    { id: 'payments', label: 'Histórico de Pagamentos', icon: <CreditCard size={20} /> },
    { id: 'contributions', label: 'Aportes Mensais', icon: <Upload size={20} /> },
    { id: 'shopping-list', label: 'Lista de Compras', icon: <ShoppingCart size={20} /> },
    { id: 'reports', label: 'Relatórios', icon: <FileText size={20} /> },
  ];

  const handleMenuItemClick = (sectionId: string) => {
    setActiveSection(sectionId);
    setMenuOpen(false);
  };

  return (
    <>
      {/* Mobile menu toggle button - only visible on small screens */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="bg-white p-2 rounded-md shadow-md text-emerald-600"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Overlay for mobile menu */}
      {menuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}
      
      {/* Side menu - transforms to full width on mobile when open */}
      <div className={`
        bg-white shadow-md h-full
        md:w-64 md:relative md:block
        fixed top-0 left-0 z-20 w-64 transition-transform duration-300 ease-in-out
        ${menuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-bold text-emerald-600">🎭 Carnaval 2025</h1>
            <h2 className="text-lg font-medium text-emerald-500">RachaConta</h2>
          </div>
        </div>
        
        <nav className="mt-4">
          <ul>
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuItemClick(item.id)}
                  className={`flex items-center w-full px-4 py-3 text-left ${
                    activeSection === item.id
                      ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};
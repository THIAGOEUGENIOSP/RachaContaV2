import React, { useState } from 'react';
import { 
  Calendar,
  Upload,
  Users,
  Menu,
  X
} from 'lucide-react';

interface SideMenuProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ activeSection, setActiveSection }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuItemClick = (sectionId: string) => {
    setActiveSection(sectionId);
    setMenuOpen(false);
  };

  return (
    <>
      <div className="md:hidden fixed top-4 left-4 z-30">
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="bg-white p-2 rounded-md shadow-md text-emerald-600"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {menuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}
      
      <div className={`
        bg-white shadow-md h-full flex flex-col
        md:w-64 md:relative md:block
        fixed top-0 left-0 z-20 w-64 transition-transform duration-300 ease-in-out
        ${menuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-bold text-emerald-600">🎭 RachaConta</h1>
          </div>
        </div>
        
        <nav className="flex-1 mt-4">
          <ul>
            <li>
              <button
                onClick={() => handleMenuItemClick('carnivals')}
                className={`flex items-center w-full px-4 py-3 text-left ${
                  activeSection === 'carnivals'
                    ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="mr-3"><Calendar size={20} /></span>
                Carnavais
              </button>
            </li>
            <li>
              <button
                onClick={() => handleMenuItemClick('contributions')}
                className={`flex items-center w-full px-4 py-3 text-left ${
                  activeSection === 'contributions'
                    ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="mr-3"><Upload size={20} /></span>
                Aportes Mensais
              </button>
            </li>
            <li>
              <button
                onClick={() => handleMenuItemClick('registered-participants')}
                className={`flex items-center w-full px-4 py-3 text-left ${
                  activeSection === 'registered-participants'
                    ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="mr-3"><Users size={20} /></span>
                Participantes Cadastrados
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};
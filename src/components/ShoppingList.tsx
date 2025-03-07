import React, { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { Trash2, Plus, Check, ShoppingBag, ChevronDown, ChevronRight, Search, AlertCircle } from 'lucide-react';

interface ShoppingListProps {
  supabase: SupabaseClient<Database>;
}

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  completed: boolean;
  created_at?: string;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ supabase }) => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [category, setCategory] = useState('alimentos');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    alimentos: true,
    bebidas: true,
    limpeza: true,
    higiene: true,
    outros: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<ShoppingItem[]>([]);

  useEffect(() => {
    fetchItems();
  }, []);

  // Atualizar itens filtrados quando os itens ou o termo de busca mudam
  useEffect(() => {
    filterItems();
  }, [items, searchTerm]);

  // Expandir categorias que contêm itens filtrados
  useEffect(() => {
    if (searchTerm.trim()) {
      const groupedItems = filteredItems.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, ShoppingItem[]>);
      
      const categoriesToExpand = Object.keys(groupedItems);
      const newExpandedState = { ...expandedCategories };
      
      categoriesToExpand.forEach(category => {
        newExpandedState[category] = true;
      });
      
      setExpandedCategories(newExpandedState);
    }
  }, [filteredItems, searchTerm]);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('shopping_list')
        .select('*')
        .order('completed', { ascending: true }) // Uncompleted items first
        .order('created_at', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching shopping list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Por favor, insira um nome para o item.');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('shopping_list')
        .insert([{
          name,
          quantity,
          category,
          completed: false
        }]);

      if (error) throw error;
      
      // Reset form
      setName('');
      setQuantity(1);
      
      // Refresh items list
      fetchItems();
      
      // Ensure the category is expanded when adding a new item
      setExpandedCategories(prev => ({
        ...prev,
        [category]: true
      }));
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Erro ao adicionar item. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItemStatus = async (id: string, completed: boolean) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('shopping_list')
        .update({ completed: !completed })
        .eq('id', id);

      if (error) throw error;
      
      // Refresh items list
      fetchItems();
    } catch (error) {
      console.error('Error updating item status:', error);
      alert('Erro ao atualizar status do item. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('shopping_list')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh items list
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Erro ao excluir item. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Função para normalizar texto (remover acentos)
  const normalizeText = (text: string): string => {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };

  // Filtrar itens com base no termo de busca
  const filterItems = () => {
    if (!searchTerm.trim()) {
      setFilteredItems(items);
      return;
    }
    
    const normalizedSearchTerm = normalizeText(searchTerm);
    
    const filtered = items.filter(item => {
      const normalizedName = normalizeText(item.name);
      
      // Busca por iniciais, palavras contidas, letras finais
      return (
        normalizedName.startsWith(normalizedSearchTerm) || // Iniciais
        normalizedName.includes(normalizedSearchTerm) ||   // Contém a palavra/letras
        normalizedName.endsWith(normalizedSearchTerm)      // Letras finais
      );
    });
    
    setFilteredItems(filtered);
  };

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Lista de Compras</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-1">
          <div className="card p-3 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Adicionar Item</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name" className="text-sm">Nome do Item:</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="text-sm md:text-base"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="quantity" className="text-sm">Quantidade:</label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  required
                  className="text-sm md:text-base"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category" className="text-sm">Categoria:</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="text-sm md:text-base"
                >
                  <option value="alimentos">Alimentos</option>
                  <option value="bebidas">Bebidas</option>
                  <option value="limpeza">Produtos de Limpeza</option>
                  <option value="higiene">Higiene Pessoal</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
              
              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center text-sm md:text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  'Adicionando...'
                ) : (
                  <>
                    <Plus size={16} className="mr-2 flex-shrink-0" />
                    Adicionar Item
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="card p-3 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg md:text-xl font-semibold">Itens para Comprar</h3>
              <div className="text-xs md:text-sm text-gray-500">
                {filteredItems.filter(i => !i.completed).length} itens pendentes
              </div>
            </div>
            
            {/* Campo de busca */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar itens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
            
            {isLoading && items.length === 0 ? (
              <p className="text-center py-4 text-sm">Carregando itens...</p>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8">
                {items.length === 0 ? (
                  <>
                    <ShoppingBag size={48} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">Sua lista de compras está vazia.</p>
                    <p className="text-sm text-gray-400">Adicione itens para começar.</p>
                  </>
                ) : (
                  <>
                    <Search size={48} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">Nenhum item encontrado para "{searchTerm}"</p>
                    <p className="text-sm text-gray-400">Tente outro termo de busca.</p>
                  </>
                )}
              </div>
            ) : (
              <div>
                {Object.keys(groupedItems).map((category) => {
                  const pendingItems = groupedItems[category].filter(item => !item.completed).length;
                  return (
                    <div key={category} className="mb-4">
                      <button 
                        onClick={() => toggleCategory(category)}
                        className={`w-full flex items-center justify-between font-medium p-3 rounded mb-2 transition-colors ${
                          pendingItems > 0
                            ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span className="flex items-center">
                          {pendingItems > 0 && (
                            <AlertCircle size={16} className="text-red-500 mr-2" />
                          )}
                          {formatCategory(category)}
                        </span>
                        <span className="flex items-center">
                          <span className={`mr-2 text-sm ${
                            pendingItems > 0 ? 'text-red-500 font-semibold' : 'text-gray-500'
                          }`}>
                            {pendingItems} pendentes
                          </span>
                          {expandedCategories[category] ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </span>
                      </button>
                      
                      {expandedCategories[category] && (
                        <div className="space-y-2 pl-2">
                          {groupedItems[category]
                            .sort((a, b) => {
                              // Sort by completion status first (incomplete items first)
                              if (a.completed !== b.completed) {
                                return a.completed ? 1 : -1;
                              }
                              // Then by creation date
                              return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
                            })
                            .map((item) => (
                              <div 
                                key={item.id} 
                                className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                                  item.completed 
                                    ? 'bg-gray-50 border border-gray-200 text-gray-500' 
                                    : 'bg-white border-2 border-emerald-500 shadow-lg hover:shadow-emerald-100'
                                }`}
                              >
                                <button
                                  onClick={() => toggleItemStatus(item.id, item.completed)}
                                  className={`mr-3 p-1.5 rounded-full transition-colors ${
                                    item.completed 
                                      ? 'bg-emerald-100 text-emerald-500' 
                                      : 'bg-emerald-100 text-emerald-500 hover:bg-emerald-200'
                                  }`}
                                  title={item.completed ? "Marcar como não comprado" : "Marcar como comprado"}
                                >
                                  <Check size={18} />
                                </button>
                                
                                <div className={`flex-1 ${item.completed ? 'line-through' : 'font-medium'}`}>
                                  <div className={item.completed ? 'text-gray-500' : 'text-emerald-700'}>
                                    {item.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Quantidade: {item.quantity}
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="Excluir"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
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

function formatCategory(category: string): string {
  switch (category) {
    case 'alimentos':
      return 'Alimentos';
    case 'bebidas':
      return 'Bebidas';
    case 'limpeza':
      return 'Produtos de Limpeza';
    case 'higiene':
      return 'Higiene Pessoal';
    case 'outros':
      return 'Outros';
    default:
      return category.charAt(0).toUpperCase() + category.slice(1);
  }
}
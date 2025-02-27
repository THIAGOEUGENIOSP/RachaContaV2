import React, { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { Trash2, Plus, Check, ShoppingBag, ChevronDown, ChevronRight } from 'lucide-react';

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

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('shopping_list')
        .select('*')
        .order('category', { ascending: true })
        .order('completed', { ascending: true })
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

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Lista de Compras</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Adicionar Item</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Nome do Item:</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="quantity">Quantidade:</label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Categoria:</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
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
                className="btn-primary w-full flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  'Adicionando...'
                ) : (
                  <>
                    <Plus size={18} className="mr-2" />
                    Adicionar Item
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Itens para Comprar</h3>
              <div className="text-sm text-gray-500">
                {items.filter(i => !i.completed).length} itens pendentes
              </div>
            </div>
            
            {isLoading && items.length === 0 ? (
              <p className="text-center py-4">Carregando itens...</p>
            ) : items.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag size={48} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">Sua lista de compras está vazia.</p>
                <p className="text-sm text-gray-400">Adicione itens para começar.</p>
              </div>
            ) : (
              <div>
                {Object.keys(groupedItems).map((category) => (
                  <div key={category} className="mb-4">
                    <button 
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between font-medium text-gray-700 bg-gray-100 p-3 rounded mb-2 hover:bg-gray-200 transition-colors"
                    >
                      <span>{formatCategory(category)}</span>
                      <span className="flex items-center">
                        <span className="mr-2 text-sm text-gray-500">
                          {groupedItems[category].length} itens
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
                        {groupedItems[category].map((item) => (
                          <div 
                            key={item.id} 
                            className={`flex items-center p-3 rounded-lg border ${
                              item.completed 
                                ? 'bg-gray-50 border-gray-200 text-gray-500' 
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <button
                              onClick={() => toggleItemStatus(item.id, item.completed)}
                              className={`mr-3 p-1 rounded-full ${
                                item.completed 
                                  ? 'bg-emerald-100 text-emerald-500' 
                                  : 'bg-gray-100 text-gray-400 hover:bg-emerald-50 hover:text-emerald-500'
                              }`}
                              title={item.completed ? "Marcar como não comprado" : "Marcar como comprado"}
                            >
                              <Check size={16} />
                            </button>
                            
                            <div className={`flex-1 ${item.completed ? 'line-through' : ''}`}>
                              <div className="font-medium">{item.name}</div>
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
                ))}
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
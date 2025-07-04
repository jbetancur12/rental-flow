
import { Bell, Search, Plus } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  title: string;
  onNewItem?: () => void;
  newItemLabel?: string;
  showSearch?: boolean; 
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  isNewItemDisabled?: boolean; 
}

export function Header({ title, onNewItem, newItemLabel, showSearch = false, onSearchChange, searchPlaceholder = 'Buscar...', isNewItemDisabled = false }: HeaderProps) {
  const [query, setQuery] = useState('');
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };
  
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
         {showSearch && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={query}
              onChange={handleInputChange}
              className="w-64 pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
          <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          {onNewItem && (
            <button
              onClick={onNewItem}
              disabled={isNewItemDisabled}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 mr-2" />
              {newItemLabel}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

import { Bell, Search, Plus, Menu } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  title: string;
  onNewItem?: () => void;
  newItemLabel?: string;
  showSearch?: boolean; 
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  isNewItemDisabled?: boolean; 
  showMenuButton?: boolean;
  onMenuClick?: () => void;
  subtitle?: string;
  searchValue?: string;
}

export function Header({ title, onNewItem, newItemLabel, showSearch = false, onSearchChange, searchPlaceholder = 'Buscar...', isNewItemDisabled = false, showMenuButton, onMenuClick, subtitle, searchValue }: HeaderProps) {
  return (
    <div className={`mb-8 w-full px-4 sm:px-0 mt-2 ${showMenuButton ? 'pl-12' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
        {/* Fila principal: título, campana, botón y buscador (en desktop) */}
        <div className="flex flex-col sm:flex-row sm:items-center w-full gap-2">
          <div className="flex items-center w-full sm:w-auto">
            {showMenuButton && (
              <button
                onClick={onMenuClick}
                className="mr-4 p-2 rounded-lg bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Abrir menú"
              >
                <Menu className="w-7 h-7" />
              </button>
            )}
            <h1 className="text-2xl font-bold text-slate-900 mr-4 whitespace-nowrap">{title}</h1>
            {subtitle && <span className="text-slate-500 text-base font-normal">{subtitle}</span>}
            {/* Aquí la campana si existe */}
            {onNewItem && newItemLabel && (
              <button
                onClick={onNewItem}
                disabled={isNewItemDisabled}
                className="inline-flex items-center justify-center px-3 sm:px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold text-base hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto w-auto"
                aria-label={newItemLabel}
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline ml-2">{newItemLabel}</span>
              </button>
            )}
          </div>
          {/* Buscador: en móvil (flex-col) va debajo, en desktop (flex-row) va a la derecha */}
          {showSearch && (
            <div className="relative w-full sm:w-80 mt-2 sm:mt-0 sm:ml-4">
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={e => onSearchChange?.(e.target.value)}
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
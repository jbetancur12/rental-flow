import { BarChart3, Building2, Users, CreditCard, Settings } from 'lucide-react';

interface SuperAdminTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'overview', label: 'Resumen', icon: BarChart3 },
  { id: 'organizations', label: 'Organizaciones', icon: Building2 },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'billing', label: 'Facturación', icon: CreditCard },
  { id: 'settings', label: 'Configuración', icon: Settings }
];

export function SuperAdminTabs({ activeTab, onTabChange }: SuperAdminTabsProps) {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="px-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <tab.icon className="w-5 h-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
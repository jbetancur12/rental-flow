import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'emerald' | 'blue' | 'purple' | 'orange';
}

const colorClasses = {
  emerald: 'text-emerald-600',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  orange: 'text-orange-600'
};

export function KPICard({ title, value, subtitle, icon: Icon, color }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">{title}</p>
          <p className={`text-2xl font-bold ${colorClasses[color]}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className={`text-xs mt-1 ${colorClasses[color]}`}>
              {subtitle}
            </p>
          )}
        </div>
        <Icon className={`w-8 h-8 ${colorClasses[color]}`} />
      </div>
    </div>
  );
}
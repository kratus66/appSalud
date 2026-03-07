import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'primary' | 'medical' | 'warning' | 'danger';
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({
  title,
  value,
  icon: Icon,
  color = 'primary',
  subtitle,
  trend,
}: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary-500 text-primary-50',
    medical: 'bg-medical-500 text-medical-50',
    warning: 'bg-yellow-500 text-yellow-50',
    danger: 'bg-danger-500 text-danger-50',
  };

  return (
    <div className="card-stat group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          {trend && (
            <div className="mt-2 flex items-center space-x-1">
              <span
                className={clsx(
                  'text-xs font-semibold',
                  trend.isPositive ? 'text-medical-600' : 'text-danger-600'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">vs mes anterior</span>
            </div>
          )}
        </div>
        <div
          className={clsx(
            'w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110',
            colorClasses[color]
          )}
        >
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </div>
  );
}

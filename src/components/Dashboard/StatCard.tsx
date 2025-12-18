import { Card } from '../UI';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
  color: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color,
  onClick,
}: StatCardProps) {
  return (
    <Card
      className={`p-6 border-l-4 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 ${color}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-${color.split('-')[1]}-50 rounded-xl`}>
          <Icon size={24} className={`text-${color.split('-')[1]}-600`} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}
          >
            {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span className="text-sm font-semibold">{trendValue}</span>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
    </Card>
  );
}

export default StatCard;

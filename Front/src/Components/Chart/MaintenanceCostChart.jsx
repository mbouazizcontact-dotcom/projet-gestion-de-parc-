import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const data = [
  { name: 'Pièces détachées', value: 45000, color: '#4F46E5' },
  { name: 'Main d\'œuvre', value: 30000, color: '#10B981' },
  { name: 'Outillage', value: 15000, color: '#F59E0B' },
  { name: 'Transport', value: 8000, color: '#EF4444' },
  { name: 'Autres', value: 5000, color: '#6B7280' }
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const item = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{item.name}</p>
        <div className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-gray-600 dark:text-gray-300">Montant:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(item.value)}
          </span>
        </div>
        <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {((item.value / total) * 100).toFixed(1)}% du total
        </div>
      </div>
    );
  }
  return null;
};

const MaintenanceCostChart = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
        Répartition des coûts de maintenance
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              innerRadius={60}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              align="center"
              layout="horizontal"
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MaintenanceCostChart; 
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const data = [
  { mois: 'Jan', revenus: 45000, dépenses: 30000, bénéfices: 15000 },
  { mois: 'Fév', revenus: 52000, dépenses: 32000, bénéfices: 20000 },
  { mois: 'Mar', revenus: 48000, dépenses: 28000, bénéfices: 20000 },
  { mois: 'Avr', revenus: 55000, dépenses: 35000, bénéfices: 20000 },
  { mois: 'Mai', revenus: 60000, dépenses: 40000, bénéfices: 20000 },
  { mois: 'Jun', revenus: 65000, dépenses: 42000, bénéfices: 23000 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 dark:text-gray-300">{entry.name}:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const AreaChartComponent = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
        Évolution financière
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorBenefices" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="mois"
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
            />
            <YAxis
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenus"
              name="Revenus"
              stroke="#4F46E5"
              fillOpacity={1}
              fill="url(#colorRevenus)"
            />
            <Area
              type="monotone"
              dataKey="dépenses"
              name="Dépenses"
              stroke="#EF4444"
              fillOpacity={1}
              fill="url(#colorDepenses)"
            />
            <Area
              type="monotone"
              dataKey="bénéfices"
              name="Bénéfices"
              stroke="#10B981"
              fillOpacity={1}
              fill="url(#colorBenefices)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AreaChartComponent; 
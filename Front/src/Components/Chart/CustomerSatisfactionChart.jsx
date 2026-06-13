import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const data = [
  { mois: 'Jan', satisfaction: 4.2, fidélité: 3.8, recommandation: 4.0 },
  { mois: 'Fév', satisfaction: 4.3, fidélité: 3.9, recommandation: 4.1 },
  { mois: 'Mar', satisfaction: 4.4, fidélité: 4.0, recommandation: 4.2 },
  { mois: 'Avr', satisfaction: 4.5, fidélité: 4.1, recommandation: 4.3 },
  { mois: 'Mai', satisfaction: 4.6, fidélité: 4.2, recommandation: 4.4 },
  { mois: 'Jun', satisfaction: 4.7, fidélité: 4.3, recommandation: 4.5 }
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
              {entry.value}/5
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomerSatisfactionChart = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
        Satisfaction des clients
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="mois"
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
            />
            <YAxis
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
              domain={[0, 5]}
              tickCount={6}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="satisfaction"
              name="Satisfaction"
              stroke="#4F46E5"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="fidélité"
              name="Fidélité"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="recommandation"
              name="Recommandation"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CustomerSatisfactionChart; 
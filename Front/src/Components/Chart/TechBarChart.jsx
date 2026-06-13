import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const data = [
  {
    marque: 'Renault',
    réparations: 45,
    maintenance: 30,
    diagnostics: 25,
    pièces: 40
  },
  {
    marque: 'Peugeot',
    réparations: 35,
    maintenance: 25,
    diagnostics: 20,
    pièces: 30
  },
  {
    marque: 'Citroën',
    réparations: 30,
    maintenance: 20,
    diagnostics: 15,
    pièces: 25
  },
  {
    marque: 'Toyota',
    réparations: 40,
    maintenance: 35,
    diagnostics: 30,
    pièces: 45
  },
  {
    marque: 'Volkswagen',
    réparations: 38,
    maintenance: 28,
    diagnostics: 22,
    pièces: 35
  }
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
              {entry.value} interventions
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const TechBarChart = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
        Statistiques par marque
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="marque"
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
            />
            <YAxis
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="réparations"
              name="Réparations"
              fill="#4F46E5"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="maintenance"
              name="Maintenance"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="diagnostics"
              name="Diagnostics"
              fill="#F59E0B"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="pièces"
              name="Pièces"
              fill="#EF4444"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TechBarChart; 
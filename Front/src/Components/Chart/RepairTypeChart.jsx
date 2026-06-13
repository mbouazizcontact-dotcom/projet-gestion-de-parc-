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
    mécanique: 25,
    électrique: 15,
    carrosserie: 10,
    pneumatique: 8,
    autres: 5
  },
  {
    marque: 'Peugeot',
    mécanique: 20,
    électrique: 12,
    carrosserie: 8,
    pneumatique: 6,
    autres: 4
  },
  {
    marque: 'Citroën',
    mécanique: 18,
    électrique: 10,
    carrosserie: 7,
    pneumatique: 5,
    autres: 3
  },
  {
    marque: 'Toyota',
    mécanique: 22,
    électrique: 14,
    carrosserie: 9,
    pneumatique: 7,
    autres: 4
  },
  {
    marque: 'Volkswagen',
    mécanique: 21,
    électrique: 13,
    carrosserie: 8,
    pneumatique: 6,
    autres: 4
  }
];

const COLORS = {
  mécanique: '#4F46E5',
  électrique: '#10B981',
  carrosserie: '#F59E0B',
  pneumatique: '#EF4444',
  autres: '#6B7280'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, entry) => sum + entry.value, 0);
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
              {entry.value} ({((entry.value / total) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Total: {total} interventions
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const RepairTypeChart = () => {
  return (
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
            label={{ value: 'Nombre d\'interventions', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="mécanique" name="Mécanique" stackId="a" fill={COLORS.mécanique} />
          <Bar dataKey="électrique" name="Électrique" stackId="a" fill={COLORS.électrique} />
          <Bar dataKey="carrosserie" name="Carrosserie" stackId="a" fill={COLORS.carrosserie} />
          <Bar dataKey="pneumatique" name="Pneumatique" stackId="a" fill={COLORS.pneumatique} />
          <Bar dataKey="autres" name="Autres" stackId="a" fill={COLORS.autres} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RepairTypeChart; 
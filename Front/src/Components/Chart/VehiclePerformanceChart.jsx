import React from 'react';
import {
  ComposedChart,
  Line,
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
    mois: 'Jan',
    maintenance: 85,
    réparations: 92,
    diagnostic: 88,
    coût: 4500
  },
  {
    mois: 'Fév',
    maintenance: 88,
    réparations: 90,
    diagnostic: 85,
    coût: 4200
  },
  {
    mois: 'Mar',
    maintenance: 90,
    réparations: 93,
    diagnostic: 89,
    coût: 4800
  },
  {
    mois: 'Avr',
    maintenance: 87,
    réparations: 91,
    diagnostic: 86,
    coût: 4600
  },
  {
    mois: 'Mai',
    maintenance: 92,
    réparations: 94,
    diagnostic: 90,
    coût: 5000
  },
  {
    mois: 'Jun',
    maintenance: 89,
    réparations: 92,
    diagnostic: 88,
    coût: 4700
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
              {entry.name === 'coût' 
                ? `${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(entry.value)}`
                : `${entry.value}%`}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const VehiclePerformanceChart = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
        Performance et coûts des véhicules
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="mois"
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
            />
            <YAxis
              yAxisId="left"
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
              domain={[80, 100]}
              tickCount={5}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              yAxisId="right"
              dataKey="coût"
              name="Coût (TND)"
              fill="#4F46E5"
              fillOpacity={0.6}
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="maintenance"
              name="Maintenance"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="réparations"
              name="Réparations"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="diagnostic"
              name="Diagnostic"
              stroke="#EF4444"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VehiclePerformanceChart; 
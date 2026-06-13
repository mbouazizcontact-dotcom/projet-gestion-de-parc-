import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

const data = [
  {
    technicien: 'Ahmed',
    rapidité: 85,
    qualité: 90,
    satisfaction: 88,
    expertise: 92,
    efficacité: 87
  },
  {
    technicien: 'Mohamed',
    rapidité: 78,
    qualité: 85,
    satisfaction: 82,
    expertise: 88,
    efficacité: 83
  },
  {
    technicien: 'Sami',
    rapidité: 92,
    qualité: 88,
    satisfaction: 90,
    expertise: 85,
    efficacité: 89
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
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const TechnicianEfficiencyChart = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
        Efficacité des techniciens
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart outerRadius={90} data={data}>
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis
              dataKey="technicien"
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
            />
            <Radar
              name="Ahmed"
              dataKey="rapidité"
              stroke="#4F46E5"
              fill="#4F46E5"
              fillOpacity={0.6}
            />
            <Radar
              name="Mohamed"
              dataKey="qualité"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={0.6}
            />
            <Radar
              name="Sami"
              dataKey="satisfaction"
              stroke="#F59E0B"
              fill="#F59E0B"
              fillOpacity={0.6}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TechnicianEfficiencyChart; 
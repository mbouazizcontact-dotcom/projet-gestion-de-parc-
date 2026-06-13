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
    efficacité: 80
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

const COLORS = {
  Ahmed: '#4F46E5',
  Mohamed: '#10B981',
  Sami: '#F59E0B'
};

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

const TechnicianPerformanceChart = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
        Performance des techniciens
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius="80%"
            data={data}
          >
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis
              dataKey="technicien"
              tick={{ fill: '#6B7280' }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: '#6B7280' }}
            />
            <Radar
              name="Rapidité"
              dataKey="rapidité"
              stroke={COLORS.Ahmed}
              fill={COLORS.Ahmed}
              fillOpacity={0.3}
            />
            <Radar
              name="Qualité"
              dataKey="qualité"
              stroke={COLORS.Mohamed}
              fill={COLORS.Mohamed}
              fillOpacity={0.3}
            />
            <Radar
              name="Satisfaction"
              dataKey="satisfaction"
              stroke={COLORS.Sami}
              fill={COLORS.Sami}
              fillOpacity={0.3}
            />
            <Radar
              name="Expertise"
              dataKey="expertise"
              stroke="#EF4444"
              fill="#EF4444"
              fillOpacity={0.3}
            />
            <Radar
              name="Efficacité"
              dataKey="efficacité"
              stroke="#6B7280"
              fill="#6B7280"
              fillOpacity={0.3}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              align="center"
              layout="horizontal"
              iconType="circle"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TechnicianPerformanceChart; 
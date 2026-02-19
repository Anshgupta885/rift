/**
 * Risk Heatmap Component
 * Visual legend showing distribution of risk scores
 */

import type { SuspiciousAccount } from '../types';

interface RiskHeatmapProps {
  accounts: SuspiciousAccount[];
}

function RiskHeatmap({ accounts }: RiskHeatmapProps) {
  // Calculate distribution
  const highRisk = accounts.filter((a) => a.suspicion_score >= 70).length;
  const mediumRisk = accounts.filter(
    (a) => a.suspicion_score >= 40 && a.suspicion_score < 70
  ).length;
  const lowRisk = accounts.filter((a) => a.suspicion_score < 40).length;

  const total = accounts.length || 1;

  const segments = [
    {
      label: 'High Risk (70-100)',
      count: highRisk,
      percentage: (highRisk / total) * 100,
      color: 'bg-red-500',
      textColor: 'text-red-400',
    },
    {
      label: 'Medium Risk (40-69)',
      count: mediumRisk,
      percentage: (mediumRisk / total) * 100,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-400',
    },
    {
      label: 'Low Risk (0-39)',
      count: lowRisk,
      percentage: (lowRisk / total) * 100,
      color: 'bg-green-500',
      textColor: 'text-green-400',
    },
  ];

  return (
    <div className="card">
      <h3 className="font-semibold mb-4 flex items-center">
        <svg
          className="w-5 h-5 mr-2 text-accent-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        Risk Distribution
      </h3>

      {/* Heatmap Bar */}
      <div className="h-4 rounded-full overflow-hidden flex mb-4">
        {segments.map(
          (segment) =>
            segment.percentage > 0 && (
              <div
                key={segment.label}
                className={`${segment.color} transition-all duration-300`}
                style={{ width: `${segment.percentage}%` }}
                title={`${segment.label}: ${segment.count} accounts`}
              />
            )
        )}
        {accounts.length === 0 && (
          <div className="bg-dark-600 w-full" />
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-4">
        {segments.map((segment) => (
          <div key={segment.label} className="text-center">
            <div className="flex items-center justify-center mb-1">
              <div className={`w-3 h-3 rounded ${segment.color} mr-2`} />
              <span className={`text-lg font-bold ${segment.textColor}`}>
                {segment.count}
              </span>
            </div>
            <p className="text-xs text-gray-400">{segment.label}</p>
          </div>
        ))}
      </div>

      {/* Gradient Scale */}
      <div className="mt-4 pt-4 border-t border-dark-600">
        <p className="text-xs text-gray-400 mb-2">Suspicion Score Scale</p>
        <div className="h-2 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" />
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
}

export default RiskHeatmap;

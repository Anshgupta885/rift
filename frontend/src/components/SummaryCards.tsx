/**
 * Summary Cards Component
 * Displays key metrics from the analysis
 */

import type { AnalysisSummary } from '../types';

interface SummaryCardsProps {
  summary: AnalysisSummary;
}

function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      title: 'Total Accounts',
      value: summary.total_accounts_analyzed.toLocaleString(),
      icon: '👥',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Suspicious Flagged',
      value: summary.suspicious_accounts_flagged.toLocaleString(),
      icon: '⚠️',
      color: 'from-red-500 to-red-600',
    },
    {
      title: 'Fraud Rings',
      value: summary.fraud_rings_detected.toLocaleString(),
      icon: '🔗',
      color: 'from-orange-500 to-orange-600',
    },
    {
      title: 'Processing Time',
      value: `${summary.processing_time_seconds}s`,
      icon: '⚡',
      color: 'from-green-500 to-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.title} className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">{card.title}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
            <div
              className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-2xl`}
            >
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SummaryCards;

/**
 * Fraud Ring Table Component
 * Displays fraud rings with sorting functionality
 */

import { useState } from 'react';
import type { FraudRing, SortConfig, SortDirection } from '../types';

// SortIcon component - defined outside to avoid recreation on each render
const SortIcon = ({ sortConfig, columnKey }: { sortConfig: SortConfig; columnKey: string }) => {
  if (sortConfig.key !== columnKey) {
    return (
      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={sortConfig.direction === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
      />
    </svg>
  );
};

interface FraudRingTableProps {
  rings: FraudRing[];
  onRingSelect: (ring: FraudRing) => void;
}

function FraudRingTable({ rings, onRingSelect }: FraudRingTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'risk_score',
    direction: 'desc',
  });

  const handleSort = (key: string) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedRings = [...rings].sort((a, b) => {
    const aValue = a[sortConfig.key as keyof FraudRing];
    const bValue = b[sortConfig.key as keyof FraudRing];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (Array.isArray(aValue) && Array.isArray(bValue)) {
      return sortConfig.direction === 'asc'
        ? aValue.length - bValue.length
        : bValue.length - aValue.length;
    }

    return 0;
  });

  if (rings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>No fraud rings detected</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-dark-600">
            <th
              className="text-left py-3 px-4 cursor-pointer hover:bg-dark-700 transition-colors"
              onClick={() => handleSort('ring_id')}
            >
              <div className="flex items-center">
                Ring ID
                <span className="ml-1">
                  <SortIcon sortConfig={sortConfig} columnKey="ring_id" />
                </span>
              </div>
            </th>
            <th
              className="text-left py-3 px-4 cursor-pointer hover:bg-dark-700 transition-colors"
              onClick={() => handleSort('pattern_type')}
            >
              <div className="flex items-center">
                Pattern Type
                <span className="ml-1">
                  <SortIcon sortConfig={sortConfig} columnKey="pattern_type" />
                </span>
              </div>
            </th>
            <th
              className="text-left py-3 px-4 cursor-pointer hover:bg-dark-700 transition-colors"
              onClick={() => handleSort('member_accounts')}
            >
              <div className="flex items-center">
                Member Count
                <span className="ml-1">
                  <SortIcon sortConfig={sortConfig} columnKey="member_accounts" />
                </span>
              </div>
            </th>
            <th
              className="text-left py-3 px-4 cursor-pointer hover:bg-dark-700 transition-colors"
              onClick={() => handleSort('risk_score')}
            >
              <div className="flex items-center">
                Risk Score
                <span className="ml-1">
                  <SortIcon sortConfig={sortConfig} columnKey="risk_score" />
                </span>
              </div>
            </th>
            <th className="text-left py-3 px-4">Member Account IDs</th>
            <th className="text-left py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedRings.map((ring) => (
            <tr
              key={ring.ring_id}
              className="border-b border-dark-700 hover:bg-dark-700/50 transition-colors"
            >
              <td className="py-3 px-4">
                <span className="badge-danger">{ring.ring_id}</span>
              </td>
              <td className="py-3 px-4">
                <span className="text-gray-300">{ring.pattern_type}</span>
              </td>
              <td className="py-3 px-4">
                <span className="font-medium">{ring.member_accounts.length}</span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center">
                  <div
                    className="w-20 h-2 bg-dark-600 rounded-full overflow-hidden mr-2"
                  >
                    <div
                      className={`h-full rounded-full ${
                        ring.risk_score >= 70
                          ? 'bg-red-500'
                          : ring.risk_score >= 40
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${ring.risk_score}%` }}
                    />
                  </div>
                  <span className="font-medium">{ring.risk_score}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-gray-400 max-w-xs truncate block">
                  {ring.member_accounts.slice(0, 3).join(', ')}
                  {ring.member_accounts.length > 3 && ` +${ring.member_accounts.length - 3} more`}
                </span>
              </td>
              <td className="py-3 px-4">
                <button
                  onClick={() => onRingSelect(ring)}
                  className="px-3 py-1 text-sm bg-accent-primary/20 text-accent-primary rounded hover:bg-accent-primary/30 transition-colors"
                >
                  View in Graph
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default FraudRingTable;

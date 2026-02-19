/**
 * Suspicious Accounts Table Component
 * Displays suspicious accounts with sorting functionality
 */

import { useState } from 'react';
import type { SuspiciousAccount, SortConfig, SortDirection } from '../types';

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

interface SuspiciousAccountsTableProps {
  accounts: SuspiciousAccount[];
  onAccountSelect: (accountId: string) => void;
}

function SuspiciousAccountsTable({
  accounts,
  onAccountSelect,
}: SuspiciousAccountsTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'suspicion_score',
    direction: 'desc',
  });
  const [filter, setFilter] = useState('');

  const handleSort = (key: string) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAccounts = accounts.filter(
    (account) =>
      account.account_id.toLowerCase().includes(filter.toLowerCase()) ||
      account.detected_patterns.some((p) =>
        p.toLowerCase().includes(filter.toLowerCase())
      )
  );

  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    const aValue = a[sortConfig.key as keyof SuspiciousAccount];
    const bValue = b[sortConfig.key as keyof SuspiciousAccount];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return 0;
  });

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 70) return 'badge-danger';
    if (score >= 40) return 'badge-warning';
    return 'badge-success';
  };

  return (
    <div>
      {/* Search Filter */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by account ID or pattern..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-field"
        />
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-400 mb-4">
        Showing {sortedAccounts.length} of {accounts.length} suspicious accounts
      </p>

      {/* Table */}
      <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-dark-800">
            <tr className="border-b border-dark-600">
              <th
                className="text-left py-3 px-4 cursor-pointer hover:bg-dark-700 transition-colors"
                onClick={() => handleSort('account_id')}
              >
                <div className="flex items-center">
                  Account ID
                  <span className="ml-1">
                    <SortIcon sortConfig={sortConfig} columnKey="account_id" />
                  </span>
                </div>
              </th>
              <th
                className="text-left py-3 px-4 cursor-pointer hover:bg-dark-700 transition-colors"
                onClick={() => handleSort('suspicion_score')}
              >
                <div className="flex items-center">
                  Suspicion Score
                  <span className="ml-1">
                    <SortIcon sortConfig={sortConfig} columnKey="suspicion_score" />
                  </span>
                </div>
              </th>
              <th className="text-left py-3 px-4">Detected Patterns</th>
              <th className="text-left py-3 px-4">Ring ID</th>
            </tr>
          </thead>
          <tbody>
            {sortedAccounts.map((account) => (
              <tr
                key={account.account_id}
                className="border-b border-dark-700 hover:bg-dark-700/50 transition-colors cursor-pointer"
                onClick={() => onAccountSelect(account.account_id)}
              >
                <td className="py-3 px-4">
                  <span className="font-medium text-accent-primary">
                    {account.account_id}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <div className="w-16 h-2 bg-dark-600 rounded-full overflow-hidden mr-3">
                      <div
                        className={`h-full rounded-full ${
                          account.suspicion_score >= 70
                            ? 'bg-red-500'
                            : account.suspicion_score >= 40
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${account.suspicion_score}%` }}
                      />
                    </div>
                    <span className={`font-bold ${getScoreColor(account.suspicion_score)}`}>
                      {account.suspicion_score}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {account.detected_patterns.map((pattern) => (
                      <span key={pattern} className="badge-info text-xs">
                        {pattern}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4">
                  {account.ring_id ? (
                    <span className={getScoreBadge(account.suspicion_score)}>
                      {account.ring_id}
                    </span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SuspiciousAccountsTable;

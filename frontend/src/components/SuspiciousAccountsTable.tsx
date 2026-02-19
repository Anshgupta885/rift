/**
 * Suspicious Accounts Table — warm editorial
 */

import { useState } from 'react';
import type { SuspiciousAccount, SortConfig, SortDirection } from '../types';

interface Props {
  accounts: SuspiciousAccount[];
  onAccountSelect: (accountId: string) => void;
}

const SortChevron = ({ active, dir }: { active: boolean; dir: SortDirection }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 4, opacity: active ? 1 : 0.3 }}>
    <path d={dir === 'asc' ? 'M2 7l3-4 3 4' : 'M2 3l3 4 3-4'} stroke={active ? 'var(--amber)' : '#a09590'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function SuspiciousAccountsTable({ accounts, onAccountSelect }: Props) {
  const [sort, setSort] = useState<SortConfig>({ key: 'suspicion_score', direction: 'desc' });
  const [filter, setFilter] = useState('');

  const handleSort = (key: string) => {
    setSort(s => ({ key, direction: s.key === key && s.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const filtered = accounts.filter(a =>
    a.account_id.toLowerCase().includes(filter.toLowerCase()) ||
    a.detected_patterns.some(p => p.toLowerCase().includes(filter.toLowerCase()))
  );

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sort.key as keyof SuspiciousAccount];
    const bv = b[sort.key as keyof SuspiciousAccount];
    if (typeof av === 'number' && typeof bv === 'number') return sort.direction === 'asc' ? av - bv : bv - av;
    if (typeof av === 'string' && typeof bv === 'string') return sort.direction === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return 0;
  });

  const getColor = (s: number) => s >= 70 ? '#c44a2a' : s >= 40 ? '#a06c08' : '#3a5a4a';
  const getBarColor = (s: number) => s >= 70 ? '#c44a2a' : s >= 40 ? '#c8870a' : '#3a5a4a';

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" fill="none" stroke="#a09590" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search accounts or patterns…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#a09590', whiteSpace: 'nowrap' }}>
          {sorted.length} of {accounts.length}
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '420px' }}>
        <table className="data-table">
          <thead>
            <tr>
              {[
                { key: 'account_id', label: 'Account ID' },
                { key: 'suspicion_score', label: 'Score' },
                { key: null, label: 'Patterns' },
                { key: null, label: 'Ring' },
              ].map(col => (
                <th
                  key={col.label}
                  onClick={col.key ? () => handleSort(col.key!) : undefined}
                  style={{ cursor: col.key ? 'pointer' : 'default', whiteSpace: 'nowrap' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {col.label}
                    {col.key && <SortChevron active={sort.key === col.key} dir={sort.direction} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(account => (
              <tr
                key={account.account_id}
                onClick={() => onAccountSelect(account.account_id)}
                style={{ cursor: 'pointer' }}
              >
                <td>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: 'var(--amber)', fontWeight: 500 }}>
                    {account.account_id}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '48px', height: '3px', background: '#ede0cc', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${account.suspicion_score}%`, background: getBarColor(account.suspicion_score) }} />
                    </div>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.875rem', fontWeight: 700, color: getColor(account.suspicion_score) }}>
                      {account.suspicion_score}
                    </span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {account.detected_patterns.map(p => (
                      <span key={p} className="badge-info" style={{ fontSize: '0.65rem' }}>{p.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                </td>
                <td>
                  {account.ring_id
                    ? <span className="badge-danger">{account.ring_id}</span>
                    : <span style={{ color: '#c8bfb5', fontSize: '0.75rem' }}>—</span>
                  }
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
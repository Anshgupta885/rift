/**
 * Fraud Ring Table — warm editorial
 */

import { useState } from 'react';
import type { FraudRing, SortConfig, SortDirection } from '../types';

interface Props {
  rings: FraudRing[];
  onRingSelect: (ring: FraudRing) => void;
}

const SortChevron = ({ active, dir }: { active: boolean; dir: SortDirection }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 4, opacity: active ? 1 : 0.3 }}>
    <path d={dir === 'asc' ? 'M2 7l3-4 3 4' : 'M2 3l3 4 3-4'} stroke={active ? 'var(--amber)' : '#a09590'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function FraudRingTable({ rings, onRingSelect }: Props) {
  const [sort, setSort] = useState<SortConfig>({ key: 'risk_score', direction: 'desc' });

  const handleSort = (key: string) => {
    setSort(s => ({ key, direction: s.key === key && s.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const sorted = [...rings].sort((a, b) => {
    const av = a[sort.key as keyof FraudRing];
    const bv = b[sort.key as keyof FraudRing];
    if (typeof av === 'number' && typeof bv === 'number') return sort.direction === 'asc' ? av - bv : bv - av;
    if (typeof av === 'string' && typeof bv === 'string') return sort.direction === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    if (Array.isArray(av) && Array.isArray(bv)) return sort.direction === 'asc' ? av.length - bv.length : bv.length - av.length;
    return 0;
  });

  if (rings.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', gap: '0.75rem' }}>
        <svg width="40" height="40" fill="none" stroke="#c8bfb5" strokeWidth="1" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p style={{ fontFamily: "'Lora', serif", fontSize: '0.875rem', color: '#a09590' }}>
          No coordinated fraud rings detected.
        </p>
      </div>
    );
  }

  const getRiskColor = (s: number) => s >= 70 ? '#c44a2a' : s >= 40 ? '#a06c08' : '#3a5a4a';

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            {[
              { key: 'ring_id', label: 'Ring ID' },
              { key: 'pattern_type', label: 'Pattern' },
              { key: 'member_accounts', label: 'Members' },
              { key: 'risk_score', label: 'Risk' },
              { key: null, label: 'Accounts' },
              { key: null, label: '' },
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
          {sorted.map(ring => (
            <tr key={ring.ring_id}>
              <td>
                <span className="badge-danger">{ring.ring_id}</span>
              </td>
              <td>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: 'var(--ink-700)' }}>
                  {ring.pattern_type}
                </span>
              </td>
              <td>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--ink-900)' }}>
                  {ring.member_accounts.length}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '48px', height: '3px', background: '#ede0cc', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${ring.risk_score}%`, background: getRiskColor(ring.risk_score) }} />
                  </div>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.875rem', fontWeight: 700, color: getRiskColor(ring.risk_score) }}>
                    {ring.risk_score}
                  </span>
                </div>
              </td>
              <td>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: 'var(--ink-500)' }}>
                  {ring.member_accounts.slice(0, 2).join(', ')}
                  {ring.member_accounts.length > 2 && ` +${ring.member_accounts.length - 2}`}
                </span>
              </td>
              <td>
                <button
                  onClick={() => onRingSelect(ring)}
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    padding: '0.3rem 0.75rem',
                    background: 'rgba(200, 135, 10, 0.1)',
                    color: '#a06c08',
                    border: '1px solid rgba(200, 135, 10, 0.25)',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200, 135, 10, 0.18)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200, 135, 10, 0.1)'; }}
                >
                  View ring →
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
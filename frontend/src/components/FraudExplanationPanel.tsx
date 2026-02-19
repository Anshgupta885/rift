/**
 * Fraud Explanation Panel — warm editorial
 */

import type { SuspiciousAccount, FraudRing } from '../types';

interface FraudExplanationPanelProps {
  account: SuspiciousAccount | null;
  ring: FraudRing | null;
}

const PATTERN_EXPLANATIONS: Record<string, string> = {
  cycle_length_3: 'Involved in a 3-node circular transaction pattern, indicating potential round-tripping of funds.',
  cycle_length_4: 'Part of a 4-node cycle where money flows back to origin — a classic layered laundering structure.',
  cycle_length_5: 'Participates in a complex 5-node circular flow, suggesting sophisticated layering.',
  fan_in_aggregator: 'Receives funds from 10+ different sources within 72 hours — typical of a money mule aggregator.',
  fan_out_disperser: 'Sends funds to 10+ different recipients within 72 hours, indicating structured dispersion.',
  shell_account: 'Acts as a pass-through intermediary with limited connections, characteristic of shell company layering.',
  high_velocity: '5+ transactions within 24 hours — rapid fund movement consistent with structuring.',
};

const getRisk = (score: number) => {
  if (score >= 70) return { label: 'High risk', color: '#c44a2a', bg: 'rgba(196, 74, 42, 0.08)', border: 'rgba(196, 74, 42, 0.2)' };
  if (score >= 40) return { label: 'Medium risk', color: '#a06c08', bg: 'rgba(200, 135, 10, 0.08)', border: 'rgba(200, 135, 10, 0.2)' };
  return { label: 'Low risk', color: '#3a5a4a', bg: 'rgba(58, 90, 74, 0.08)', border: 'rgba(58, 90, 74, 0.2)' };
};

function FraudExplanationPanel({ account, ring }: FraudExplanationPanelProps) {
  if (!account) {
    return (
      <div className="card">
        <p className="annotation" style={{ marginBottom: '0.75rem' }}>Account detail</p>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          background: 'rgba(247, 240, 230, 0.4)',
          borderRadius: '3px',
          border: '1px dashed #ddc9aa',
        }}>
          <svg width="32" height="32" fill="none" stroke="#c8bfb5" strokeWidth="1" viewBox="0 0 24 24" style={{ marginBottom: '0.75rem' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <p style={{ fontFamily: "'Lora', serif", fontSize: '0.875rem', color: '#a09590', lineHeight: 1.6 }}>
            Select a node from the graph or a row in the table to see the full fraud analysis for that account.
          </p>
        </div>
      </div>
    );
  }

  const risk = getRisk(account.suspicion_score);

  return (
    <div className="card animate-fade-in">
      <p className="annotation" style={{ marginBottom: '0.75rem' }}>Account detail</p>

      {/* Account header */}
      <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #ede0cc' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.125rem', fontWeight: 700, color: 'var(--ink-900)', wordBreak: 'break-all' }}>
            {account.account_id}
          </h3>
          <span style={{
            flexShrink: 0,
            padding: '0.2rem 0.6rem',
            borderRadius: '2px',
            fontSize: '0.65rem',
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            background: risk.bg,
            color: risk.color,
            border: `1px solid ${risk.border}`,
          }}>
            {risk.label}
          </span>
        </div>

        {/* Score meter */}
        <div style={{ marginTop: '0.875rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: '#a09590', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Suspicion score
            </span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 700, color: risk.color }}>
              {account.suspicion_score}<span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#a09590' }}>/100</span>
            </span>
          </div>
          <div style={{ height: '4px', background: '#ede0cc', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${account.suspicion_score}%`, background: risk.color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>

      {/* Ring membership */}
      {ring && (
        <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #ede0cc' }}>
          <p className="annotation" style={{ marginBottom: '0.5rem' }}>Fraud ring membership</p>
          <div style={{ background: 'rgba(196, 74, 42, 0.05)', border: '1px solid rgba(196, 74, 42, 0.15)', borderRadius: '3px', padding: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.9rem', fontWeight: 600, color: '#c44a2a' }}>{ring.ring_id}</span>
              <span className="badge-danger">{ring.pattern_type}</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: 'var(--ink-500)' }}>
                {ring.member_accounts.length} members
              </span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#c44a2a', fontWeight: 600 }}>
                Risk: {ring.risk_score}/100
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Detected patterns */}
      <div>
        <p className="annotation" style={{ marginBottom: '0.75rem' }}>Detected patterns</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {account.detected_patterns.map(pattern => (
            <div
              key={pattern}
              className="sidebar-pattern"
              style={{ borderLeftColor: account.suspicion_score >= 70 ? '#c44a2a' : account.suspicion_score >= 40 ? '#c8870a' : '#3a5a4a' }}
            >
              <div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-900)', marginBottom: '0.2rem' }}>
                  {pattern.replace(/_/g, ' ')}
                </p>
                <p style={{ fontFamily: "'Lora', serif", fontSize: '0.75rem', color: 'var(--ink-500)', lineHeight: 1.5 }}>
                  {PATTERN_EXPLANATIONS[pattern] || 'Suspicious activity pattern detected.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary sentence */}
      <div style={{
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid #ede0cc',
        background: 'rgba(196, 74, 42, 0.04)',
        borderRadius: '3px',
        padding: '0.875rem',
        border: '1px solid rgba(196, 74, 42, 0.12)',
        marginTop: '1rem',
      }}>
        <p style={{ fontFamily: "'Lora', serif", fontSize: '0.8rem', color: '#7a3020', lineHeight: 1.6, fontStyle: 'italic' }}>
          "{account.account_id} flagged for{' '}
          {account.detected_patterns.length === 1
            ? account.detected_patterns[0].replace(/_/g, ' ')
            : `${account.detected_patterns.slice(0, -1).map(p => p.replace(/_/g, ' ')).join(', ')} and ${account.detected_patterns[account.detected_patterns.length - 1].replace(/_/g, ' ')}`}
          {ring ? ` — part of ${ring.ring_id}` : ''}."
        </p>
      </div>
    </div>
  );
}

export default FraudExplanationPanel;
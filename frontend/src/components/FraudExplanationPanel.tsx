/**
 * Fraud Explanation Panel Component
 * Shows detailed explanation of why an account was flagged
 */

import type { SuspiciousAccount, FraudRing } from '../types';

interface FraudExplanationPanelProps {
  account: SuspiciousAccount | null;
  ring: FraudRing | null;
}

const PATTERN_EXPLANATIONS: Record<string, string> = {
  cycle_length_3: 'Involved in a 3-node circular transaction pattern, indicating potential round-tripping of funds.',
  cycle_length_4: 'Part of a 4-node cycle where money flows back to origin, suggesting layered laundering.',
  cycle_length_5: 'Participates in a 5-node circular fund flow, a complex money laundering structure.',
  fan_in_aggregator: 'Receives funds from 10+ different sources within 72 hours, typical of a money mule aggregator.',
  fan_out_disperser: 'Sends funds to 10+ different recipients within 72 hours, indicating fund dispersion.',
  shell_account: 'Acts as an intermediary with limited connections, characteristic of shell company layering.',
  high_velocity: '5+ transactions within 24 hours, suggesting rapid fund movement.',
};

function FraudExplanationPanel({ account, ring }: FraudExplanationPanelProps) {
  if (!account) {
    return (
      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Fraud Explanation
        </h3>
        <p className="text-gray-400 text-sm">
          Select an account from the graph or table to see detailed fraud analysis.
        </p>
      </div>
    );
  }

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { label: 'High Risk', color: 'text-red-400', bg: 'bg-red-500/20' };
    if (score >= 40) return { label: 'Medium Risk', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { label: 'Low Risk', color: 'text-green-400', bg: 'bg-green-500/20' };
  };

  const riskLevel = getRiskLevel(account.suspicion_score);

  return (
    <div className="card">
      <h3 className="font-semibold mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Fraud Explanation
      </h3>

      {/* Account Header */}
      <div className="mb-4 pb-4 border-b border-dark-600">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-bold text-accent-primary">
            {account.account_id}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskLevel.bg} ${riskLevel.color}`}>
            {riskLevel.label}
          </span>
        </div>
        
        <div className="flex items-center">
          <span className="text-gray-400 mr-2">Suspicion Score:</span>
          <span className={`text-2xl font-bold ${riskLevel.color}`}>
            {account.suspicion_score}
          </span>
          <span className="text-gray-500 ml-1">/100</span>
        </div>
      </div>

      {/* Ring Info */}
      {ring && (
        <div className="mb-4 pb-4 border-b border-dark-600">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Fraud Ring Membership</h4>
          <div className="bg-dark-700 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="badge-danger">{ring.ring_id}</span>
              <span className="text-sm text-gray-400">{ring.pattern_type}</span>
            </div>
            <p className="text-sm">
              <span className="text-gray-400">Ring Members: </span>
              <span className="text-white">{ring.member_accounts.length}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-400">Ring Risk Score: </span>
              <span className="text-red-400 font-medium">{ring.risk_score}</span>
            </p>
          </div>
        </div>
      )}

      {/* Pattern Explanations */}
      <div>
        <h4 className="text-sm font-medium text-gray-400 mb-3">Detected Patterns</h4>
        <div className="space-y-3">
          {account.detected_patterns.map((pattern) => (
            <div key={pattern} className="bg-dark-700 rounded-lg p-3">
              <div className="flex items-start">
                <div className="w-2 h-2 rounded-full bg-accent-warning mt-2 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm mb-1">{pattern.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-400">
                    {PATTERN_EXPLANATIONS[pattern] || 'Suspicious activity pattern detected.'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-dark-600">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-sm text-red-300">
            <strong>Summary:</strong> This account was flagged due to{' '}
            {account.detected_patterns.length === 1
              ? account.detected_patterns[0].replace(/_/g, ' ')
              : `${account.detected_patterns.slice(0, -1).map(p => p.replace(/_/g, ' ')).join(', ')} and ${account.detected_patterns[account.detected_patterns.length - 1].replace(/_/g, ' ')}`}
            {ring ? ` and membership in ${ring.ring_id}.` : '.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default FraudExplanationPanel;

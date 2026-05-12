/**
 * Dashboard Page — warm editorial
 */

import { useState } from 'react';
import { downloadJSON } from '../services/api';
import GraphVisualization from '../components/GraphVisualization';
import FraudRingTable from '../components/FraudRingTable';
import SuspiciousAccountsTable from '../components/SuspiciousAccountsTable';
import SummaryCards from '../components/SummaryCards';
import FraudExplanationPanel from '../components/FraudExplanationPanel';
import RiskHeatmap from '../components/RiskHeatmap';

function DashboardPage({ analysisData, onReset }) {
  const [activeTab, setActiveTab] = useState('graph');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedRing, setSelectedRing] = useState(null);

  if (!analysisData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem' }}>
        <p style={{ fontFamily: "'Lora', serif", color: '#a09590' }}>No analysis data available</p>
        <button className="btn-primary" onClick={onReset}>Upload a file</button>
      </div>
    );
  }

  const { graph_data, fraud_analysis } = analysisData;

  const handleNodeSelect = (accountId) => {
    const account = fraud_analysis.suspicious_accounts.find(a => a.account_id === accountId);
    setSelectedAccount(account || null);
    if (account?.ring_id) {
      setSelectedRing(fraud_analysis.fraud_rings.find(r => r.ring_id === account.ring_id) || null);
    } else {
      setSelectedRing(null);
    }
  };

  const handleDownload = async () => {
    try { await downloadJSON(fraud_analysis); } catch (e) { console.error(e); }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>

      {/* Page header */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <p className="annotation" style={{ marginBottom: '0.375rem' }}>Analysis results</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--ink-900)', lineHeight: 1.2 }}>
            Transaction graph report
          </h2>
        </div>
        <button
          className="btn-primary"
          onClick={handleDownload}
          style={{ flexShrink: 0 }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export JSON
        </button>
      </div>

      {/* Metrics */}
      <div style={{ marginBottom: '1.5rem' }}>
        <SummaryCards summary={fraud_analysis.summary} />
      </div>

      {/* Risk distribution */}
      <div style={{ marginBottom: '1.5rem' }}>
        <RiskHeatmap accounts={fraud_analysis.suspicious_accounts} />
      </div>

      <div className="divider" />

      {/* Tab navigation */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="tab-bar">
          <TabItem label="Graph view" active={activeTab === 'graph'} onClick={() => setActiveTab('graph')} />
          <TabItem
            label={`Suspicious accounts (${fraud_analysis.suspicious_accounts.length})`}
            active={activeTab === 'accounts'}
            onClick={() => setActiveTab('accounts')}
          />
          <TabItem
            label={`Fraud rings (${fraud_analysis.fraud_rings.length})`}
            active={activeTab === 'rings'}
            onClick={() => setActiveTab('rings')}
          />
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Primary panel */}
        <div className="card" style={{ minHeight: '600px' }}>
          {activeTab === 'graph' && (
            <GraphVisualization
              graphData={graph_data}
              onNodeSelect={handleNodeSelect}
              selectedRing={selectedRing}
            />
          )}
          {activeTab === 'accounts' && (
            <SuspiciousAccountsTable
              accounts={fraud_analysis.suspicious_accounts}
              onAccountSelect={handleNodeSelect}
            />
          )}
          {activeTab === 'rings' && (
            <FraudRingTable
              rings={fraud_analysis.fraud_rings}
              onRingSelect={ring => {
                setSelectedRing(ring);
                setActiveTab('graph');
              }}
            />
          )}
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FraudExplanationPanel account={selectedAccount} ring={selectedRing} />

          {/* Quick stats */}
          <div className="card">
            <p className="annotation" style={{ marginBottom: '0.75rem' }}>Graph statistics</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {[
                ['Nodes', graph_data.nodes.length.toLocaleString()],
                ['Edges', graph_data.edges.length.toLocaleString()],
                ['Suspicious nodes', fraud_analysis.suspicious_accounts.length.toLocaleString()],
                ['Processing time', `${fraud_analysis.summary.processing_time_seconds}s`],
              ].map(([label, value], i, arr) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    padding: '0.625rem 0',
                    borderBottom: i < arr.length - 1 ? '1px solid #f0e8de' : 'none',
                  }}
                >
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: 'var(--ink-500)' }}>{label}</span>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink-900)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabItem({ label, active, onClick }) {
  return (
    <button className={`tab-item${active ? ' active' : ''}`} onClick={onClick}>
      {label}
    </button>
  );
}

export default DashboardPage;
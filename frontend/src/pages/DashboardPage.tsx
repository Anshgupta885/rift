/**
 * Dashboard Page Component
 * Displays graph visualization, fraud rings, and analysis summary
 */

import { useState } from 'react';
import type { AnalysisResponse, SuspiciousAccount, FraudRing } from '../types';
import { downloadJSON } from '../services/api';
import GraphVisualization from '../components/GraphVisualization';
import FraudRingTable from '../components/FraudRingTable';
import SuspiciousAccountsTable from '../components/SuspiciousAccountsTable';
import SummaryCards from '../components/SummaryCards';
import FraudExplanationPanel from '../components/FraudExplanationPanel';
import RiskHeatmap from '../components/RiskHeatmap';

interface DashboardPageProps {
  analysisData: AnalysisResponse | null;
  sessionId: string | null;
  onReset: () => void;
}

type TabType = 'graph' | 'accounts' | 'rings';

function DashboardPage({ analysisData, onReset }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('graph');
  const [selectedAccount, setSelectedAccount] = useState<SuspiciousAccount | null>(null);
  const [selectedRing, setSelectedRing] = useState<FraudRing | null>(null);

  if (!analysisData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-400 mb-4">No analysis data available</p>
        <button onClick={onReset} className="btn-primary">
          Upload CSV
        </button>
      </div>
    );
  }

  const { graph_data, fraud_analysis } = analysisData;

  const handleDownload = async () => {
    try {
      await downloadJSON(fraud_analysis);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleNodeSelect = (accountId: string) => {
    const account = fraud_analysis.suspicious_accounts.find(
      (a) => a.account_id === accountId
    );
    setSelectedAccount(account || null);
    
    if (account?.ring_id) {
      const ring = fraud_analysis.fraud_rings.find(
        (r) => r.ring_id === account.ring_id
      );
      setSelectedRing(ring || null);
    } else {
      setSelectedRing(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <SummaryCards summary={fraud_analysis.summary} />

      {/* Risk Heatmap Legend */}
      <RiskHeatmap accounts={fraud_analysis.suspicious_accounts} />

      {/* Tab Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <TabButton
            active={activeTab === 'graph'}
            onClick={() => setActiveTab('graph')}
          >
            Graph View
          </TabButton>
          <TabButton
            active={activeTab === 'accounts'}
            onClick={() => setActiveTab('accounts')}
          >
            Suspicious Accounts ({fraud_analysis.suspicious_accounts.length})
          </TabButton>
          <TabButton
            active={activeTab === 'rings'}
            onClick={() => setActiveTab('rings')}
          >
            Fraud Rings ({fraud_analysis.fraud_rings.length})
          </TabButton>
        </div>

        <button onClick={handleDownload} className="btn-primary flex items-center">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download JSON
        </button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph / Table Area */}
        <div className="lg:col-span-2">
          <div className="card min-h-[600px]">
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
                onRingSelect={(ring) => {
                  setSelectedRing(ring);
                  setActiveTab('graph');
                }}
              />
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Fraud Explanation Panel */}
          <FraudExplanationPanel
            account={selectedAccount}
            ring={selectedRing}
          />

          {/* Quick Stats */}
          <div className="card">
            <h3 className="font-semibold mb-4">Analysis Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Nodes</span>
                <span>{graph_data.nodes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Edges</span>
                <span>{graph_data.edges.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Processing Time</span>
                <span>{fraud_analysis.summary.processing_time_seconds}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Detection Rate</span>
                <span>
                  {(
                    (fraud_analysis.summary.suspicious_accounts_flagged /
                      fraud_analysis.summary.total_accounts_analyzed) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        active
          ? 'bg-accent-primary text-white'
          : 'bg-dark-700 text-gray-400 hover:text-white hover:bg-dark-600'
      }`}
    >
      {children}
    </button>
  );
}

export default DashboardPage;

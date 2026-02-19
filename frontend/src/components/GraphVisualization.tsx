/**
 * Graph Visualization Component
 * Uses Cytoscape.js for interactive graph rendering
 */

import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import type { Core, ElementDefinition } from 'cytoscape';
import type { GraphData, FraudRing } from '../types';

interface GraphVisualizationProps {
  graphData: GraphData;
  onNodeSelect: (accountId: string) => void;
  selectedRing: FraudRing | null;
}

function GraphVisualization({
  graphData,
  onNodeSelect,
  selectedRing,
}: GraphVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    data: {
      id: string;
      score: number;
      patterns: string[];
      ringId: string | null;
    } | null;
  }>({ visible: false, x: 0, y: 0, data: null });

  useEffect(() => {
    if (!containerRef.current || !graphData) return;

    // Convert graph data to Cytoscape elements
    const elements: ElementDefinition[] = [];

    // Add nodes
    for (const node of graphData.nodes) {
      const size = node.suspicious
        ? 20 + (node.suspicion_score / 100) * 30
        : 20;

      elements.push({
        data: {
          id: node.id,
          label: node.label,
          suspicious: node.suspicious,
          suspicion_score: node.suspicion_score,
          patterns: node.patterns,
          ring_id: node.ring_id,
          size,
        },
      });
    }

    // Add edges
    for (const edge of graphData.edges) {
      elements.push({
        data: {
          id: `${edge.source}-${edge.target}-${edge.transaction_id}`,
          source: edge.source,
          target: edge.target,
          amount: edge.amount,
          is_fraud_ring_edge: edge.is_fraud_ring_edge,
        },
      });
    }

    // Cytoscape stylesheet
    const style = [
      {
        selector: 'node',
        style: {
          label: 'data(label)',
          'background-color': '#3b82f6',
          color: '#fff',
          'text-valign': 'bottom',
          'text-halign': 'center',
          'font-size': '10px',
          width: 'data(size)',
          height: 'data(size)',
          'text-margin-y': 5,
        },
      },
      {
        selector: 'node[suspicious]',
        style: {
          'background-color': (ele: cytoscape.NodeSingular) =>
            ele.data('suspicious') ? '#ef4444' : '#3b82f6',
        },
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': 3,
          'border-color': '#f59e0b',
        },
      },
      {
        selector: 'edge',
        style: {
          width: 1,
          'line-color': '#4b5563',
          'target-arrow-color': '#4b5563',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'arrow-scale': 0.8,
        },
      },
      {
        selector: 'edge[is_fraud_ring_edge]',
        style: {
          'line-color': (ele: cytoscape.EdgeSingular) =>
            ele.data('is_fraud_ring_edge') ? '#f59e0b' : '#4b5563',
          'target-arrow-color': (ele: cytoscape.EdgeSingular) =>
            ele.data('is_fraud_ring_edge') ? '#f59e0b' : '#4b5563',
          width: (ele: cytoscape.EdgeSingular) => (ele.data('is_fraud_ring_edge') ? 2 : 1),
        },
      },
      {
        selector: '.highlighted',
        style: {
          'background-color': '#f59e0b',
          'line-color': '#f59e0b',
          'target-arrow-color': '#f59e0b',
        },
      },
    ];

    // Initialize Cytoscape
    cyRef.current = cytoscape({
      container: containerRef.current,
      elements,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      style: style as any,
      layout: {
        name: 'cose',
        animate: false,
        nodeOverlap: 20,
        idealEdgeLength: 100,
        nodeRepulsion: () => 400000,
        gravity: 0.25,
        numIter: 1000,
      },
      minZoom: 0.1,
      maxZoom: 3,
      wheelSensitivity: 0.3,
    });

    const cy = cyRef.current;

    // Event handlers
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      onNodeSelect(node.data('id'));
    });

    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      const pos = node.renderedPosition();
      const container = containerRef.current;
      
      if (container) {
        setTooltip({
          visible: true,
          x: pos.x,
          y: pos.y - 20,
          data: {
            id: node.data('id'),
            score: node.data('suspicion_score'),
            patterns: node.data('patterns') || [],
            ringId: node.data('ring_id'),
          },
        });
      }
    });

    cy.on('mouseout', 'node', () => {
      setTooltip({ visible: false, x: 0, y: 0, data: null });
    });

    return () => {
      cyRef.current?.destroy();
    };
  }, [graphData, onNodeSelect]);

  // Highlight selected ring
  useEffect(() => {
    if (!cyRef.current) return;

    const cy = cyRef.current;

    // Remove previous highlights
    cy.elements().removeClass('highlighted');

    // Highlight ring members if selected
    if (selectedRing) {
      for (const accountId of selectedRing.member_accounts) {
        cy.getElementById(accountId).addClass('highlighted');
      }
    }
  }, [selectedRing]);

  const handleZoomIn = () => {
    cyRef.current?.zoom(cyRef.current.zoom() * 1.2);
  };

  const handleZoomOut = () => {
    cyRef.current?.zoom(cyRef.current.zoom() / 1.2);
  };

  const handleFit = () => {
    cyRef.current?.fit();
  };

  const getScoreClass = (score: number) => {
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-medium';
    return 'score-low';
  };

  return (
    <div className="relative h-full">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 bg-dark-700 hover:bg-dark-600 rounded flex items-center justify-center"
          title="Zoom In"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 bg-dark-700 hover:bg-dark-600 rounded flex items-center justify-center"
          title="Zoom Out"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
        <button
          onClick={handleFit}
          className="w-8 h-8 bg-dark-700 hover:bg-dark-600 rounded flex items-center justify-center"
          title="Fit to Screen"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-dark-700/90 rounded-lg p-3 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
            <span>Normal</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
            <span>Suspicious</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-orange-500 mr-2" />
            <span>Fraud Ring Edge</span>
          </div>
        </div>
      </div>

      {/* Graph Container */}
      <div ref={containerRef} className="w-full h-[550px]" />

      {/* Tooltip */}
      {tooltip.visible && tooltip.data && (
        <div
          className="cy-tooltip"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y + 10,
          }}
        >
          <h4>{tooltip.data.id}</h4>
          <p className={getScoreClass(tooltip.data.score)}>
            Score: {tooltip.data.score}
          </p>
          {tooltip.data.patterns.length > 0 && (
            <p>Patterns: {tooltip.data.patterns.join(', ')}</p>
          )}
          {tooltip.data.ringId && <p>Ring: {tooltip.data.ringId}</p>}
        </div>
      )}
    </div>
  );
}

export default GraphVisualization;

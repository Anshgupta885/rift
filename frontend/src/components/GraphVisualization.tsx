/**
 * Graph Visualization — warm palette, editorial feel
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

function GraphVisualization({ graphData, onNodeSelect, selectedRing }: GraphVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean; x: number; y: number;
    data: { id: string; score: number; patterns: string[]; ringId: string | null } | null;
  }>({ visible: false, x: 0, y: 0, data: null });

  useEffect(() => {
    if (!containerRef.current || !graphData) return;

    const elements: ElementDefinition[] = [];

    for (const node of graphData.nodes) {
      const size = node.suspicious ? 20 + (node.suspicion_score / 100) * 28 : 18;
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

    const style = [
      {
        selector: 'node',
        style: {
          label: 'data(label)',
          'background-color': '#c8bfb5',
          'border-color': '#a09590',
          'border-width': 1,
          color: '#3d3430',
          'text-valign': 'bottom',
          'text-halign': 'center',
          'font-size': '9px',
          'font-family': 'DM Sans, sans-serif',
          width: 'data(size)',
          height: 'data(size)',
          'text-margin-y': 5,
        },
      },
      {
        selector: 'node[?suspicious]',
        style: {
          'background-color': '#d95e3a',
          'border-color': '#c44a2a',
          'border-width': 1.5,
          color: '#3d3430',
        },
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': 3,
          'border-color': '#c8870a',
          'background-color': '#e6a020',
        },
      },
      {
        selector: 'edge',
        style: {
          width: 1,
          'line-color': '#ddc9aa',
          'target-arrow-color': '#c8bfb5',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'arrow-scale': 0.6,
          opacity: 0.7,
        },
      },
      {
        selector: 'edge[?is_fraud_ring_edge]',
        style: {
          'line-color': '#c8870a',
          'target-arrow-color': '#c8870a',
          width: 2,
          opacity: 0.9,
        },
      },
      {
        selector: '.highlighted',
        style: {
          'background-color': '#e6a020',
          'border-color': '#c8870a',
          'border-width': 3,
        },
      },
      {
        selector: '.highlighted-edge',
        style: {
          'line-color': '#c8870a',
          'target-arrow-color': '#c8870a',
          width: 2.5,
        },
      },
    ];

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
      backgroundColor: 'transparent',
    });

    const cy = cyRef.current;

    cy.on('tap', 'node', evt => {
      onNodeSelect(evt.target.data('id'));
    });

    cy.on('mouseover', 'node', evt => {
      const node = evt.target;
      const pos = node.renderedPosition();
      if (containerRef.current) {
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

    return () => { cyRef.current?.destroy(); };
  }, [graphData, onNodeSelect]);

  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    cy.elements().removeClass('highlighted highlighted-edge');
    if (selectedRing) {
      for (const accountId of selectedRing.member_accounts) {
        cy.getElementById(accountId).addClass('highlighted');
      }
    }
  }, [selectedRing]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.2);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() / 1.2);
  const handleFit = () => cyRef.current?.fit();

  const ScoreColor = (score: number) => score >= 70 ? '#c44a2a' : score >= 40 ? '#a06c08' : '#3a5a4a';

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {/* Zoom controls */}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {[
          { label: '+', action: handleZoomIn, title: 'Zoom in' },
          { label: '−', action: handleZoomOut, title: 'Zoom out' },
          { label: '⊡', action: handleFit, title: 'Fit to screen' },
        ].map(btn => (
          <button
            key={btn.label}
            onClick={btn.action}
            title={btn.title}
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(253, 250, 245, 0.92)',
              border: '1px solid #ddc9aa',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '1rem',
              color: 'var(--ink-700)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#ede0cc'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(253, 250, 245, 0.92)'; }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '1rem',
        left: '1rem',
        zIndex: 10,
        background: 'rgba(253, 250, 245, 0.92)',
        border: '1px solid #ddc9aa',
        borderRadius: '3px',
        padding: '0.625rem 0.875rem',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '0.7rem',
        color: 'var(--ink-500)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <LegendItem color="#c8bfb5" label="Normal" shape="circle" />
          <LegendItem color="#d95e3a" label="Suspicious" shape="circle" />
          <LegendItem color="#c8870a" label="Ring edge" shape="line" />
        </div>
      </div>

      {/* Graph */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '540px',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(237, 224, 204, 0.2) 0%, rgba(253, 250, 245, 0.05) 70%)',
          borderRadius: '3px',
        }}
      />

      {/* Tooltip */}
      {tooltip.visible && tooltip.data && (
        <div className="cy-tooltip" style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}>
          <h4>{tooltip.data.id}</h4>
          <p style={{ color: ScoreColor(tooltip.data.score), fontWeight: 600 }}>
            Score: {tooltip.data.score}/100
          </p>
          {tooltip.data.patterns.length > 0 && (
            <p>{tooltip.data.patterns.join(', ')}</p>
          )}
          {tooltip.data.ringId && <p>Ring: {tooltip.data.ringId}</p>}
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label, shape }: { color: string; label: string; shape: 'circle' | 'line' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
      {shape === 'circle'
        ? <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
        : <div style={{ width: '16px', height: '2px', background: color }} />
      }
      <span>{label}</span>
    </div>
  );
}

export default GraphVisualization;
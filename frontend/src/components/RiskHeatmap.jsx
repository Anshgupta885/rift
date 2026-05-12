/**
 * Risk Heatmap — warm editorial style
 */

function RiskHeatmap({ accounts }) {
  const high = accounts.filter(a => a.suspicion_score >= 70).length;
  const medium = accounts.filter(a => a.suspicion_score >= 40 && a.suspicion_score < 70).length;
  const low = accounts.filter(a => a.suspicion_score < 40).length;
  const total = accounts.length || 1;

  const segments = [
    { label: 'High risk', sublabel: '70 – 100', count: high, pct: (high / total) * 100, color: '#c44a2a', bg: 'rgba(196, 74, 42, 0.1)' },
    { label: 'Medium risk', sublabel: '40 – 69', count: medium, pct: (medium / total) * 100, color: '#c8870a', bg: 'rgba(200, 135, 10, 0.1)' },
    { label: 'Low risk', sublabel: '0 – 39', count: low, pct: (low / total) * 100, color: '#3a5a4a', bg: 'rgba(58, 90, 74, 0.1)' },
  ];

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 600, color: 'var(--ink-900)' }}>
          Risk distribution
        </h3>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: '#a09590' }}>
          {accounts.length} flagged accounts
        </span>
      </div>

      {/* Stacked bar */}
      <div style={{ height: '6px', borderRadius: '3px', overflow: 'hidden', display: 'flex', marginBottom: '1.25rem', background: '#f0e8de' }}>
        {segments.map(s => s.pct > 0 && (
          <div
            key={s.label}
            style={{ width: `${s.pct}%`, background: s.color, transition: 'width 0.5s ease' }}
            title={`${s.label}: ${s.count}`}
          />
        ))}
        {accounts.length === 0 && <div style={{ width: '100%', background: '#e8e0d8' }} />}
      </div>

      {/* Legend */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        {segments.map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: '3px', padding: '0.75rem', border: `1px solid`, borderColor: `${s.color}22` }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>
              {s.count}
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', fontWeight: 600, color: s.color, marginTop: '0.25rem' }}>
              {s.label}
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.65rem', color: '#a09590', marginTop: '0.1rem' }}>
              Score {s.sublabel}
            </p>
          </div>
        ))}
      </div>

      {/* Scale */}
      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #ede0cc' }}>
        <div style={{ height: '4px', borderRadius: '2px', background: 'linear-gradient(to right, #3a5a4a, #c8870a, #c44a2a)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
          {['0', '25', '50', '75', '100'].map(n => (
            <span key={n} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#a09590' }}>{n}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RiskHeatmap;
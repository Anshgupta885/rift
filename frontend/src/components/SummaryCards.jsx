/**
 * Summary Cards — editorial metric display
 */

function SummaryCards({ summary }) {
  const detectionRate = summary.total_accounts_analyzed > 0
    ? ((summary.suspicious_accounts_flagged / summary.total_accounts_analyzed) * 100).toFixed(1)
    : '0.0';

  const cards = [
    {
      label: 'Accounts analysed',
      value: summary.total_accounts_analyzed.toLocaleString(),
      note: 'total in dataset',
      color: 'var(--ink-900)',
    },
    {
      label: 'Flagged suspicious',
      value: summary.suspicious_accounts_flagged.toLocaleString(),
      note: `${detectionRate}% detection rate`,
      color: '#c44a2a',
    },
    {
      label: 'Fraud rings found',
      value: summary.fraud_rings_detected.toLocaleString(),
      note: 'coordinated structures',
      color: '#a06c08',
    },
    {
      label: 'Processing time',
      value: `${summary.processing_time_seconds}s`,
      note: 'full graph traversal',
      color: '#3a5a4a',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1px', background: '#e8e0d8', border: '1px solid #e8e0d8', borderRadius: '4px', overflow: 'hidden' }}>
      {cards.map((card, i) => (
        <div
          key={card.label}
          className="animate-fade-up"
          style={{
            background: 'rgba(253, 250, 245, 0.9)',
            padding: '1.5rem',
            animationDelay: `${i * 0.08}s`,
            animationFillMode: 'both',
          }}
        >
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a09590', marginBottom: '0.5rem' }}>
            {card.label}
          </p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.25rem', fontWeight: 700, color: card.color, lineHeight: 1 }}>
            {card.value}
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#a09590', marginTop: '0.375rem' }}>
            {card.note}
          </p>
        </div>
      ))}
    </div>
  );
}

export default SummaryCards;
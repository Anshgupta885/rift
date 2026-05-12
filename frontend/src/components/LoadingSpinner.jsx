/**
 * Loading Spinner — warm amber
 */

function LoadingSpinner({ size = 'md' }) {
  const sizes = { sm: 20, md: 32, lg: 48 };
  const s = sizes[size];

  return (
    <div style={{ width: s, height: s, animation: 'spin 0.9s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#ddc9aa" strokeWidth="2" />
        <path d="M12 2a10 10 0 0110 10" stroke="#c8870a" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default LoadingSpinner;
